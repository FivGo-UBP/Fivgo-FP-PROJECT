<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory, HasUuids;
    protected $fillable = [
        'customer_id', 'driver_id', 'status', 'vehicle_type', 'pickup_address', 'pickup_lat', 'pickup_lng', 
        'dropoff_address', 'dropoff_lat', 'dropoff_lng', 'estimated_price', 'final_price',
        'payment_method', 'cancel_reason', 'rating', 'review'
    ];

    public function customer() { return $this->belongsTo(User::class, 'customer_id'); }
    public function driver() { return $this->belongsTo(User::class, 'driver_id')->with('driverProfile'); }
    public function trackings() { return $this->hasMany(OrderTracking::class); }
}