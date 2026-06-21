<?php
namespace App\Models;
use App\Traits\HasCustomId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriverProfile extends Model
{
    use HasFactory, HasCustomId;
    public function idPrefix(): string { return 'DPR'; }
    protected $fillable = [
        'user_id', 'status', 'rating', 'vehicle_type', 'plate_number', 'vehicle_brand', 'wallet_balance', 'current_lat', 'current_lng'
    ];
    public function user() { return $this->belongsTo(User::class); }
}