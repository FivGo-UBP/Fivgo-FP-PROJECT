<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    use HasFactory, HasUuids;
    protected $fillable = [
        'order_id', 'sender_id', 'receiver_id', 'message', 'image_url', 'is_read'
    ];
    public function order() { return $this->belongsTo(Order::class); }
}