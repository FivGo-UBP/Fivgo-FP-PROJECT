<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('ADMIN_EMAIL', 'fivgoubp@gmail.com');
        $password = env('ADMIN_PASSWORD', 'admin12345');

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Admin FivGo',
                'role' => 'admin',
                'email_verified_at' => now(),
                'password' => Hash::make($password),
            ]
        );
    }
}
