<?php

namespace Database\Seeders;

use App\Models\Promo;
use Illuminate\Database\Seeder;

class PromoSeeder extends Seeder
{
    public function run(): void
    {
        // Delete existing promos to avoid duplicate code error
        Promo::query()->delete();

        $promos = [
            [
                'code' => 'FIVGOMOTOR10X',
                'title' => '10x Order FivGO Motor',
                'description' => 'Dapatkan voucher diskon setelah 10x order FivGO Motor diskon Rp10rb*',
                'discount_percent' => 100,
                'max_discount' => 10000,
                'quota' => 999999,
                'used_count' => 0,
                'start_date' => '2026-01-01 00:00:00',
                'end_date' => '2026-12-31 23:59:59',
                'is_active' => true,
                'min_order_amount' => 0,
                'limit_per_user' => 1,
                'applicable_vehicles' => ['motor']
            ],
            [
                'code' => 'FIVGOMOBILBARU',
                'title' => 'Pertama Kali Naik Fivgo Mobil',
                'description' => 'Pertama kali naik Fivgo mobil mendapatkan voucher diskon Rp8.5rb*',
                'discount_percent' => 100,
                'max_discount' => 8500,
                'quota' => 999999,
                'used_count' => 0,
                'start_date' => '2026-01-01 00:00:00',
                'end_date' => '2026-12-31 23:59:59',
                'is_active' => true,
                'min_order_amount' => 0,
                'limit_per_user' => 1,
                'applicable_vehicles' => ['mobil']
            ],
            [
                'code' => 'FIVGOMOTORBARU',
                'title' => 'Pertama Kali Naik Fivgo Motor',
                'description' => 'Pertama kali naik Fivgo motor mendapatkan voucher diskon Rp5rb*',
                'discount_percent' => 100,
                'max_discount' => 5000,
                'quota' => 999999,
                'used_count' => 0,
                'start_date' => '2026-01-01 00:00:00',
                'end_date' => '2026-12-31 23:59:59',
                'is_active' => true,
                'min_order_amount' => 0,
                'limit_per_user' => 1,
                'applicable_vehicles' => ['motor']
            ]
        ];

        foreach ($promos as $promo) {
            Promo::create($promo);
        }
    }
}
