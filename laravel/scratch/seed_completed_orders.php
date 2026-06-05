<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Order;

$customerId = '019e6f31-81bd-70a9-8dd8-a2b2c7760532';
$driver = User::where('role', 'driver')->first();

if (!$driver) {
    echo "NO driver found to associate orders with.\n";
    exit(1);
}

$count = Order::where('customer_id', $customerId)
    ->where('vehicle_type', 'motor')
    ->where('status', 'completed')
    ->count();

echo "Current completed motor orders for customer: {$count}\n";

if ($count < 10) {
    $needed = 10 - $count;
    echo "Creating {$needed} mock completed motor orders...\n";
    for ($i = 0; $i < $needed; $i++) {
        Order::create([
            'customer_id' => $customerId,
            'driver_id' => $driver->id,
            'pickup_address' => 'Mock Pickup Location',
            'pickup_lat' => -6.09504000,
            'pickup_lng' => 107.40358700,
            'dropoff_address' => 'Mock Dropoff Location',
            'dropoff_lat' => -6.09504000,
            'dropoff_lng' => 107.40358700,
            'status' => 'completed',
            'vehicle_type' => 'motor',
            'estimated_price' => 15000,
            'final_price' => 15000,
            'payment_method' => 'tunai',
        ]);
    }
    
    $newCount = Order::where('customer_id', $customerId)
        ->where('vehicle_type', 'motor')
        ->where('status', 'completed')
        ->count();
        
    echo "New completed motor orders count: {$newCount}\n";
} else {
    echo "Customer already has 10 or more completed motor orders!\n";
}
