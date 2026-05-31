<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    private const STALE_ACTIVE_ORDER_MINUTES = [
        'payment_pending' => 30,
        'pending' => 30,
        'accepted' => 360,
        'arrived' => 360,
        'started' => 720,
    ];

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
        $validated['status'] = $this->requiresPrepaidPayment($validated['payment_method'] ?? null)
            ? 'payment_pending'
            : 'pending';

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
            $query->whereIn('status', ['pending', 'accepted', 'arrived', 'started']);
            // Prioritize orders assigned to this driver over new pending orders
            $query->orderBy('driver_id', 'desc');
        } else {
            $query->where('status', 'pending');
        }

        // Ambil data terbaru (jika ada order lama yang tersangkut)
        $order = $query->latest()->first();

        if (!($order instanceof Order)) {
            return response()->json(null);
        }

        if ($this->cancelStaleActiveOrder($order)) {
            return response()->json(null);
        }

        // AUTO DISPATCH/RE-ASSIGNMENT LOGIC FOR CUSTOMER ACTIVE ORDER
        if ($user->role === 'customer' && $order->status === 'pending' && is_null($order->driver_id)) {
            // Hanya cari driver berikutnya jika penolakan terjadi lebih dari 2 detik yang lalu
            // Ini agar aplikasi customer sempat menampilkan status "Mencari Driver..." selama 1 kali interval polling
            $secondsSinceRejection = now()->timestamp - $order->updated_at->timestamp;
            if ($secondsSinceRejection >= 2) {
                // Extract already rejected driver IDs
                $excludedDriverIds = [];
                if ($order->cancel_reason && str_starts_with($order->cancel_reason, 'rejected:')) {
                    $idsStr = substr($order->cancel_reason, 9);
                    $excludedDriverIds = explode(',', $idsStr);
                }

                // Find next closest active driver
                $closestDriver = \App\Models\DriverProfile::where('status', 'online')
                    ->whereNotIn('user_id', $excludedDriverIds)
                    ->whereNotNull('current_lat')
                    ->whereNotNull('current_lng')
                    ->selectRaw("*, ( 6371 * acos( cos( radians(?) ) *
                        cos( radians( current_lat ) )
                        * cos( radians( current_lng ) - radians(?)
                        ) + sin( radians(?) ) *
                        sin( radians( current_lat ) ) )
                    ) AS distance", [$order->pickup_lat, $order->pickup_lng, $order->pickup_lat])
                    ->orderBy('distance', 'asc')
                    ->first();

                if ($closestDriver) {
                    // Assign to new driver
                    $order->update([
                        'driver_id' => $closestDriver->user_id
                    ]);
                    // Reload relation
                    $order->load('driver.driverProfile');
                } else {
                    // Jika belum 30 detik sejak penolakan, tetap biarkan mencari (pending, driver_id null)
                    // Ini agar customer app tetap bisa menampilkan animasi "Mencari Driver..." dan memberikan kesempatan driver lain online
                    if ($secondsSinceRejection >= 30) {
                        // No more drivers found! Terminate order and refund prepaid
                        $payment = \App\Models\Payment::where('order_id', $order->id)
                            ->whereIn('status', ['paid', 'captured', 'success', 'settled'])
                            ->first();

                        \Illuminate\Support\Facades\DB::transaction(function () use ($order, $payment) {
                            $customer = $order->customer;

                            if ($payment && $customer) {
                                $customer->increment('wallet_balance', $payment->total_amount);

                                \App\Models\WalletTransaction::create([
                                    'id' => (string) \Illuminate\Support\Str::uuid(),
                                    'user_id' => $customer->id,
                                    'amount' => $payment->total_amount,
                                    'type' => 'refund',
                                    'status' => 'success',
                                    'reference' => 'FIVGO-REFUND-REJECT-' . $order->id . '-' . \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(8)),
                                    'payment_method' => 'wallet',
                                    'description' => 'Refund Penolakan Perjalanan oleh Driver (Order #' . substr($order->id, 0, 8) . ')',
                                ]);
                            }

                            $order->update([
                                'status' => 'rejected',
                                'driver_id' => null,
                                'cancel_reason' => 'No drivers available'
                            ]);
                        });

                        return response()->json(null);
                    }
                }
            }
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
            ->whereIn('status', ['payment_pending', 'pending', 'accepted', 'arrived'])
            ->findOrFail($id);

        $payment = \App\Models\Payment::where('order_id', $order->id)
            ->whereIn('status', ['paid', 'captured', 'success', 'settled'])
            ->first();

        \Illuminate\Support\Facades\DB::transaction(function () use ($order, $request, $payment) {
            $customer = $order->customer;
            
            // 1. Refund to customer wallet if prepaid and paid
            if ($payment && $customer) {
                $customer->increment('wallet_balance', $payment->total_amount);
                
                \App\Models\WalletTransaction::create([
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'user_id' => $customer->id,
                    'amount' => $payment->total_amount,
                    'type' => 'refund',
                    'status' => 'success',
                    'reference' => 'FIVGO-REFUND-' . $order->id . '-' . \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(8)),
                    'payment_method' => 'wallet',
                    'description' => 'Refund Pembatalan Perjalanan (Order #' . substr($order->id, 0, 8) . ')',
                ]);
            }

            // 2. Apply cancel fee if driver accepted or arrived
            if (in_array($order->status, ['accepted', 'arrived'], true)) {
                $penaltyAmount = 2500;
                
                // Deduct penalty from customer
                if ($customer) {
                    $customer->decrement('wallet_balance', $penaltyAmount);
                    
                    \App\Models\WalletTransaction::create([
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'user_id' => $customer->id,
                        'amount' => -$penaltyAmount,
                        'type' => 'penalty',
                        'status' => 'success',
                        'reference' => 'FIVGO-CANCEL-PENALTY-' . $order->id,
                        'payment_method' => 'wallet',
                        'description' => 'Denda Pembatalan Perjalanan (Order #' . substr($order->id, 0, 8) . ')',
                    ]);
                }

                // Credit compensation to driver
                if ($order->driver) {
                    $order->driver->increment('wallet_balance', $penaltyAmount);
                    
                    \App\Models\WalletTransaction::create([
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'user_id' => $order->driver->id,
                        'amount' => $penaltyAmount,
                        'type' => 'income',
                        'status' => 'success',
                        'reference' => 'FIVGO-CANCEL-COMPENSATION-' . $order->id,
                        'payment_method' => 'wallet',
                        'description' => 'Kompensasi Pembatalan oleh Pelanggan (Order #' . substr($order->id, 0, 8) . ')',
                    ]);
                }
            }

            // 3. Perform the actual cancel status update
            $order->update([
                'status' => 'cancelled',
                'cancel_reason' => $request->input('reason', 'User cancelled')
            ]);
        });

        return response()->json($order);
    }

    public function reject(Request $request, $id)
    {
        $order = Order::where('driver_id', $request->user()->id)
            ->whereIn('status', ['pending', 'accepted'])
            ->findOrFail($id);

        $driverId = $request->user()->id;

        // Append driver to rejected list in cancel_reason
        $rejectedList = $order->cancel_reason;
        if ($rejectedList && str_starts_with($rejectedList, 'rejected:')) {
            $rejectedList .= ',' . $driverId;
        } else {
            $rejectedList = 'rejected:' . $driverId;
        }

        // Set driver_id to null and status to pending to search for another driver
        $order->update([
            'driver_id' => null,
            'status' => 'pending',
            'cancel_reason' => $rejectedList
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

    private function requiresPrepaidPayment(?string $method): bool
    {
        if (! $method) {
            return false;
        }

        return ! in_array(strtolower($method), ['tunai', 'cash'], true);
    }

    private function cancelStaleActiveOrder(Order $order): bool
    {
        $staleAfterMinutes = self::STALE_ACTIVE_ORDER_MINUTES[$order->status] ?? null;

        if (! $staleAfterMinutes || $order->created_at->gt(now()->subMinutes($staleAfterMinutes))) {
            return false;
        }

        $order->update([
            'status' => 'cancelled',
            'cancel_reason' => "Auto cancelled stale {$order->status} order",
        ]);

        return true;
    }
}
