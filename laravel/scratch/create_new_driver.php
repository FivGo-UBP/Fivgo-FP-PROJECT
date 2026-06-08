<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\DriverProfile;
use Illuminate\Support\Facades\Hash;

// 1. Restore Ambalabu's phone number
$ambalabu = User::where('name', 'Ambalabu')->first();
if ($ambalabu) {
    $ambalabu->phone = '+6281286171580';
    $ambalabu->save();
    echo "Ambalabu's phone restored to +6281286171580.\n";
}

// 2. Create new Driver user
$newDriverPhone = '+62 895-0185-8234';

// Check if a driver with this phone already exists to avoid duplicate constraint errors
$existingDriver = User::where('phone', $newDriverPhone)->where('role', 'driver')->first();

if ($existingDriver) {
    echo "Driver with phone {$newDriverPhone} already exists. Updating its name to 'Driver'.\n";
    $existingDriver->name = 'Driver';
    $existingDriver->save();
    $driverUser = $existingDriver;
} else {
    $driverUser = User::create([
        'name' => 'Driver',
        'phone' => $newDriverPhone,
        'role' => 'driver',
        'password' => Hash::make('password'),
        'phone_verified_at' => now(),
        'wallet_balance' => 0
    ]);
    echo "New driver user 'Driver' created successfully.\n";
}

// 3. Ensure DriverProfile exists
$profile = DriverProfile::where('user_id', $driverUser->id)->first();
if (!$profile) {
    DriverProfile::create([
        'user_id' => $driverUser->id,
        'vehicle_type' => 'motor',
        'plate_number' => 'B 3140 FVG',
        'vehicle_brand' => 'Honda Beat',
        'status' => 'offline',
        'rating' => 5.0,
        'wallet_balance' => 0
    ]);
    echo "DriverProfile created successfully.\n";
} else {
    $profile->vehicle_type = 'motor';
    $profile->save();
    echo "DriverProfile verified and updated to 'motor'.\n";
}

echo "\nOperation Completed!\n";
echo "Driver Name: " . $driverUser->name . "\n";
echo "Driver Phone: " . $driverUser->phone . "\n";
