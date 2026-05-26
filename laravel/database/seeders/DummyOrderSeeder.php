<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Order;
use App\Models\DriverProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DummyOrderSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ambil 1 customer dan 1 driver yang sudah ada di database
        $customer = User::where('role', 'customer')->first();
        $driver = User::where('role', 'driver')->first();

        if (!$customer || !$driver) {
            echo "Error: Database harus memiliki minimal 1 customer dan 1 driver.\n";
            return;
        }

        // Pastikan driver memiliki profile
        DriverProfile::firstOrCreate(
            ['user_id' => $driver->id],
            [
                'vehicle_type' => 'motor',
                'plate_number' => 'T 1234 ABC',
                'rating' => 4.8,
                'status' => 'active'
            ]
        );

        // Hapus order lama milik driver ini agar bersih
        Order::where('driver_id', $driver->id)->delete();

        $orders = [
            [
                'customer_id' => $customer->id,
                'driver_id' => $driver->id,
                'status' => 'completed',
                'vehicle_type' => 'motor',
                'pickup_address' => 'Jalan Candi Jiwa, Desa Telukjambe',
                'pickup_lat' => -6.321,
                'pickup_lng' => 107.298,
                'dropoff_address' => 'Jalan Candi Jiwa, Desa Telukjambe',
                'dropoff_lat' => -6.330,
                'dropoff_lng' => 107.290,
                'estimated_price' => 15000,
                'final_price' => 15000,
                'payment_method' => 'dana',
                'rating' => 5,
                'review' => 'Driver sangat sopan, motor nya sangat bersih. Perjalanan terasa sangat aman meskipun sedang jam sibuk. Terima kasih!',
                'created_at' => now()->subDays(1)->setTime(21, 00),
            ],
            [
                'customer_id' => $customer->id,
                'driver_id' => $driver->id,
                'status' => 'completed',
                'vehicle_type' => 'motor',
                'pickup_address' => 'Jalan Candi Jiwa, Desa Telukjambe',
                'pickup_lat' => -6.321,
                'pickup_lng' => 107.298,
                'dropoff_address' => 'Jalan Candi Jiwa, Desa Telukjambe',
                'dropoff_lat' => -6.330,
                'dropoff_lng' => 107.290,
                'estimated_price' => 25000,
                'final_price' => 25000,
                'payment_method' => 'dana',
                'rating' => 4,
                'review' => 'Sangat cepat dan nyaman.',
                'created_at' => now()->subDays(2)->setTime(14, 30),
            ],
            [
                'customer_id' => $customer->id,
                'driver_id' => $driver->id,
                'status' => 'cancelled',
                'vehicle_type' => 'motor',
                'pickup_address' => 'Universitas Singaperbangsa',
                'pickup_lat' => -6.350,
                'pickup_lng' => 107.300,
                'dropoff_address' => 'Alun-alun Karawang',
                'dropoff_lat' => -6.300,
                'dropoff_lng' => 107.310,
                'estimated_price' => 15000,
                'cancel_reason' => 'Terlalu lama menunggu driver',
                'payment_method' => 'cash',
                'created_at' => now()->subHours(5),
            ]
        ];

        foreach ($orders as $orderData) {
            Order::create($orderData);
        }

        echo "Dummy orders seeded successfully using existing user ID: " . $customer->id . " (Customer) and " . $driver->id . " (Driver)!\n";
    }
}
