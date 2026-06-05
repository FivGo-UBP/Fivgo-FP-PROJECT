<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\DriverProfile;

$validated = [
    'pickup_lat' => -6.09504000,
    'pickup_lng' => 107.40358700,
    'vehicle_type' => 'motor'
];
$requestedVehicleType = strtolower($validated['vehicle_type'] ?? 'motor');

$query = DriverProfile::where('status', 'online')
    ->where('updated_at', '>=', now()->subSeconds(60))
    ->whereHas('user', function($q) {
        $q->where('wallet_balance', '>=', -50000);
    })
    ->where(function($query) use ($requestedVehicleType) {
        if (in_array($requestedVehicleType, ['motor', 'motorcycle', 'bike'], true)) {
            $query->whereIn('vehicle_type', ['motor', 'motorcycle', 'bike']);
        } else if (in_array($requestedVehicleType, ['mobil', 'car', 'automobile'], true)) {
            $query->whereIn('vehicle_type', ['mobil', 'car', 'automobile']);
        }
    })
    ->whereNotNull('current_lat')
    ->whereNotNull('current_lng');

echo "SQL: " . $query->toSql() . "\n";
echo "Bindings: " . json_serialize_clean($query->getBindings()) . "\n\n";

$closestDriver = $query->selectRaw("*, ( 6371 * acos( cos( radians(?) ) *
        cos( radians( current_lat ) )
        * cos( radians( current_lng ) - radians(?)
        ) + sin( radians(?) ) *
        sin( radians( current_lat ) ) )
    ) AS distance", [$validated['pickup_lat'], $validated['pickup_lng'], $validated['pickup_lat']])
    ->orderBy('distance', 'asc')
    ->first();

if ($closestDriver) {
    echo "Found closest driver: " . $closestDriver->user_id . "\n";
    echo "  Name: " . ($closestDriver->user ? $closestDriver->user->name : 'N/A') . "\n";
    echo "  Distance: " . $closestDriver->distance . " km\n";
} else {
    echo "NO driver found by the query.\n";
}

function json_serialize_clean($bindings) {
    return json_encode(array_map(function($b) {
        if ($b instanceof \DateTimeInterface) {
            return $b->format('Y-m-d H:i:s');
        }
        return $b;
    }, $bindings));
}
