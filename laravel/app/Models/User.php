<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Laravel\Sanctum\HasApiTokens;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Support\Facades\Storage;

#[Fillable(['name', 'email', 'phone', 'role', 'is_active', 'rating', 'phone_verified_at', 'email_verified_at', 'password', 'photo', 'gender', 'wallet_balance', 'current_session_id'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, HasUuids;

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [
            'session_id' => $this->current_session_id
        ];
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function customerAddresses()
    {
        return $this->hasMany(CustomerAddress::class);
    }

    public function driverProfile()
    {
        return $this->hasOne(DriverProfile::class);
    }

    public function driverDocuments()
    {
        return $this->hasMany(DriverDocument::class);
    }

    public function walletTransactions()
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function getPhotoAttribute($value)
    {
        if (empty($value)) {
            return null;
        }

        // Jika berupa URL lengkap eksternal (seperti Google photo), kembalikan langsung
        if (filter_var($value, FILTER_VALIDATE_URL)) {
            // Jika URL lokal lama (mengandung /storage/profile_photos/), konversi ke URL host aktif
            if (preg_match('/\/storage\/(profile_photos\/.*)$/', $value, $matches)) {
                return url('/storage/' . $matches[1]);
            }
            return $value;
        }

        // Untuk path relatif baru (misal: profile_photos/xxx.jpg)
        return url('/storage/' . $value);
    }
}
