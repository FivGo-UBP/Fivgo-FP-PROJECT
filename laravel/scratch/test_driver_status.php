<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$status = $kernel->handle(
    $input = new Symfony\Component\Console\Input\ArgvInput,
    new Symfony\Component\Console\Output\ConsoleOutput
);

use App\Models\User;
use App\Models\DriverProfile;

$user = User::where('role', 'driver')->first();
if ($user) {
    echo "Found driver user: " . $user->name . " (" . $user->id . "), wallet_balance: " . $user->wallet_balance . "\n";
    $profile = DriverProfile::where('user_id', $user->id)->first();
    if ($profile) {
        echo "Found profile status: " . $profile->status . ", wallet_balance: " . $profile->wallet_balance . "\n";
        
        // Let's check update status
        try {
            $profile->update(['status' => 'online']);
            echo "Updated profile status to online successfully!\n";
            $profile->refresh();
            echo "New status in DB: " . $profile->status . "\n";
            
            // Revert back
            $profile->update(['status' => 'offline']);
            echo "Reverted status to offline successfully!\n";
        } catch (\Exception $e) {
            echo "Error updating status: " . $e->getMessage() . "\n";
        }
    } else {
        echo "DriverProfile NOT found for user ID: " . $user->id . "\n";
    }
} else {
    echo "No driver user found.\n";
}
