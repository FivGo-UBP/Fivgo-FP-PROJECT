<?php

namespace App\Http\Controllers;

use App\Models\CustomerAddress;
use App\Models\Report;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    protected OtpService $otpService;

    public function __construct(OtpService $otpService)
    {
        $this->otpService = $otpService;
    }
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => 'nullable|string',
            'email' => ['nullable', 'email', Rule::unique('users', 'email')->where(fn ($q) => $q->where('role', $user->role))->ignore($user->id)],
            'phone' => ['nullable', 'string', Rule::unique('users', 'phone')->where(fn ($q) => $q->where('role', $user->role))->ignore($user->id)],
            'gender' => 'nullable|string',
            'photo' => 'nullable|image|max:5120', // max 5MB
        ]);

        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('profile_photos', 'public');
            $validated['photo'] = url('/storage/' . $path);
        }

        if (isset($validated['email'])) {
            $validated['email_verified_at'] = now();
        }

        if (isset($validated['phone'])) {
            $validated['phone_verified_at'] = now();
        }

        $user->update($validated);
        return response()->json($user);
    }

    public function getAddresses(Request $request)
    {
        return response()->json(
            $request->user()->customerAddresses()->get()
        );
    }

    public function createAddress(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'full_address' => 'required|string',
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'notes' => 'nullable|string',
            'is_primary' => 'boolean'
        ]);

        $address = $request->user()->customerAddresses()->create($validated);
        return response()->json($address, 201);
    }

    public function updateAddress(Request $request, $id)
    {
        $address = CustomerAddress::where('user_id', $request->user()->id)->findOrFail($id);
        $validated = $request->validate([
            'title' => 'string',
            'full_address' => 'string',
            'lat' => 'numeric',
            'lng' => 'numeric',
            'notes' => 'nullable|string',
            'is_primary' => 'boolean'
        ]);

        $address->update($validated);
        return response()->json($address);
    }

    public function deleteAddress(Request $request, $id)
    {
        $address = CustomerAddress::where('user_id', $request->user()->id)->findOrFail($id);
        $address->delete();
        return response()->json(['message' => 'Address deleted']);
    }

    public function history(Request $request)
    {
        $orders = \App\Models\Order::with(['driver.driverProfile'])
            ->where('customer_id', $request->user()->id)
            ->whereIn('status', ['completed', 'cancelled', 'rejected'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($order) {
                return [
                    'id'              => $order->id,
                    'status'          => $order->status,
                    'vehicle_type'    => $order->vehicle_type,
                    'pickup_address'  => $order->pickup_address,
                    'dropoff_address' => $order->dropoff_address,
                    'final_price'     => $order->final_price ?? $order->estimated_price,
                    'payment_method'  => $order->payment_method,
                    'rating'          => $order->rating,
                    'review'          => $order->review,
                    'created_at'      => $order->created_at,
                    'driver'          => $order->driver ? [
                        'id'           => $order->driver->id,
                        'name'         => $order->driver->name,
                        'photo'        => $order->driver->photo,
                        'vehicle_type' => $order->driver->driverProfile?->vehicle_type,
                        'plate_number' => $order->driver->driverProfile?->plate_number,
                        'rating'       => $order->driver->driverProfile?->rating,
                    ] : null,
                ];
            });

        return response()->json(['data' => $orders]);
    }

    public function historyDetail(Request $request, $id)
    {
        $order = \App\Models\Order::with(['driver.driverProfile'])
            ->where('customer_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json([
            'data' => [
                'id'              => $order->id,
                'status'          => $order->status,
                'vehicle_type'    => $order->vehicle_type,
                'pickup_address'  => $order->pickup_address,
                'dropoff_address' => $order->dropoff_address,
                'estimated_price' => $order->estimated_price,
                'final_price'     => $order->final_price ?? $order->estimated_price,
                'payment_method'  => $order->payment_method,
                'cancel_reason'   => $order->cancel_reason,
                'rating'          => $order->rating,
                'review'          => $order->review,
                'created_at'      => $order->created_at,
                'driver'          => $order->driver ? [
                    'id'           => $order->driver->id,
                    'name'         => $order->driver->name,
                    'photo'        => $order->driver->photo,
                    'vehicle_type' => $order->driver->driverProfile?->vehicle_type,
                    'plate_number' => $order->driver->driverProfile?->plate_number,
                    'rating'       => $order->driver->driverProfile?->rating,
                ] : null,
            ]
        ]);
    }

    public function reportDriver(Request $request)
    {
        $validated = $request->validate([
            'driver_id' => 'required|exists:users,id',
            'order_id' => 'required|string', // validate later
            'reason' => 'required|string',
            'description' => 'nullable|string'
        ]);

        $report = Report::create([
            'reporter_id' => $request->user()->id,
            'reported_id' => $validated['driver_id'],
            'order_id' => $validated['order_id'],
            'reason' => $validated['reason'],
            'description' => $validated['description'] ?? null
        ]);

        return response()->json(['message' => 'Report submitted', 'report' => $report], 201);
    }

    public function requestPhoneChangeOtp(Request $request)
    {
        $user = $request->user();
        $validator = Validator::make($request->all(), [
            'new_phone' => ['required', 'string', Rule::unique('users', 'phone')->where(fn ($q) => $q->where('role', $user->role))],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Nomor sudah digunakan oleh akun lain'], 409);
        }

        $user = $request->user();
        $result = $this->otpService->sendOtp($request->new_phone, $user->role);

        return response()->json($result);
    }

    public function changePhone(Request $request)
    {
        $user = $request->user();
        $validator = Validator::make($request->all(), [
            'new_phone' => ['required', 'string', Rule::unique('users', 'phone')->where(fn ($q) => $q->where('role', $user->role))],
            'otp'       => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $user      = $request->user();
        $otpResult = $this->otpService->verifyOtp($request->new_phone, $user->role, $request->otp);

        if (!($otpResult['success'] ?? false)) {
            return response()->json([
                'message'    => $otpResult['message'] ?? 'OTP salah atau kadaluarsa',
                'error_code' => $otpResult['error_code'] ?? 'OTP_INVALID',
            ], 400);
        }

        $user->update([
            'phone'             => $request->new_phone,
            'phone_verified_at' => now(),
        ]);

        return response()->json([
            'message' => 'Nomor telepon berhasil diperbarui',
            'user'    => $user->fresh(),
        ]);
    }

    public function deleteAccount(Request $request)
    {
        $user = $request->user();
        
        try {
            // Clean up related records to prevent foreign key constraint violations
            $user->customerAddresses()->delete();
            $user->walletTransactions()->delete();
            
            // Delete related orders (or anonymize if needed, but deleting is fine for FP project)
            \App\Models\Order::where('customer_id', $user->id)->delete();
            
            $user->delete();
            
            return response()->json([
                'message' => 'Akun berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menghapus akun: ' . $e->getMessage()
            ], 500);
        }
    }
}
