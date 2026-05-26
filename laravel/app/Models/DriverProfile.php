<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriverProfile extends Model
{
    use HasFactory, HasUuids;
    protected $fillable = [
        'user_id', 'status', 'rating', 'vehicle_type', 'plate_number', 'wallet_balance', 'current_lat', 'current_lng'
    ];
    public function user() { return $this->belongsTo(User::class); }
}