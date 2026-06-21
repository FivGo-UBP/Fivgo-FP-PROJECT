<?php
namespace App\Models;
use App\Traits\HasCustomId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderTracking extends Model
{
    use HasFactory, HasCustomId;
    public function idPrefix(): string { return 'TRK'; }
    protected $fillable = [
        'order_id', 'driver_id', 'lat', 'lng', 'status'
    ];

    public function order() { return $this->belongsTo(Order::class); }
    public function driver() { return $this->belongsTo(User::class, 'driver_id'); }
}