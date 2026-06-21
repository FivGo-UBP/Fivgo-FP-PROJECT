<?php

namespace App\Models;

use App\Traits\HasCustomId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WalletTransaction extends Model
{
    use HasFactory, HasCustomId;
    public function idPrefix(): string { return 'TRX'; }

    protected $fillable = [
        'user_id',
        'amount',
        'type',
        'status',
        'reference',
        'payment_method',
        'transaction_id',
        'gateway_payload',
        'description',
    ];

    protected $casts = [
        'gateway_payload' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
