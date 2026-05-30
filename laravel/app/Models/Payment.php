<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory, HasUuids;
    protected $fillable = [
        'order_id',
        'method',
        'gateway',
        'total_amount',
        'commission',
        'net_income',
        'status',
        'transaction_id',
        'gateway_payload',
        'expires_at',
    ];

    protected $casts = [
        'gateway_payload' => 'array',
        'expires_at' => 'datetime',
    ];

    public function order() { return $this->belongsTo(Order::class); }
}
