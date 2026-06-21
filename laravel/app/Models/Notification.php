<?php
namespace App\Models;
use App\Traits\HasCustomId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory, HasCustomId;
    public function idPrefix(): string { return 'NTF'; }
    protected $fillable = [
        'user_id', 'title', 'message', 'is_read'
    ];
}