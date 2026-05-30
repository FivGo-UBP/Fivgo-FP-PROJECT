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
}
