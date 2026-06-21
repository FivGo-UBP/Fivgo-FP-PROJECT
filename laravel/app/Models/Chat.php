<?php

namespace App\Models;
use App\Traits\HasCustomId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    use HasFactory, HasCustomId;
    public function idPrefix(): string { return 'CHT'; }
    protected $fillable = [
        'order_id', 'sender_id', 'receiver_id', 'message', 'image_url', 'is_read'
    ];
    public function order() { return $this->belongsTo(Order::class); }
}