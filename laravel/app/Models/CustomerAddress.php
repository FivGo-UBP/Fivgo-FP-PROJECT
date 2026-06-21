<?php
namespace App\Models;
use App\Traits\HasCustomId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerAddress extends Model
{
    use HasFactory, HasCustomId;
    public function idPrefix(): string { return 'ADR'; }
    protected $fillable = [
        'user_id', 'title', 'full_address', 'lat', 'lng', 'notes', 'is_primary'
    ];
    public function user() { return $this->belongsTo(User::class); }
}