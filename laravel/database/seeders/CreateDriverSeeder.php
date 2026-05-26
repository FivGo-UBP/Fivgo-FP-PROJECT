<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\DriverProfile;
use Illuminate\Support\Facades\Hash;

class CreateDriverSeeder extends Seeder
{
    public function run()
    {
        // 1. Delete the incorrect one
        $wrongUser = User::where('phone', '081286171580')->first();
        if ($wrongUser) {
            DriverProfile::where('user_id', $wrongUser->id)->delete();
            $wrongUser->delete();
        }

        // 2. Find existing +62 user or create
        $user = User::where('phone', '+6281286171580')->first();
        if ($user) {
            $user->update(['role' => 'driver']);
        } else {
            $user = User::create([
                'phone' => '+6281286171580',
                'name' => 'Driver User',
                'role' => 'driver',
                'phone_verified_at' => now(),
                'password' => Hash::make('password123')
            ]);
        }

        // 3. Ensure DriverProfile exists
        if (!$user->driverProfile) {
            DriverProfile::create([
                'user_id' => $user->id,
                'status' => 'active',
                'vehicle_type' => 'motorcycle',
                'rating' => 5.0,
                'wallet_balance' => 0
            ]);
        }

        echo "Driver setup complete for +6281286171580.\n";
    }
}
