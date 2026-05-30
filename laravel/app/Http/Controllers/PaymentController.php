<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Order;
use App\Services\DompetxService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
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

        $method = DompetxService::normalizeMethod($validated['method']);

        if ($method === 'TUNAI' || $method === 'CASH') {
            $payment = Payment::create([
                'order_id' => $validated['order_id'],
                'method' => 'tunai',
                'total_amount' => $validated['amount'],
                'status' => 'authorized'
            ]);

            return response()->json($payment, 201);
        }

        try {
            $dompetxPayload = [
                'method' => $method,
                'amount' => $validated['amount'],
                'currency' => 'IDR',
                'reference' => 'FIVGO-' . $order->id,
                'settlementSpeed' => 'standard',
                'metadata' => [
                    'order_id' => $order->id,
                    'customer_id' => $order->customer_id,
                    'pickup_address' => $order->pickup_address,
                    'dropoff_address' => $order->dropoff_address,
                ],
            ];

            $dompetx = $this->dompetx->createPayment(
                $dompetxPayload,
                'fivgo-payment-' . $order->id . '-' . $method
            );
        } catch (Throwable $e) {
            $payment = Payment::create([
                'order_id' => $validated['order_id'],
                'method' => $method,
                'gateway' => 'dompetx',
                'total_amount' => $validated['amount'],
                'status' => 'failed',
                'gateway_payload' => [
                    'message' => 'DompetX payment creation failed',
                    'error' => $e->getMessage(),
                ],
            ]);

            return response()->json([
                'message' => 'Gagal membuat pembayaran DompetX.',
                'payment' => $payment,
            ], 502);
        }

        $detail = Arr::get($dompetx, 'detail', []);

        $payment = Payment::create([
            'order_id' => $validated['order_id'],
            'method' => $method,
            'gateway' => 'dompetx',
            'total_amount' => $validated['amount'],
            'status' => Arr::get($detail, 'status', Arr::get($dompetx, 'status', 'pending')),
            'transaction_id' => Arr::get($dompetx, 'id'),
            'gateway_payload' => $dompetx,
            'expires_at' => Arr::get($detail, 'expiresAt'),
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

        if ($payment->gateway === 'dompetx' && $payment->transaction_id && ! in_array($payment->status, ['paid', 'captured', 'success', 'settled', 'failed', 'cancelled'], true)) {
            try {
                $dompetxStatus = $this->dompetx->checkStatus($payment->transaction_id);
                $payment->update([
                    'status' => Arr::get($dompetxStatus, 'status', Arr::get($dompetxStatus, 'detail.status', Arr::get($dompetxStatus, 'data.status', $payment->status))),
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

        $transactionId = Arr::get($payload, 'id')
            ?? Arr::get($payload, 'transaction_id')
            ?? Arr::get($payload, 'payment.id');

        if ($transactionId) {
            $payment = Payment::where('transaction_id', $transactionId)->first();

            if ($payment) {
                $status = Arr::get($payload, 'status', Arr::get($payload, 'detail.status', Arr::get($payload, 'payment.status', $payment->status)));
                $payment->update([
                    'status' => $status,
                    'gateway_payload' => array_replace_recursive($payment->gateway_payload ?? [], ['webhook' => $payload]),
                ]);
                $this->releaseOrderAfterPayment($payment->refresh());
            }
        }

        return response()->json(['status' => 'success']);
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
}
