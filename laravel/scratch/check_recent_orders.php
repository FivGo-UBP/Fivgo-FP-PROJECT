<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;

$customerId = '019e6f31-81bd-70a9-8dd8-a2b2c7760532';
$orders = Order::where('customer_id', $customerId)
    ->orderBy('created_at', 'desc')
    ->get();

if ($orders->isEmpty()) {
    echo "NO orders found for this customer.\n";
} else {
    echo "Found " . $orders->count() . " orders for this customer:\n";
    foreach ($orders as $order) {
        echo "Order ID: " . $order->id . "\n";
        echo "  Driver ID: " . ($order->driver_id ?: 'NULL') . "\n";
        echo "  Status: " . $order->status . "\n";
        echo "  Vehicle Type: " . $order->vehicle_type . "\n";
        echo "  Price: " . $order->estimated_price . " (final: " . ($order->final_price ?: 'N/A') . ")\n";
        echo "  Discount: " . ($order->discount_amount ?: 0) . " (Promo: " . ($order->promo?->code ?: 'N/A') . ")\n";
        echo "  Payment: " . $order->payment_method . "\n";
        echo "  Pickup: " . $order->pickup_address . "\n";
        echo "  Cancel Reason: " . ($order->cancel_reason ?: 'N/A') . "\n";
        echo "  Created At: " . $order->created_at . "\n\n";
    }
}

