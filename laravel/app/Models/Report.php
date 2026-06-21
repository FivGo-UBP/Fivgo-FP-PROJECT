<?php
namespace App\Models;
use App\Traits\HasCustomId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory, HasCustomId;
    public function idPrefix(): string { return 'LAP'; }
    protected $fillable = [
        'reporter_id', 'reported_id', 'order_id', 'reason', 'description', 'status', 'type'
    ];
    public function reporter() { return $this->belongsTo(User::class, 'reporter_id'); }
    public function reported() { return $this->belongsTo(User::class, 'reported_id'); }
}