<?php
namespace App\Models;
use App\Traits\HasCustomId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Promo extends Model
{
    use HasFactory, HasCustomId;
    public function idPrefix(): string { return 'PRO'; }
    protected $fillable = [
        'code', 'title', 'description', 'discount_percent', 'max_discount', 
        'quota', 'used_count', 'start_date', 'end_date', 'is_active',
        'min_order_amount', 'limit_per_user', 'applicable_vehicles',
        'type', 'image'
    ];
    
    protected function casts(): array {
        return [
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'applicable_vehicles' => 'array',
        ];
    }
}