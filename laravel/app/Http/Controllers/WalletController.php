<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\WalletTransaction;
use App\Services\DompetxService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Arr;
use Throwable;

class WalletController extends Controller
{
    public function __construct(private DompetxService $dompetx)
    {
    }

    /**
     * Get wallet balance and recent transactions.
     */
    public function balance(Request $request)
    {
        $user = $request->user();
        
        // Clean up any stale rejected orders first (older than 3 minutes)
        \App\Models\Order::cleanUpStaleRejectedOrders($user->id);
        
        // Cek apakah ada topup pending yang perlu di-sync dari DompetX
        $pendingTopups = WalletTransaction::where('user_id', $user->id)
            ->where('type', 'topup')
            ->where('status', 'pending')
            ->whereNotNull('transaction_id')
            ->get();

        foreach ($pendingTopups as $topup) {
            try {
                $dompetxStatus = $this->dompetx->checkStatus($topup->transaction_id);
                $status = DompetxService::extractStatus($dompetxStatus, 'pending');

                if (in_array(strtolower($status), ['paid', 'captured', 'success', 'settled'], true)) {
                    $topup->update([
                        'status' => 'success',
                        'gateway_payload' => array_replace_recursive($topup->gateway_payload ?? [], ['status_check' => $dompetxStatus]),
                    ]);
                    $user->increment('wallet_balance', $topup->amount);
                } else if (in_array(strtolower($status), ['failed', 'expired', 'cancelled'], true)) {
                    $topup->update([
                        'status' => 'failed',
                        'gateway_payload' => array_replace_recursive($topup->gateway_payload ?? [], ['status_check' => $dompetxStatus]),
                    ]);
                }
            } catch (Throwable) {
                // Keep pending if gateway is down
            }
        }

        // Refresh user model to get updated balance
        $user->refresh();

        $transactions = WalletTransaction::where('user_id', $user->id)
            ->latest()
            ->limit(10)
            ->get();

        return response()->json([
            'balance' => $user->wallet_balance,
            'transactions' => $transactions,
        ]);
    }

    /**
     * Initiate a wallet top-up.
     */
    public function topup(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|integer|min:10000',
            'method' => 'required|string',
        ]);

        $user = $request->user();
        $method = DompetxService::normalizeMethod($validated['method']);

        // Generate custom reference for this wallet top-up
        $reference = 'FIVGO-TOPUP-' . $user->id . '-' . strtoupper($method) . '-' . Str::upper(Str::random(8));

        // Create pending wallet transaction log
        $transaction = WalletTransaction::create([
            'user_id' => $user->id,
            'amount' => $validated['amount'],
            'type' => 'topup',
            'status' => 'pending',
            'reference' => $reference,
            'payment_method' => $method,
            'description' => 'Top Up Saldo FivGo Pay (' . strtoupper($method) . ')',
        ]);

        try {
            $dompetxPayload = [
                'method' => $method,
                'amount' => $validated['amount'],
                'currency' => 'IDR',
                'reference' => $reference,
                'settlementSpeed' => 'standard',
                'metadata' => [
                    'topup_id' => $transaction->id,
                    'user_id' => $user->id,
                    'type' => 'topup',
                ],
            ];

            // Create payment in DompetX
            $dompetx = $this->dompetx->createPayment(
                $dompetxPayload,
                'fivgo-topup-' . $reference
            );

            $transactionId = DompetxService::extractTransactionId($dompetx);

            $transaction->update([
                'transaction_id' => $transactionId,
                'gateway_payload' => $dompetx,
            ]);

            return response()->json([
                'message' => 'Topup initiated successfully',
                'transaction' => $transaction,
            ], 201);

        } catch (Throwable $e) {
            $transaction->update([
                'status' => 'failed',
                'gateway_payload' => [
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Gagal membuat pembayaran DompetX: ' . $e->getMessage(),
                'transaction' => $transaction,
            ], 502);
        }
    }

    /**
     * Webhook to process DompetX callback.
     */
    public function webhook(Request $request)
    {
        $payload = $request->all();

        $reference = Arr::get($payload, 'reference') 
            ?? Arr::get($payload, 'detail.data.reference')
            ?? Arr::get($payload, 'data.reference');

        if (!$reference) {
            // Try to look up by transaction_id
            $transactionId = DompetxService::extractTransactionId($payload)
                ?? Arr::get($payload, 'transaction_id');

            if ($transactionId) {
                $transaction = WalletTransaction::where('transaction_id', $transactionId)->first();
            } else {
                return response()->json(['message' => 'Reference not found'], 400);
            }
        } else {
            $transaction = WalletTransaction::where('reference', $reference)->first();
        }

        if ($transaction && $transaction->status === 'pending') {
            $status = DompetxService::extractStatus($payload, 'pending');

            if (in_array(strtolower($status), ['paid', 'captured', 'success', 'settled'], true)) {
                // Update transaction status to success
                $transaction->update([
                    'status' => 'success',
                    'gateway_payload' => array_replace_recursive($transaction->gateway_payload ?? [], ['webhook' => $payload]),
                ]);

                // Credit user's wallet balance
                $user = User::find($transaction->user_id);
                if ($user) {
                    $user->increment('wallet_balance', $transaction->amount);
                }
            } else if (in_array(strtolower($status), ['failed', 'expired', 'cancelled'], true)) {
                $transaction->update([
                    'status' => 'failed',
                    'gateway_payload' => array_replace_recursive($transaction->gateway_payload ?? [], ['webhook' => $payload]),
                ]);
            }
        }

        return response()->json(['status' => 'success']);
    }

    public function withdraw(Request $request) 
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'amount' => 'required|integer|min:20000',
            'bank_name' => 'required|string',
            'account_number' => 'required|string',
            'account_name' => 'required|string',
        ]);

        if ($user->wallet_balance < $validated['amount']) {
            return response()->json(['message' => 'Saldo tidak mencukupi untuk melakukan penarikan.'], 400);
        }

        // 1. Kurangi saldo driver terlebih dahulu
        $user->decrement('wallet_balance', $validated['amount']);

        // 2. Catat transaksi sebagai payout dengan status pending
        $reference = 'FIVGO-WD-' . $user->id . '-' . Str::upper(Str::random(8));
        $transaction = WalletTransaction::create([
            'user_id' => $user->id,
            'amount' => -$validated['amount'], // Debit
            'type' => 'payout',
            'status' => 'pending',
            'reference' => $reference,
            'payment_method' => $validated['bank_name'],
            'description' => 'Penarikan Dana ke ' . strtoupper($validated['bank_name']) . ' a.n ' . $validated['account_name'],
            'gateway_payload' => [
                'account_number' => $validated['account_number'],
                'account_name' => $validated['account_name']
            ]
        ]);

        return response()->json([
            'message' => 'Pengajuan penarikan dana berhasil dikirim.',
            'transaction' => $transaction
        ], 201);
    }
}
