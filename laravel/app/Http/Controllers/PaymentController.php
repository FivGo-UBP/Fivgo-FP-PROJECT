<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Order;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function preAuth(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'method' => 'required|string',
            'amount' => 'required|integer'
        ]);

        $payment = Payment::create([
            'order_id' => $validated['order_id'],
            'method' => $validated['method'],
            'total_amount' => $validated['amount'],
            'status' => 'authorized'
        ]);

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
        $payment = Payment::where('order_id', $order_id)->firstOrFail();
        return response()->json($payment);
    }

    public function webhook(Request $request)
    {
        // Handle third party payment gateways like Midtrans, Xendit, Stripe, etc.
        $payload = $request->all();
        // Mock success
        return response()->json(['status' => 'success']);
    }
}
