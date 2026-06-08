<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\DriverProfile;

// Find the driver user
$driver = User::where('name', 'Driver User')->orWhere('role', 'driver')->first();

if ($driver) {
    echo "Current Driver Details:\n";
    echo "ID: " . $driver->id . "\n";
    echo "Name: " . $driver->name . "\n";
    echo "Current Phone: " . $driver->phone . "\n";

    // Update phone number
    $newPhone = '+62 895-0185-8234';
    $driver->phone = $newPhone;
    $driver->phone_verified_at = now();
    $driver->save();

    // Ensure the driver profile has vehicle_type 'motor'
    $profile = DriverProfile::where('user_id', $driver->id)->first();
    if ($profile) {
        $profile->vehicle_type = 'motor';
        $profile->save();
        echo "Profile vehicle type updated to 'motor'.\n";
    }

    echo "\nDriver successfully updated!\n";
    echo "New Phone: " . $driver->phone . "\n";
} else {
    echo "Driver not found.\n";
}
