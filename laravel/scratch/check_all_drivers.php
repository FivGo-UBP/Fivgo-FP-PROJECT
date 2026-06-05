<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DriverProfile;

$drivers = DriverProfile::with('user')->get();

echo "Found " . $drivers->count() . " drivers in the database:\n";
foreach ($drivers as $d) {
    echo "Driver ID: " . $d->user_id . "\n";
    echo "  Name: " . ($d->user ? $d->user->name : 'N/A') . "\n";
    echo "  Status: " . $d->status . "\n";
    echo "  Vehicle Type: " . $d->vehicle_type . "\n";
    echo "  Wallet Balance: " . ($d->user ? $d->user->wallet_balance : 'N/A') . "\n";
    echo "  Updated At: " . $d->updated_at . "\n";
    echo "  Current Loc: " . $d->current_lat . ", " . $d->current_lng . "\n\n";
}
