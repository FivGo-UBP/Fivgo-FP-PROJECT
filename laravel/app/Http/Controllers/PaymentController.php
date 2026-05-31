<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Order;
use App\Services\DompetxService;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Throwable;

class PaymentController extends Controller
{
    public function __construct(private DompetxService $dompetx)
    {
    }

    public function preAuth(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'method' => 'required|string',
            'amount' => 'required|integer'
        ]);

        $order = Order::findOrFail($validated['order_id']);
        abort_unless($order->customer_id === $request->user()->id, 403);

        $method = strtolower(DompetxService::normalizeMethod($validated['method']));

        if ($method === 'wallet' || $method === 'fivgopay' || $method === 'fivgo_pay') {
            $user = $request->user();
            if ($user->wallet_balance < $validated['amount']) {
                return response()->json([
                    'message' => 'Saldo FivGo Pay tidak cukup. Silakan top up terlebih dahulu.',
                ], 400);
            }

            $payment = null;

            \Illuminate\Support\Facades\DB::transaction(function () use ($user, $validated, &$payment, $order) {
                // Deduct from wallet balance
                $user->decrement('wallet_balance', $validated['amount']);

                // Create ledger entry in wallet transactions
                \App\Models\WalletTransaction::create([
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'user_id' => $user->id,
                    'amount' => -$validated['amount'],
                    'type' => 'payment',
                    'status' => 'success',
                    'reference' => 'FIVGO-PAY-' . $order->id . '-' . \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(8)),
                    'payment_method' => 'wallet',
                    'description' => 'Pembayaran Perjalanan FivGo (Order #' . substr($order->id, 0, 8) . ')',
                ]);

                // Calculate platform fee (20%)
                $commission = (int)($validated['amount'] * 0.20);
                $netIncome = $validated['amount'] - $commission;

                // Create captured payment record
                $payment = Payment::create([
                    'order_id' => $validated['order_id'],
                    'method' => 'wallet',
                    'gateway' => 'wallet',
                    'total_amount' => $validated['amount'],
                    'status' => 'captured',
                    'commission' => $commission,
                    'net_income' => $netIncome,
                ]);

                // Update order to pending status immediately
                $order->update([
                    'payment_method' => 'wallet',
                    'status' => 'pending'
                ]);
            });

            return response()->json($payment, 201);
        }

        if ($method === 'tunai' || $method === 'cash') {
            $payment = Payment::create([
                'order_id' => $validated['order_id'],
                'method' => 'tunai',
                'total_amount' => $validated['amount'],
                'status' => 'authorized'
            ]);

            return response()->json($payment, 201);
        }

        Payment::where('order_id', $order->id)
            ->where('gateway', 'dompetx')
            ->where('method', '!=', $method)
            ->whereNotIn('status', ['failed', 'cancelled', 'paid', 'captured', 'success', 'settled'])
            ->update(['status' => 'cancelled']);

        $existingPayment = Payment::where('order_id', $order->id)
            ->where('method', $method)
            ->where('gateway', 'dompetx')
            ->whereNotIn('status', ['failed', 'cancelled'])
            ->whereNotNull('transaction_id')
            ->latest()
            ->first();

        if ($existingPayment) {
            return response()->json($existingPayment);
        }

        $reference = 'FIVGO-' . $order->id . '-' . strtoupper($method) . '-' . Str::upper(Str::random(8));

        try {
            $dompetxPayload = [
                'method' => $method,
                'amount' => $validated['amount'],
                'currency' => 'IDR',
                'reference' => $reference,
                'settlementSpeed' => 'standard',
                'metadata' => [
                    'order_id' => $order->id,
                    'customer_id' => $order->customer_id,
                    'payment_method' => $method,
                    'pickup_address' => $order->pickup_address,
                    'dropoff_address' => $order->dropoff_address,
                ],
            ];

            $dompetx = $this->dompetx->createPayment(
                $dompetxPayload,
                'fivgo-payment-' . $reference
            );
        } catch (Throwable $e) {
            $gatewayError = $this->getGatewayErrorMessage($e);

            $payment = Payment::create([
                'order_id' => $validated['order_id'],
                'method' => $method,
                'gateway' => 'dompetx',
                'total_amount' => $validated['amount'],
                'status' => 'failed',
                'gateway_payload' => [
                    'message' => 'DompetX payment creation failed',
                    'error' => $gatewayError,
                    'raw_error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => $gatewayError ?: 'Gagal membuat pembayaran DompetX.',
                'payment' => $payment,
            ], 502);
        }

        $transactionId = DompetxService::extractTransactionId($dompetx);

        $payment = Payment::create([
            'order_id' => $validated['order_id'],
            'method' => $method,
            'gateway' => 'dompetx',
            'total_amount' => $validated['amount'],
            'status' => DompetxService::extractStatus($dompetx, 'pending'),
            'transaction_id' => $transactionId,
            'gateway_payload' => $dompetx,
            'expires_at' => DompetxService::firstPayloadValue($dompetx, [
                'detail.data.expiresAt',
                'detail.expiresAt',
                'data.expiresAt',
                'expiresAt',
            ]),
        ]);

        $order->update(['payment_method' => $method]);
        $this->releaseOrderAfterPayment($payment);

        return response()->json($payment, 201);
    }

    public function capture(Request $request)
    {
        $validated = $request->validate([
            'payment_id' => 'required|exists:payments,id'
        ]);

        $payment = Payment::findOrFail($validated['payment_id']);
        
        // Mock commission calculation (e.g., 20% to platform)
        $commission = (int)($payment->total_amount * 0.20);
        $netIncome = $payment->total_amount - $commission;

        $payment->update([
            'status' => 'captured',
            'commission' => $commission,
            'net_income' => $netIncome
        ]);

        return response()->json($payment);
    }

    public function cancel(Request $request)
    {
        $validated = $request->validate([
            'payment_id' => 'required|exists:payments,id'
        ]);

        $payment = Payment::findOrFail($validated['payment_id']);
        $payment->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Payment cancelled', 'payment' => $payment]);
    }

    public function status(Request $request, $order_id)
    {
        $payment = Payment::where('order_id', $order_id)->latest()->firstOrFail();
        $this->syncPaymentFromStoredPayload($payment);

        if ($payment->gateway === 'dompetx' && $payment->transaction_id && ! in_array(strtolower((string) $payment->status), ['paid', 'captured', 'success', 'settled', 'failed', 'cancelled'], true)) {
            try {
                $dompetxStatus = $this->dompetx->checkStatus($payment->transaction_id);
                $payment->update([
                    'status' => DompetxService::extractStatus($dompetxStatus, $payment->status),
                    'gateway_payload' => array_replace_recursive($payment->gateway_payload ?? [], ['status_check' => $dompetxStatus]),
                ]);
                $payment->refresh();
            } catch (Throwable) {
                // Keep the last known local status if DompetX is temporarily unavailable.
            }
        }

        $this->releaseOrderAfterPayment($payment);

        return response()->json($payment);
    }

    public function webhook(Request $request)
    {
        $payload = $request->all();

        $transactionId = DompetxService::extractTransactionId($payload)
            ?? Arr::get($payload, 'transaction_id');

        if ($transactionId) {
            $payment = Payment::where('transaction_id', $transactionId)->first();

            if ($payment) {
                $status = DompetxService::extractStatus($payload, $payment->status);
                $payment->update([
                    'status' => $status,
                    'gateway_payload' => array_replace_recursive($payment->gateway_payload ?? [], ['webhook' => $payload]),
                ]);
                $this->releaseOrderAfterPayment($payment->refresh());
            }
        }

        return response()->json(['status' => 'success']);
    }

    private function syncPaymentFromStoredPayload(Payment $payment): void
    {
        if ($payment->gateway !== 'dompetx') {
            return;
        }

        $payload = $payment->gateway_payload ?? [];
        $updates = [];

        if (! $payment->transaction_id) {
            $transactionId = DompetxService::extractTransactionId($payload);

            if ($transactionId) {
                $updates['transaction_id'] = $transactionId;
            }
        }

        $payloadStatus = DompetxService::extractStatus($payload);
        if ($payloadStatus && (ctype_digit((string) $payment->status) || ! $payment->status)) {
            $updates['status'] = $payloadStatus;
        }

        if ($updates) {
            $payment->update($updates);
            $payment->refresh();
        }
    }

    private function releaseOrderAfterPayment(Payment $payment): void
    {
        $status = strtolower((string) $payment->status);

        if (! in_array($status, ['paid', 'captured', 'success', 'settled'], true)) {
            return;
        }

        $order = $payment->order;

        if ($order && $order->status === 'payment_pending') {
            $order->update(['status' => 'pending']);
        }
    }

    private function getGatewayErrorMessage(Throwable $e): string
    {
        if ($e instanceof RequestException && $e->response) {
            $message = $e->response->json('message');

            if (is_string($message) && $message !== '') {
                return $message;
            }
        }

        return $e->getMessage();
    }
}
