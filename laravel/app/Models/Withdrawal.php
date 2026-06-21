<?php
namespace App\Models;
use App\Traits\HasCustomId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Withdrawal extends Model
{
    use HasFactory, HasCustomId;
    public function idPrefix(): string { return 'WDR'; }
    protected $fillable = [
        'driver_id', 'amount', 'status', 'notes'
    ];
    public function driver() { return $this->belongsTo(User::class, 'driver_id'); }
}