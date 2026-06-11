<?php

namespace App\Http\Controllers;

use App\Models\DriverProfile;
use App\Models\DriverDocument;
use App\Models\Report;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Cloudinary\Api\Upload\UploadApi;

class DriverController extends Controller
{
    protected OtpService $otpService;

    public function __construct(OtpService $otpService)
    {
        $this->otpService = $otpService;
    }
    public function register(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'vehicle_type' => 'required|string',
            'plate_number' => 'required|string',
            'vehicle_brand' => 'nullable|string'
        ]);

        $profile = DriverProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'vehicle_type' => $validated['vehicle_type'],
                'plate_number' => $validated['plate_number'],
                'vehicle_brand' => $validated['vehicle_brand'] ?? null,
                'status' => 'offline'
            ]
        );

        return response()->json($profile, 201);
    }

    public function uploadDocuments(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'type' => 'required|string|in:ktp,sim,stnk',
            'file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048'
        ]);

        $path = $request->file('file')->store('documents');

        $doc = DriverDocument::create([
            'user_id' => $user->id,
            'type' => $validated['type'],
            'file_path' => $path,
            'status' => 'pending'
        ]);

        return response()->json($doc, 201);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('driverProfile');
        return response()->json($user);
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
            'vehicle_type' => 'nullable|string',
            'plate_number' => 'nullable|string',
            'vehicle_brand' => 'nullable|string',
        ]);

        if ($request->hasFile('photo')) {
            $upload = new UploadApi();
            $response = $upload->upload($request->file('photo')->getRealPath());
            $validated['photo'] = $response['secure_url'];
        }

        if (isset($validated['email'])) {
            $validated['email_verified_at'] = now();
        }

        if (isset($validated['phone'])) {
            $validated['phone_verified_at'] = now();
        }

        $user->update($validated);
        
        $driverProfileData = [];
        if (isset($validated['vehicle_type'])) $driverProfileData['vehicle_type'] = $validated['vehicle_type'];
        if (isset($validated['plate_number'])) $driverProfileData['plate_number'] = $validated['plate_number'];
        if (isset($validated['vehicle_brand'])) $driverProfileData['vehicle_brand'] = $validated['vehicle_brand'];
        
        if (!empty($driverProfileData)) {
            $user->driverProfile()->update($driverProfileData);
        }
        
        return response()->json($user->load('driverProfile'));
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
            'user'    => $user->load('driverProfile'),
        ]);
    }
    public function updateStatus(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('[DriverDebug] updateStatus API called', [
            'user_id' => $request->user()?->id,
            'role' => $request->user()?->role,
            'wallet_balance' => $request->user()?->wallet_balance,
            'request_status' => $request->input('status')
        ]);

        $validated = $request->validate([
            'status' => 'required|string|in:online,offline,busy'
        ]);

        $user = $request->user();
        if ($validated['status'] !== 'offline' && $user->wallet_balance < -50000) {
            \Illuminate\Support\Facades\Log::warning('[DriverDebug] updateStatus blocked by wallet balance', [
                'user_id' => $user->id,
                'wallet_balance' => $user->wallet_balance
            ]);
            return response()->json([
                'message' => 'Status tidak dapat diubah ke online. Saldo Anda saat ini minus Rp ' . number_format(abs($user->wallet_balance), 0, ',', '.') . '. Harap lakukan Top Up minimal agar saldo berada di atas -Rp 50.000 untuk menerima pesanan kembali.'
            ], 403);
        }

        $profile = DriverProfile::firstOrCreate(
            ['user_id' => $user->id],
            [
                'status' => 'offline',
                'vehicle_type' => 'motor',
                'rating' => 5.0,
                'wallet_balance' => 0
            ]
        );
        $profile->update(['status' => $validated['status']]);
        \Illuminate\Support\Facades\Log::info('[DriverDebug] updateStatus DB updated successfully', [
            'user_id' => $user->id,
            'new_status' => $profile->status
        ]);

        return response()->json($profile);
    }
    public function updateLocation(Request $request)
    {
        $validated = $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'heading' => 'nullable|numeric',
            'order_id' => 'nullable|string'
        ]);

        $profile = DriverProfile::where('user_id', $request->user()->id)->first();
        if ($profile) {
            $profile->update([
                'current_lat' => $validated['lat'],
                'current_lng' => $validated['lng']
            ]);

            if (!empty($validated['order_id'])) {
                broadcast(new \App\Events\DriverLocationUpdated(
                    $validated['order_id'],
                    $validated['lat'],
                    $validated['lng'],
                    $validated['heading'] ?? 0
                ))->toOthers();
            }
        }

        return response()->json(['message' => 'Location updated']);
    }

    public function history(Request $request)
    {
        $orders = \App\Models\Order::with(['customer'])
            ->where('driver_id', $request->user()->id)
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
                    'customer'        => $order->customer ? [
                        'id'           => $order->customer->id,
                        'name'         => $order->customer->name,
                        'photo'        => $order->customer->photo,
                        'phone'        => $order->customer->phone,
                    ] : null,
                ];
            });

        return response()->json(['data' => $orders]);
    }

    public function historyDetail(Request $request, $id)
    {
        $order = \App\Models\Order::with(['customer'])
            ->where('driver_id', $request->user()->id)
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
                'customer'        => $order->customer ? [
                    'id'           => $order->customer->id,
                    'name'         => $order->customer->name,
                    'photo'        => $order->customer->photo,
                    'phone'        => $order->customer->phone,
                ] : null,
            ]
        ]);
    }

    public function wallet(Request $request)
    {
        $profile = DriverProfile::where('user_id', $request->user()->id)->first();
        return response()->json(['wallet_balance' => $profile ? $profile->wallet_balance : 0]);
    }

    public function withdraw(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|integer|min:10000'
        ]);

        $profile = DriverProfile::firstOrCreate(
            ['user_id' => $request->user()->id],
            [
                'status' => 'offline',
                'vehicle_type' => 'motor',
                'rating' => 5.0,
                'wallet_balance' => 0
            ]
        );
        
        if ($profile->wallet_balance < $validated['amount']) {
            return response()->json(['message' => 'Insufficient balance'], 400);
        }

        $profile->decrement('wallet_balance', $validated['amount']);

        return response()->json(['message' => 'Withdrawal requested successfully', 'remaining_balance' => $profile->wallet_balance]);
    }

    public function reportCustomer(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:users,id',
            'order_id' => 'required|string',
            'reason' => 'required|string',
            'description' => 'nullable|string'
        ]);

        $report = Report::create([
            'reporter_id' => $request->user()->id,
            'reported_id' => $validated['customer_id'],
            'order_id' => $validated['order_id'],
            'reason' => $validated['reason'],
            'description' => $validated['description'] ?? null
        ]);

        return response()->json(['message' => 'Report submitted', 'report' => $report], 201);
    }

    public function performance(Request $request)
    {
        $orders = \App\Models\Order::where('driver_id', $request->user()->id)
            ->whereNotNull('rating')
            ->get();

        $total = $orders->count();

        if ($total === 0) {
            return response()->json([
                'average_rating' => 0.0,
                'total_reviews' => 0,
                'sangat_puas' => 0,
                'puas' => 0,
                'perlu_ditingkatkan' => 0,
            ]);
        }

        $average = round($orders->avg('rating'), 1);
        
        $sangat_puas_count = $orders->where('rating', 5)->count();
        $puas_count = $orders->where('rating', 4)->count();
        $perlu_ditingkatkan_count = $orders->where('rating', '<=', 3)->count();

        $sangat_puas = round(($sangat_puas_count / $total) * 100);
        $puas = round(($puas_count / $total) * 100);
        $perlu_ditingkatkan = round(($perlu_ditingkatkan_count / $total) * 100);

        return response()->json([
            'average_rating' => $average,
            'total_reviews' => $total,
            'sangat_puas' => $sangat_puas,
            'puas' => $puas,
            'perlu_ditingkatkan' => $perlu_ditingkatkan,
        ]);
    }
}
