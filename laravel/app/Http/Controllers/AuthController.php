<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    protected OtpService $otpService;

    public function __construct(OtpService $otpService)
    {
        $this->otpService = $otpService;
    }

    public function requestOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string',
            'role' => 'required|string|in:customer,driver',
            'purpose' => 'nullable|string|in:login,register'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Format nomor tidak valid'], 400);
        }

        $purpose = $request->input('purpose', 'login');
        $userExists = User::where('phone', $request->phone)
            ->where('role', $request->role)
            ->exists();

        if ($purpose === 'register') {
            if ($userExists) {
                return response()->json(['message' => 'Nomor sudah terdaftar'], 409);
            }
        }

        if ($purpose === 'login' && !$userExists) {
            return response()->json(['message' => 'Nomor belum terdaftar'], 404);
        }

        $result = $this->otpService->sendOtp($request->phone, $request->role);

        return response()->json($result);
    }

    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string',
            'role' => 'required|string|in:customer,driver',
            'otp' => 'required|string',
            'purpose' => 'nullable|string|in:login,register'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Format tidak valid'], 400);
        }

        $otpResult = $this->otpService->verifyOtp($request->phone, $request->role, $request->otp);

        if (!($otpResult['success'] ?? false)) {
            return response()->json([
                'message' => $otpResult['message'] ?? 'OTP salah atau kadaluarsa',
                'error_code' => $otpResult['error_code'] ?? 'OTP_INVALID',
            ], 400);
        }

        // Find or create user
        $user = User::where('phone', $request->phone)->where('role', $request->role)->first();
        $isNewUser = false;
        $purpose = $request->input('purpose', 'login');

        if (!$user && $purpose === 'login') {
            return response()->json(['message' => 'Nomor belum terdaftar'], 404);
        }

        if ($user && $purpose === 'register') {
            return response()->json(['message' => 'Nomor sudah terdaftar'], 409);
        }

        if (!$user) {
            $isNewUser = true;
            $user = User::create([
                'phone' => $request->phone,
                'role' => $request->role,
                'phone_verified_at' => now(),
            ]);
        }

        // Generate token using JWT
        $token = auth('api')->login($user);

        return $this->respondWithToken($token, $user, $isNewUser);
    }

    public function googleLogin(Request $request)
    {
        $request->validate(['google_token' => 'required|string']);
        $token = $request->google_token;
        $email = null;
        $name = null;
        $photo = null;

        // Try to decode as JWT first (for Android idToken)
        $tokenParts = explode(".", $token);
        if (count($tokenParts) === 3) {
            $payload = json_decode(base64_decode($tokenParts[1]), true);
            if (isset($payload['email'])) {
                $email = $payload['email'];
                $name = $payload['name'] ?? null;
                $photo = $payload['picture'] ?? null;
            }
        }

        // If not an idToken, it might be an access_token (for Web)
        if (!$email) {
            $response = \Illuminate\Support\Facades\Http::get("https://www.googleapis.com/oauth2/v3/userinfo", [
                'access_token' => $token
            ]);
            
            if ($response->successful()) {
                $data = $response->json();
                $email = $data['email'] ?? null;
                $name = $data['name'] ?? null;
                $photo = $data['picture'] ?? null;
            }
        }

        if (!$email) {
            return response()->json(['message' => 'Token Google tidak valid atau gagal mendapatkan email.'], 400);
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            $user = User::create([
                'email' => $email,
                'name' => $name,
                'photo' => $photo,
                'role' => 'customer', // default
                'email_verified_at' => now(),
            ]);
        } else if (is_null($user->email_verified_at)) {
            $user->update(['email_verified_at' => now()]);
        }

        $token = auth('api')->login($user);

        return $this->respondWithToken($token, $user, false);
    }

    public function adminLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string'
        ]);

        $credentials = $request->only('email', 'password');
        $credentials['role'] = 'admin';

        if (! $token = auth('api')->attempt($credentials)) {
            return response()->json(['message' => 'Email atau password salah'], 401);
        }

        $user = auth('api')->user();

        return response()->json([
            'token' => $token,
            'admin' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user && $user->role === 'driver' && $user->driverProfile) {
            $user->driverProfile->update(['status' => 'offline']);
        }

        auth('api')->logout();

        return response()->json(['message' => 'Berhasil logout']);
    }

    public function refreshToken(Request $request)
    {
        try {
            $newToken = auth('api')->refresh();
            return response()->json([
                'token' => $newToken,
                'expired_in' => auth('api')->factory()->getTTL() * 60
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Refresh token tidak valid'], 401);
        }
    }

    protected function respondWithToken($token, $user, $isNewUser = false)
    {
        $userData = $user->toArray();
        $userData['is_new_user'] = $isNewUser;
        $userData['phone_verified'] = $user->phone_verified_at !== null;
        
        return response()->json([
            'token' => $token,
            'refresh_token' => $token, // JWT standard refresh logic differs, but keeping signature for now
            'user' => $userData,
            'next_step' => $user->phone_verified_at === null ? 'verify_phone' : null
        ]);
    }
}
