<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Withdrawal extends Model
{
    use HasFactory, HasUuids;
    protected $fillable = [
        'driver_id', 'amount', 'status', 'notes'
    ];
    public function driver() { return $this->belongsTo(User::class, 'driver_id'); }
}