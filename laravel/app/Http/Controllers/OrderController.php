<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function create(Request $request)
    {
        $validated = $request->validate([
            'pickup_address' => 'required|string',
            'pickup_lat' => 'required|numeric',
            'pickup_lng' => 'required|numeric',
            'dropoff_address' => 'required|string',
            'dropoff_lat' => 'required|numeric',
            'dropoff_lng' => 'required|numeric',
            'payment_method' => 'nullable|string',
            'vehicle_type' => 'nullable|string',
            'notes' => 'nullable|string',
            'estimated_price' => 'nullable|numeric',
        ]);

        $validated['customer_id'] = $request->user()->id;
        $validated['status'] = 'pending';

        // Use provided estimated_price or calculate a mock one
        if (!isset($validated['estimated_price'])) {
            $validated['estimated_price'] = rand(10000, 50000);
        }

        // Temukan driver aktif terdekat (tanpa limit radius mutlak agar pasti dapat)
        $closestDriver = \App\Models\DriverProfile::where('status', 'online')
            ->whereNotNull('current_lat')
            ->whereNotNull('current_lng')
            ->selectRaw("*, ( 6371 * acos( cos( radians(?) ) *
                cos( radians( current_lat ) )
                * cos( radians( current_lng ) - radians(?)
                ) + sin( radians(?) ) *
                sin( radians( current_lat ) ) )
            ) AS distance", [$validated['pickup_lat'], $validated['pickup_lng'], $validated['pickup_lat']])
            ->orderBy('distance', 'asc')
            ->first();

        if (!$closestDriver) {
            return response()->json(['message' => 'Saat ini tidak ada driver yang tersedia.'], 404);
        }

        $validated['driver_id'] = $closestDriver->user_id;

        $order = Order::create($validated);

        return response()->json($order, 201);
    }

    public function detail(Request $request, $id)
    {
        $order = Order::with(['customer', 'driver'])->findOrFail($id);
        return response()->json($order);
    }

    public function active(Request $request)
    {
        $user = $request->user();
        $query = Order::with(['customer', 'driver.driverProfile'])
            ->whereNotIn('status', ['completed', 'cancelled', 'rejected']);
        
        if ($user->role === 'customer') {
            $query->where('customer_id', $user->id);
        } else if ($user->role === 'driver') {
            // Hanya dapatkan order jika driver_id sama dengan id user driver tersebut.
            $query->where('driver_id', $user->id);
            // Prioritize orders assigned to this driver over new pending orders
            $query->orderBy('driver_id', 'desc');
        } else {
            $query->where('status', 'pending');
        }

        // Ambil data terbaru (jika ada order lama yang tersangkut)
        $order = $query->latest()->first();

        if (!$order) {
            return response()->json(null);
        }

        return response()->json([
            'id'              => $order->id,
            'status'          => $order->status,
            'vehicle_type'    => $order->vehicle_type,
            'pickup_address'  => $order->pickup_address,
            'pickup_lat'      => $order->pickup_lat,
            'pickup_lng'      => $order->pickup_lng,
            'dropoff_address' => $order->dropoff_address,
            'dropoff_lat'     => $order->dropoff_lat,
            'dropoff_lng'     => $order->dropoff_lng,
            'estimated_price' => $order->estimated_price,
            'final_price'     => $order->final_price,
            'payment_method'  => $order->payment_method,
            'notes'           => $order->notes,
            'created_at'      => $order->created_at,
            'customer'        => $order->customer ? [
                'id'    => $order->customer->id,
                'name'  => $order->customer->name,
                'photo' => $order->customer->photo,
                'phone' => $order->customer->phone,
                'rating' => null,
            ] : null,
            'driver'          => $order->driver ? [
                'id'           => $order->driver->id,
                'name'         => $order->driver->name,
                'photo'        => $order->driver->photo,
                'phone'        => $order->driver->phone,
                'vehicle_type' => $order->driver->driverProfile?->vehicle_type,
                'plate_number' => $order->driver->driverProfile?->plate_number,
                'rating'       => $order->driver->driverProfile?->rating,
                'current_lat'  => $order->driver->driverProfile?->current_lat,
                'current_lng'  => $order->driver->driverProfile?->current_lng,
            ] : null,
        ]);
    }

    public function accept(Request $request, $id)
    {
        $order = Order::where('status', 'pending')->findOrFail($id);
        
        $order->update([
            'driver_id' => $request->user()->id,
            'status' => 'accepted'
        ]);

        return response()->json($order);
    }

    public function arrived(Request $request, $id)
    {
        $order = Order::where('driver_id', $request->user()->id)
            ->where('status', 'accepted')
            ->findOrFail($id);

        $order->update(['status' => 'arrived']);
        return response()->json($order);
    }

    public function start(Request $request, $id)
    {
        $order = Order::where('driver_id', $request->user()->id)
            ->whereIn('status', ['accepted', 'arrived'])
            ->findOrFail($id);
            
        $order->update(['status' => 'started']);
        return response()->json($order);
    }

    public function complete(Request $request, $id)
    {
        $order = Order::where('driver_id', $request->user()->id)
            ->where('status', 'started')
            ->findOrFail($id);
            
        $order->update([
            'status' => 'completed',
            'final_price' => $order->final_price ?? $order->estimated_price
        ]);
        
        return response()->json($order);
    }

    public function cancel(Request $request, $id)
    {
        $order = Order::where('customer_id', $request->user()->id)
            ->whereIn('status', ['pending', 'accepted'])
            ->findOrFail($id);
            
        $order->update([
            'status' => 'cancelled',
            'cancel_reason' => $request->input('reason', 'User cancelled')
        ]);
        
        return response()->json($order);
    }

    public function reject(Request $request, $id)
    {
        $order = Order::where('driver_id', $request->user()->id)
            ->where('status', 'accepted')
            ->findOrFail($id);
            
        $order->update([
            'status' => 'rejected',
            'driver_id' => null // Re-assignable to another driver
        ]);
        
        return response()->json($order);
    }

    public function rating(Request $request, $id)
    {
        $order = Order::where('customer_id', $request->user()->id)
            ->where('status', 'completed')
            ->findOrFail($id);
            
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string'
        ]);
        
        $order->update($validated);
        
        // Update driver rating here (mocked)
        if ($order->driver && $order->driver->driverProfile) {
            $profile = $order->driver->driverProfile;
            $profile->rating = (($profile->rating * 10) + $validated['rating']) / 11; // Dummy math
            $profile->save();
        }
        
        return response()->json($order);
    }
}
