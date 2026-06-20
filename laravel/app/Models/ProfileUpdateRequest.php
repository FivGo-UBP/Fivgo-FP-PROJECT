<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ProfileUpdateRequest extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'type',
        'old_data',
        'new_data',
        'status',
        'notes',
    ];

    protected $casts = [
        'old_data' => 'array',
        'new_data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
