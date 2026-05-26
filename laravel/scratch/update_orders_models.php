<?php

$dir = __DIR__ . '/../app/Models/';

$order = "<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory, HasUuids;
    protected \$fillable = [
        'customer_id', 'driver_id', 'status', 'pickup_address', 'pickup_lat', 'pickup_lng', 
        'dropoff_address', 'dropoff_lat', 'dropoff_lng', 'estimated_price', 'final_price',
        'payment_method', 'cancel_reason', 'rating', 'review'
    ];

    public function customer() { return \$this->belongsTo(User::class, 'customer_id'); }
    public function driver() { return \$this->belongsTo(User::class, 'driver_id'); }
    public function trackings() { return \$this->hasMany(OrderTracking::class); }
}";

$tracking = "<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderTracking extends Model
{
    use HasFactory, HasUuids;
    protected \$fillable = [
        'order_id', 'driver_id', 'lat', 'lng', 'status'
    ];

    public function order() { return \$this->belongsTo(Order::class); }
    public function driver() { return \$this->belongsTo(User::class, 'driver_id'); }
}";

file_put_contents($dir . 'Order.php', $order);
file_put_contents($dir . 'OrderTracking.php', $tracking);

echo "Models for Orders written.\n";
