<?php
namespace App\Models;
use App\Traits\HasCustomId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriverDocument extends Model
{
    use HasFactory, HasCustomId;
    public function idPrefix(): string { return 'DDC'; }
    protected $fillable = [
        'user_id', 'type', 'file_path', 'status'
    ];
    public function user() { return $this->belongsTo(User::class); }
}