<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Otp extends Model
{
    protected $fillable = ['phone', 'role', 'code', 'expires_at', 'attempts', 'is_verified'];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_verified' => 'boolean',
    ];

    /**
     * Check if OTP is expired
     */
    public function isExpired(): bool
    {
        return now()->isAfter($this->expires_at);
    }

    /**
     * Get remaining seconds until expiration
     */
    public function getSecondsRemaining(): int
    {
        $remaining = $this->expires_at->diffInSeconds(now(), false);
        return max(0, $remaining); // Return 0 if already expired
    }

    /**
     * Increment attempt count
     */
    public function incrementAttempt(): void
    {
        $this->increment('attempts');
    }

    /**
     * Mark OTP as verified
     */
    public function markAsVerified(): void
    {
        $this->update(['is_verified' => true]);
    }

    /**
     * Scope to get valid OTP (not expired and not verified)
     */
    public function scopeValid($query)
    {
        return $query->where('is_verified', false)
                     ->where('expires_at', '>', now());
    }
}
