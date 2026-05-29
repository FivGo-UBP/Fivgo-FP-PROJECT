<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderTracking;
use App\Models\DriverProfile;
use Illuminate\Http\Request;

class TrackingController extends Controller
{
    public function tracking(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        
        // Get the latest tracking info for this order
        $tracking = OrderTracking::where('order_id', $id)
            ->latest()
            ->first();
            
        return response()->json($tracking);
    }

    public function nearbyDrivers(Request $request)
    {
        $validated = $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'radius' => 'numeric' // Default could be 5km
        ]);
        
        $radius = $request->input('radius', 5);
        $lat = $validated['lat'];
        $lng = $validated['lng'];

        // Very basic mock query for nearby drivers (Haversine formula approximation)
        // Note: For production, use DB raw queries for geospatial distances.
        $drivers = DriverProfile::where('status', 'online')
            ->whereNotNull('current_lat')
            ->whereNotNull('current_lng')
            ->selectRaw("*, ( 6371 * acos( cos( radians(?) ) *
                cos( radians( current_lat ) )
                * cos( radians( current_lng ) - radians(?)
                ) + sin( radians(?) ) *
                sin( radians( current_lat ) ) )
            ) AS distance", [$lat, $lng, $lat])
            ->having('distance', '<', $radius)
            ->orderBy('distance')
            ->get();
            
        return response()->json($drivers);
    }

    /**
     * Hitung rute dinamis dari backend berdasarkan fase pesanan aktif saat ini.
     *
     * @param Request $request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRoute(Request $request, $id)
    {
        // Load order beserta profil driver jika ada
        $order = Order::with(['driver.driverProfile'])->findOrFail($id);
        
        $startLat = $order->pickup_lat;
        $startLng = $order->pickup_lng;
        $endLat = $order->dropoff_lat;
        $endLng = $order->dropoff_lng;

        // Penentuan titik rute dinamis berdasarkan fase pesanan:
        // 1. accepted/arrived (driver berjalan menuju pickup) -> rute: driver ke pickup
        if (in_array($order->status, ['accepted', 'arrived']) && $order->driver) {
            $profile = $order->driver->driverProfile;
            if ($profile && $profile->current_lat && $profile->current_lng) {
                $startLat = $profile->current_lat;
                $startLng = $profile->current_lng;
                $endLat = $order->pickup_lat;
                $endLng = $order->pickup_lng;
            }
        } 
        // 2. started (dalam perjalanan) -> rute: driver ke dropoff
        elseif ($order->status === 'started' && $order->driver) {
            $profile = $order->driver->driverProfile;
            if ($profile && $profile->current_lat && $profile->current_lng) {
                $startLat = $profile->current_lat;
                $startLng = $profile->current_lng;
                $endLat = $order->dropoff_lat;
                $endLng = $order->dropoff_lng;
            }
        }
        // 3. pending / default -> rute: pickup ke dropoff

        $tomTom = app(\App\Services\TomTomService::class);
        $routeData = $tomTom->calculateRoute(
            (float) $startLat, 
            (float) $startLng, 
            (float) $endLat, 
            (float) $endLng, 
            $order->vehicle_type ?? 'motor'
        );

        return response()->json([
            'order_id' => $id,
            'status' => $order->status,
            'coordinates' => $routeData['coordinates'] ?? [],
            'eta_minutes' => (int) ceil(($routeData['travel_time_seconds'] ?? 0) / 60),
            'distance_km' => round(($routeData['distance_meters'] ?? 0) / 1000, 1),
            'start' => ['lat' => (float)$startLat, 'lng' => (float)$startLng],
            'destination' => ['lat' => (float)$endLat, 'lng' => (float)$endLng]
        ]);
    }
}
