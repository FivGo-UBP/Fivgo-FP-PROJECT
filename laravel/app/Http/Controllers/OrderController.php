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
        \Illuminate\Support\Facades\Log::info('[DriverDebug] OrderController@create called with request data', [
            'customer_id' => $request->user()?->id,
            'all_data' => $request->all()
        ]);

        try {
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
                'promo_code' => 'nullable|string',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('[DriverDebug] Order validation failed', [
                'errors' => $e->errors()
            ]);
            throw $e;
        }

        $validated['customer_id'] = $request->user()->id;
        $validated['status'] = $this->requiresPrepaidPayment($validated['payment_method'] ?? null)
            ? 'payment_pending'
            : 'pending';

        // Use provided estimated_price or calculate a mock one
        if (!isset($validated['estimated_price'])) {
            $validated['estimated_price'] = rand(10000, 50000);
        }

        // Promo validation
        $promoId = null;
        $discountAmount = 0;
        if (!empty($validated['promo_code'])) {
            // Cek Syarat: Metode Pembayaran (Harus Non-Tunai)
            $paymentMethod = strtolower($validated['payment_method'] ?? 'cash');
            if (in_array($paymentMethod, ['tunai', 'cash'], true)) {
                return response()->json(['message' => 'Promo hanya dapat digunakan dengan metode pembayaran non-tunai.'], 400);
            }

            $promo = \App\Models\Promo::where('code', $validated['promo_code'])
                ->where('is_active', true)
                ->where('start_date', '<=', now())
                ->where('end_date', '>=', now())
                ->first();

            if (!$promo) {
                return response()->json(['message' => 'Promo tidak valid atau sudah kadaluarsa'], 400);
            }

            if ($promo->quota > 0 && $promo->used_count >= $promo->quota) {
                return response()->json(['message' => 'Kuota promo sudah habis'], 400);
            }

            if ($validated['estimated_price'] < $promo->min_order_amount) {
                return response()->json(['message' => 'Harga perjalanan belum memenuhi syarat minimum promo ini'], 400);
            }

            if ($promo->applicable_vehicles) {
                $vehicles = is_array($promo->applicable_vehicles) ? $promo->applicable_vehicles : json_decode($promo->applicable_vehicles, true);
                if (is_array($vehicles) && !in_array($validated['vehicle_type'], $vehicles)) {
                    return response()->json(['message' => 'Promo tidak berlaku untuk jenis kendaraan ini'], 400);
                }
            }

            $usageCount = Order::where('customer_id', $request->user()->id)
                ->where('promo_id', $promo->id)
                ->whereIn('status', ['completed', 'pending', 'accepted', 'started'])
                ->count();

            if ($usageCount >= $promo->limit_per_user) {
                return response()->json(['message' => 'Anda telah melebihi batas penggunaan promo ini'], 400);
            }

            // Cek Syarat Khusus Misi / New User
            $codeUpper = strtoupper($promo->code);
            $userId = $request->user()->id;
            if ($codeUpper === 'FIVGOMOTOR10X') {
                $completedMotorOrders = Order::where('customer_id', $userId)
                    ->where('vehicle_type', 'motor')
                    ->where('status', 'completed')
                    ->count();
                if ($completedMotorOrders < 10) {
                    return response()->json(['message' => "Promo ini hanya berlaku setelah Anda menyelesaikan 10x perjalanan FivGO Motor. Perjalanan Anda saat ini: {$completedMotorOrders}/10."], 400);
                }
            } elseif ($codeUpper === 'FIVGOMOBILBARU') {
                $hasMobilOrder = Order::where('customer_id', $userId)
                    ->where('vehicle_type', 'mobil')
                    ->where('status', 'completed')
                    ->exists();
                if ($hasMobilOrder) {
                    return response()->json(['message' => 'Promo ini hanya berlaku untuk perjalanan pertama kali menggunakan FivGO Mobil.'], 400);
                }
            } elseif ($codeUpper === 'FIVGOMOTORBARU') {
                $hasMotorOrder = Order::where('customer_id', $userId)
                    ->where('vehicle_type', 'motor')
                    ->where('status', 'completed')
                    ->exists();
                if ($hasMotorOrder) {
                    return response()->json(['message' => 'Promo ini hanya berlaku untuk perjalanan pertama kali menggunakan FivGO Motor.'], 400);
                }
            }

            // Calculate discount
            $discountAmount = ($validated['estimated_price'] * $promo->discount_percent) / 100;
            if ($discountAmount > $promo->max_discount) {
                $discountAmount = $promo->max_discount;
            }
            $discountAmount = (int) $discountAmount;
            $promoId = $promo->id;

            // Increment used count
            $promo->increment('used_count');
        }

        $validated['promo_id'] = $promoId;
        $validated['discount_amount'] = $discountAmount;

        // Temukan driver aktif terdekat yang benar-benar aktif/online dalam 5 menit terakhir (Heartbeat Check), memiliki saldo >= -50000, dan tipe kendaraan yang cocok
        $requestedVehicleType = strtolower($validated['vehicle_type'] ?? 'motor');
        \Illuminate\Support\Facades\Log::info('[DriverDebug] Searching closest driver', [
            'requested_vehicle_type' => $requestedVehicleType,
            'pickup_lat' => $validated['pickup_lat'],
            'pickup_lng' => $validated['pickup_lng'],
        ]);

        $closestDriver = \App\Models\DriverProfile::where('status', 'online')
            ->where('updated_at', '>=', now()->subMinutes(5))
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
            \Illuminate\Support\Facades\Log::warning('[DriverDebug] No driver found in database matching criteria');
            // Rollback promo increment if order fails because of no driver
            if ($promoId) {
                \App\Models\Promo::where('id', $promoId)->decrement('used_count');
            }
            return response()->json(['message' => 'Saat ini tidak ada driver yang tersedia.'], 404);
        }

        \Illuminate\Support\Facades\Log::info('[DriverDebug] Driver matched successfully', [
            'driver_user_id' => $closestDriver->user_id,
            'distance' => $closestDriver->distance,
        ]);

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
        
        \Illuminate\Support\Facades\Log::info("Active order queried by User ID: " . $user->id . " with Role: " . $user->role);
        
        // Clean up any stale rejected orders first (older than 3 minutes)
        Order::cleanUpStaleRejectedOrders($user->id);

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

                // Find next closest active driver that is truly online/active in the last 5 minutes (Heartbeat Check), memiliki saldo >= -50000, dan tipe kendaraan yang cocok
                $requestedVehicleType = strtolower($order->vehicle_type ?? 'motor');
                $closestDriver = \App\Models\DriverProfile::where('status', 'online')
                    ->where('updated_at', '>=', now()->subMinutes(5))
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
                    // Jika sudah lebih dari 30 detik sejak penolakan, ubah ke rejected dan lakukan refund otomatis
                    if ($secondsSinceRejection >= 30) {
                        \Illuminate\Support\Facades\DB::transaction(function () use ($order) {
                            $order->update([
                                'status' => 'rejected',
                                'cancel_reason' => 'No drivers available after rejection'
                            ]);

                            $payment = \App\Models\Payment::where('order_id', $order->id)
                                ->whereIn('status', ['paid', 'captured', 'success', 'settled'])
                                ->first();

                            $customer = $order->customer;
                            if ($payment && $customer) {
                                $customer->increment('wallet_balance', $payment->total_amount);

                                \App\Models\WalletTransaction::create([
                                    'user_id' => $customer->id,
                                    'amount' => $payment->total_amount,
                                    'type' => 'refund',
                                    'status' => 'success',
                                    'reference' => 'FIVGO-REFUND-REJECT-' . $order->id . '-' . \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(8)),
                                    'payment_method' => 'wallet',
                                    'description' => 'Refund Pembatalan Perjalanan (No Driver)',
                                ]);
                            }
                        });
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
            'discount_amount' => $order->discount_amount,
            'promo_code'      => $order->promo?->code,
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
                'vehicle_brand' => $order->driver->driverProfile?->vehicle_brand,
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

        // Set driver status to busy
        if ($request->user()->driverProfile) {
            $request->user()->driverProfile->update(['status' => 'busy']);
        }

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
            
        $vehicleType = strtolower($order->vehicle_type ?? 'motor');
        $commissionRate = ($vehicleType === 'mobil') ? 0.15 : 0.10;
        $driverShareRate = 1 - $commissionRate;

        $originalPrice = $order->estimated_price;
        $discountAmount = $order->discount_amount ?? 0;
        $commissionAmount = (int) round($originalPrice * $commissionRate);
        $driverShareAmount = (int) round($originalPrice * $driverShareRate);

        $paymentMethod = strtolower($order->payment_method ?? 'cash');
        $isCash = in_array($paymentMethod, ['tunai', 'cash'], true);

        \Illuminate\Support\Facades\DB::transaction(function () use ($order, $request, $vehicleType, $commissionAmount, $driverShareAmount, $discountAmount, $isCash) {
            $order->update([
                'status' => 'completed',
                'final_price' => $order->estimated_price
            ]);

            $driver = $order->driver;
            if ($driver) {
                if ($isCash) {
                    // 1. Potong komisi dari saldo dompet driver (dihitung dari harga asli sebelum diskon)
                    $driver->decrement('wallet_balance', $commissionAmount);

                    // 2. Catat transaksi komisi (debit/minus)
                    \App\Models\WalletTransaction::create([
                        'user_id' => $driver->id,
                        'amount' => -$commissionAmount,
                        'type' => 'commission',
                        'status' => 'success',
                        'reference' => 'FIVGO-COMMISSION-' . $order->id . '-' . \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(8)),
                        'payment_method' => 'cash',
                        'description' => 'Potongan Komisi Perjalanan ' . ucfirst($vehicleType) . ' (Order #' . substr($order->id, 0, 8) . ')',
                    ]);

                    // 3. Tambahkan subsidi promo (jika ada potongan promo, selisihnya diganti oleh pihak FivGo ke dompet driver)
                    if ($discountAmount > 0) {
                        $driver->increment('wallet_balance', $discountAmount);

                        \App\Models\WalletTransaction::create([
                            'user_id' => $driver->id,
                            'amount' => $discountAmount,
                            'type' => 'subsidy',
                            'status' => 'success',
                            'reference' => 'FIVGO-SUBSIDY-' . $order->id . '-' . \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(8)),
                            'payment_method' => 'wallet',
                            'description' => 'Subsidi Promo Perjalanan ' . ucfirst($vehicleType) . ' (Order #' . substr($order->id, 0, 8) . ')',
                        ]);
                    }
                } else {
                    // 1. Tambahkan bagi hasil bersih ke saldo dompet driver (dihitung dari harga asli sebelum diskon)
                    $driver->increment('wallet_balance', $driverShareAmount);

                    // 2. Catat transaksi pendapatan (kredit/plus)
                    \App\Models\WalletTransaction::create([
                        'user_id' => $driver->id,
                        'amount' => $driverShareAmount,
                        'type' => 'income',
                        'status' => 'success',
                        'reference' => 'FIVGO-INCOME-' . $order->id . '-' . \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(8)),
                        'payment_method' => 'wallet',
                        'description' => 'Pendapatan Perjalanan ' . ucfirst($vehicleType) . ' (Order #' . substr($order->id, 0, 8) . ')',
                    ]);
                }
            }

            // Reset driver status to online if busy
            if ($request->user()->driverProfile && $request->user()->driverProfile->status === 'busy') {
                $request->user()->driverProfile->update(['status' => 'online']);
            }
        });
        
        return response()->json($order);
    }

    public function cancel(Request $request, $id)
    {
        $order = Order::where('customer_id', $request->user()->id)
            ->whereIn('status', ['payment_pending', 'pending', 'accepted', 'arrived', 'rejected'])
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
                    'user_id' => $customer->id,
                    'amount' => $payment->total_amount,
                    'type' => 'refund',
                    'status' => 'success',
                    'reference' => 'FIVGO-REFUND-' . $order->id . '-' . \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(8)),
                    'payment_method' => 'wallet',
                    'description' => 'Refund Pembatalan Perjalanan',
                ]);
            }

            // 2. Apply cancel fee if driver accepted or arrived
            if (in_array($order->status, ['accepted', 'arrived'], true)) {
                $penaltyAmount = 2500;
                
                // Deduct penalty from customer
                if ($customer) {
                    $customer->decrement('wallet_balance', $penaltyAmount);
                    
                    \App\Models\WalletTransaction::create([
                        'user_id' => $customer->id,
                        'amount' => -$penaltyAmount,
                        'type' => 'penalty',
                        'status' => 'success',
                        'reference' => 'FIVGO-CANCEL-PENALTY-' . $order->id,
                        'payment_method' => 'wallet',
                        'description' => 'Denda Pembatalan Order',
                    ]);
                }

                // Credit compensation to driver
                if ($order->driver) {
                    $order->driver->increment('wallet_balance', $penaltyAmount);
                    
                    \App\Models\WalletTransaction::create([
                        'user_id' => $order->driver->id,
                        'amount' => $penaltyAmount,
                        'type' => 'income',
                        'status' => 'success',
                        'reference' => 'FIVGO-CANCEL-COMPENSATION-' . $order->id,
                        'payment_method' => 'wallet',
                        'description' => 'Kompensasi Pembatalan oleh Pelanggan',
                    ]);
                }
            }

            // 3. Perform the actual cancel status update
            $order->update([
                'status' => 'cancelled',
                'cancel_reason' => $request->input('reason', 'User cancelled')
            ]);
            
            // Reset driver status to online if busy
            if ($order->driver && $order->driver->driverProfile && $order->driver->driverProfile->status === 'busy') {
                $order->driver->driverProfile->update(['status' => 'online']);
            }
        });

        return response()->json($order);
    }

    public function reject(Request $request, $id)
    {
        $order = Order::where('driver_id', $request->user()->id)
            ->whereIn('status', ['pending', 'accepted', 'arrived'])
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

        // Reset driver status to online if busy
        if ($request->user()->driverProfile && $request->user()->driverProfile->status === 'busy') {
            $request->user()->driverProfile->update(['status' => 'online']);
        }

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

    public function retry(Request $request, $id)
    {
        $order = Order::where('customer_id', $request->user()->id)
            ->whereIn('status', ['rejected', 'cancelled'])
            ->findOrFail($id);

        $order->update([
            'status' => 'pending',
            'driver_id' => null,
            'cancel_reason' => null
        ]);

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

        // Reset driver status to online if busy
        if ($order->driver && $order->driver->driverProfile && $order->driver->driverProfile->status === 'busy') {
            $order->driver->driverProfile->update(['status' => 'online']);
        }

        return true;
    }
}
