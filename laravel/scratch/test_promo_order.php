<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Promo;
use App\Models\Order;

$customerId = '019e6f31-81bd-70a9-8dd8-a2b2c7760532';
$customer = User::find($customerId);

if (!$customer) {
    echo "Customer not found!\n";
    exit;
}

echo "Customer: " . $customer->name . " (ID: " . $customer->id . ")\n";

// Count completed motor orders
$completedMotorOrders = Order::where('customer_id', $customerId)
    ->where('vehicle_type', 'motor')
    ->where('status', 'completed')
    ->count();
echo "Completed motor orders count: " . $completedMotorOrders . "\n";

$promoCode = 'FIVGOMOTOR10X';
$promo = Promo::where('code', $promoCode)->first();

if (!$promo) {
    echo "Promo not found in DB!\n";
    exit;
}

echo "Promo info:\n";
echo "  ID: " . $promo->id . "\n";
echo "  Is Active: " . ($promo->is_active ? 'YES' : 'NO') . "\n";
echo "  Start Date: " . $promo->start_date . "\n";
echo "  End Date: " . $promo->end_date . "\n";
echo "  Quota: " . $promo->quota . "\n";
echo "  Used Count: " . $promo->used_count . "\n";
echo "  Min Order Amount: " . $promo->min_order_amount . "\n";
echo "  Limit Per User: " . $promo->limit_per_user . "\n";
echo "  Applicable Vehicles: " . json_encode($promo->applicable_vehicles) . "\n";

// Let's run the validation logic from OrderController:
$now = now();
echo "Current Time (server): " . $now . "\n";

$promoCheck = Promo::where('code', $promoCode)
    ->where('is_active', true)
    ->where('start_date', '<=', $now)
    ->where('end_date', '>=', $now)
    ->first();

if (!$promoCheck) {
    echo "Promo validation FAILED: not found, inactive, or expired relative to current time.\n";
} else {
    echo "Promo validation: Found and active.\n";
}

$usageCount = Order::where('customer_id', $customerId)
    ->where('promo_id', $promo->id)
    ->whereIn('status', ['completed', 'pending', 'accepted', 'started'])
    ->count();
echo "Promo usage count by user: " . $usageCount . " (Limit: " . $promo->limit_per_user . ")\n";

if ($usageCount >= $promo->limit_per_user) {
    echo "Promo validation FAILED: Exceeded limit per user.\n";
}
