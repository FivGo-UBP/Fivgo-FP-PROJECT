<?php

$user = \App\Models\User::where('role', 'driver')->first();
if (!$user) {
    echo "Tidak ada driver ditemukan.\n";
    exit;
}

\App\Models\ProfileUpdateRequest::create([
    'user_id' => $user->id,
    'type' => 'telepon',
    'old_data' => ['telepon' => '08123456789'],
    'new_data' => ['telepon' => '08987654321'],
    'status' => 'pending',
    'notes' => 'Nomor lama sudah hangus',
]);

\App\Models\ProfileUpdateRequest::create([
    'user_id' => $user->id,
    'type' => 'foto',
    'old_data' => ['photo' => 'https://via.placeholder.com/150/FF0000/FFFFFF?text=Lama'],
    'new_data' => ['photo' => 'https://via.placeholder.com/150/0000FF/FFFFFF?text=Baru'],
    'status' => 'pending',
    'notes' => 'Ganti foto yang lebih jelas',
]);

\App\Models\ProfileUpdateRequest::create([
    'user_id' => $user->id,
    'type' => 'kendaraan',
    'old_data' => ['tipe_kendaraan' => 'Honda Beat 2018', 'plat_kendaraan' => 'B 1234 ABC'],
    'new_data' => ['tipe_kendaraan' => 'Yamaha NMAX 2022', 'plat_kendaraan' => 'B 5678 XYZ', 'stnk' => 'https://via.placeholder.com/300x200/000000/FFFFFF?text=STNK+Baru'],
    'status' => 'pending',
    'notes' => 'Ganti motor baru',
]);

\App\Models\ProfileUpdateRequest::create([
    'user_id' => $user->id,
    'type' => 'delete',
    'old_data' => [],
    'new_data' => ['reason' => 'Sudah dapat pekerjaan tetap di tempat lain'],
    'status' => 'pending',
    'notes' => 'Tolong segera diproses',
]);

echo "Berhasil membuat 4 data dummy.\n";
