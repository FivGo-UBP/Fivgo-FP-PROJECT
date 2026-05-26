<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerAddress extends Model
{
    use HasFactory, HasUuids;
    protected $fillable = [
        'user_id', 'title', 'full_address', 'lat', 'lng', 'notes', 'is_primary'
    ];
    public function user() { return $this->belongsTo(User::class); }
}