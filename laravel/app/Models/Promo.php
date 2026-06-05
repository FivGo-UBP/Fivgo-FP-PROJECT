<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Promo extends Model
{
    use HasFactory, HasUuids;
    protected $fillable = [
        'code', 'title', 'description', 'discount_percent', 'max_discount', 
        'quota', 'used_count', 'start_date', 'end_date', 'is_active',
        'min_order_amount', 'limit_per_user', 'applicable_vehicles'
    ];
    
    protected function casts(): array {
        return [
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'applicable_vehicles' => 'array',
        ];
    }
}