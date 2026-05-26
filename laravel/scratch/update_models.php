<?php

$dir = __DIR__ . '/../app/Models/';

// Customer Address
$addr = "<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerAddress extends Model
{
    use HasFactory, HasUuids;
    protected \$fillable = [
        'user_id', 'title', 'full_address', 'lat', 'lng', 'notes', 'is_primary'
    ];
    public function user() { return \$this->belongsTo(User::class); }
}";

// Driver Profile
$driver = "<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriverProfile extends Model
{
    use HasFactory, HasUuids;
    protected \$fillable = [
        'user_id', 'status', 'rating', 'vehicle_type', 'plate_number', 'wallet_balance', 'current_lat', 'current_lng'
    ];
    public function user() { return \$this->belongsTo(User::class); }
}";

// Driver Document
$doc = "<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriverDocument extends Model
{
    use HasFactory, HasUuids;
    protected \$fillable = [
        'user_id', 'type', 'file_path', 'status'
    ];
    public function user() { return \$this->belongsTo(User::class); }
}";

// Report
$report = "<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory, HasUuids;
    protected \$fillable = [
        'reporter_id', 'reported_id', 'order_id', 'reason', 'description', 'status'
    ];
    public function reporter() { return \$this->belongsTo(User::class, 'reporter_id'); }
    public function reported() { return \$this->belongsTo(User::class, 'reported_id'); }
}";

file_put_contents($dir . 'CustomerAddress.php', $addr);
file_put_contents($dir . 'DriverProfile.php', $driver);
file_put_contents($dir . 'DriverDocument.php', $doc);
file_put_contents($dir . 'Report.php', $report);

echo "Models written.\n";
