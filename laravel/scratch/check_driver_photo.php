<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
$order = Order::with('driver')->orderBy('created_at', 'desc')->first();
if ($order) {
    echo "Order ID: " . $order->id . "\n";
    echo "Driver ID: " . ($order->driver ? $order->driver->id : 'None') . "\n";
    echo "Driver Name: " . ($order->driver ? $order->driver->name : 'None') . "\n";
    echo "Raw DB Photo: " . ($order->driver ? $order->driver->getRawOriginal('photo') : 'None') . "\n";
    echo "Accessor Photo: " . ($order->driver ? $order->driver->photo : 'None') . "\n";
} else {
    echo "No orders found.\n";
}
