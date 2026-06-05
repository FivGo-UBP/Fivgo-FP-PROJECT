<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\DriverProfile;

$driverId = '019e5dd2-a5c0-7016-a4d6-226ee7c12959';
$user = User::find($driverId);

if (!$user) {
    echo "Driver user Ambalabu not found!\n";
    exit(1);
}

$profile = DriverProfile::where('user_id', $driverId)->first();

if (!$profile) {
    echo "Driver profile not found!\n";
    exit(1);
}

// Update vehicle type to 'mobil' and status to 'online'
$profile->update([
    'vehicle_type' => 'mobil',
    'status' => 'online',
    'current_lat' => -6.09504000,
    'current_lng' => 107.40358700,
    'updated_at' => now()
]);

// Ensure driver wallet has positive balance
$user->update([
    'wallet_balance' => 50000
]);

echo "Updated Ambalabu driver:\n";
echo "  Vehicle Type: " . $profile->vehicle_type . "\n";
echo "  Status: " . $profile->status . "\n";
echo "  Wallet Balance: " . $user->wallet_balance . "\n";
echo "  Updated At: " . $profile->updated_at . "\n";
