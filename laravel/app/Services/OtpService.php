<?php

namespace App\Services;

use App\Models\Otp;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class OtpService
{
    const OTP_VALIDITY_SECONDS = 300; // 5 minutes
    const OTP_MAX_ATTEMPTS = 5;

    /**
     * Send OTP via mock service.
     */
    public function sendOtp(string $phone, string $role): array
    {
        // Clean phone number from non-numeric characters for comparison
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        // If it starts with 62, replace with 0
        if (str_starts_with($cleanPhone, '62')) {
            $cleanPhone = '0' . substr($cleanPhone, 2);
        }

        $isTestPhone = ($cleanPhone === '081298682260' || $cleanPhone === '089501858234');

        // Generate a random 4-digit OTP (or static '1234' for test phone)
        $otp = $isTestPhone ? '1234' : (string) rand(1000, 9999);
        
        // Delete previous OTP records for this phone/role
        Otp::where('phone', $phone)->where('role', $role)->delete();

        // Create new OTP record with expiration time
        $otpRecord = Otp::create([
            'phone' => $phone,
            'role' => $role,
            'code' => $otp,
            'expires_at' => now()->addSeconds(self::OTP_VALIDITY_SECONDS),
            'attempts' => 0,
            'is_verified' => false,
        ]);

        Log::info("OTP Generated for $phone ($role): $otp");

        // Send via Fonnte API
        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => env('FONNTE_TOKEN', 'TOKEN_ANDA_DISINI')
            ])->post('https://api.fonnte.com/send', [
                'target' => $phone,
                'message' => "Halo! Kode OTP FivGo Anda adalah: *{$otp}*\n\nJangan berikan kode ini kepada siapapun demi keamanan akun Anda.",
            ]);
            
            Log::info("Fonnte Response: " . $response->body());
        } catch (\Exception $e) {
            Log::error("Failed to send OTP via Fonnte: " . $e->getMessage());
        }

        return [
            'phone' => $phone,
            'otp_sent' => true,
            'via' => 'whatsapp',
            'expired_in_seconds' => self::OTP_VALIDITY_SECONDS,
            'retry_after_seconds' => 60
        ];
    }

    /**
     * Verify the OTP with detailed error responses.
     */
    public function verifyOtp(string $phone, string $role, string $otp): array
    {
        // Find the latest OTP record
        $otpRecord = Otp::where('phone', $phone)
                        ->where('role', $role)
                        ->where('is_verified', false)
                        ->latest()
                        ->first();

        // OTP not found
        if (!$otpRecord) {
            return [
                'success' => false,
                'message' => 'OTP tidak ditemukan. Silakan minta kode baru.',
                'error_code' => 'OTP_NOT_FOUND'
            ];
        }

        // Check if OTP is expired
        if ($otpRecord->isExpired()) {
            Log::info("OTP expired for $phone ($role)");
            return [
                'success' => false,
                'message' => 'Kode OTP sudah kadaluarsa. Silakan minta kode baru.',
                'error_code' => 'OTP_EXPIRED',
                'seconds_remaining' => 0
            ];
        }

        // Check if max attempts exceeded
        if ($otpRecord->attempts >= self::OTP_MAX_ATTEMPTS) {
            Log::warning("Too many attempts for $phone ($role)");
            return [
                'success' => false,
                'message' => 'Terlalu banyak percobaan yang salah. Silakan minta kode OTP baru.',
                'error_code' => 'TOO_MANY_ATTEMPTS',
                'seconds_remaining' => $otpRecord->getSecondsRemaining()
            ];
        }

        // Backdoor for testing
        if ($otp === '1234') {
            $otpRecord->markAsVerified();
            Log::info("OTP verified (backdoor) for $phone ($role)");
            return [
                'success' => true,
                'message' => 'OTP verified successfully',
                'user_id' => null
            ];
        }

        // Check OTP code
        if ($otpRecord->code !== $otp) {
            $otpRecord->incrementAttempt();
            $remainingAttempts = self::OTP_MAX_ATTEMPTS - $otpRecord->attempts;
            
            Log::warning("Wrong OTP for $phone ($role). Attempts: {$otpRecord->attempts}");
            
            return [
                'success' => false,
                'message' => 'Kode OTP salah.',
                'error_code' => 'OTP_MISMATCH',
                'attempts_remaining' => $remainingAttempts,
                'seconds_remaining' => $otpRecord->getSecondsRemaining()
            ];
        }

        // OTP is correct
        $otpRecord->markAsVerified();
        Log::info("OTP verified successfully for $phone ($role)");

        return [
            'success' => true,
            'message' => 'OTP verified successfully',
            'user_id' => null
        ];
    }
}
