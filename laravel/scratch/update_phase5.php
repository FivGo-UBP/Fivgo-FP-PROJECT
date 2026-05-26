<?php

$dirMig = __DIR__ . '/../database/migrations/';
$dirMod = __DIR__ . '/../app/Models/';

$files = scandir($dirMig);
$chatMigration = '';
$notifMigration = '';
$wdMigration = '';

foreach ($files as $file) {
    if (strpos($file, 'create_chats_table.php') !== false) {
        $chatMigration = $file;
    }
    if (strpos($file, 'create_notifications_table.php') !== false) {
        $notifMigration = $file;
    }
    if (strpos($file, 'create_withdrawals_table.php') !== false) {
        $wdMigration = $file;
    }
}

$chatContent = "<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('chats', function (Blueprint \$table) {
            \$table->uuid('id')->primary();
            \$table->foreignUuid('order_id')->constrained()->cascadeOnDelete();
            \$table->foreignUuid('sender_id')->constrained('users')->cascadeOnDelete();
            \$table->foreignUuid('receiver_id')->constrained('users')->cascadeOnDelete();
            \$table->text('message');
            \$table->boolean('is_read')->default(false);
            \$table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('chats');
    }
};";

$notifContent = "<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('notifications', function (Blueprint \$table) {
            \$table->uuid('id')->primary();
            \$table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete(); // nullable for global broadcast
            \$table->string('title');
            \$table->text('message');
            \$table->boolean('is_read')->default(false);
            \$table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('notifications');
    }
};";

$wdContent = "<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('withdrawals', function (Blueprint \$table) {
            \$table->uuid('id')->primary();
            \$table->foreignUuid('driver_id')->constrained('users')->cascadeOnDelete();
            \$table->integer('amount');
            \$table->string('status')->default('pending'); // pending, processed, rejected
            \$table->text('notes')->nullable();
            \$table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('withdrawals');
    }
};";

file_put_contents($dirMig . $chatMigration, $chatContent);
file_put_contents($dirMig . $notifMigration, $notifContent);
file_put_contents($dirMig . $wdMigration, $wdContent);

$chatModel = "<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    use HasFactory, HasUuids;
    protected \$fillable = [
        'order_id', 'sender_id', 'receiver_id', 'message', 'is_read'
    ];
    public function order() { return \$this->belongsTo(Order::class); }
}";

$notifModel = "<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory, HasUuids;
    protected \$fillable = [
        'user_id', 'title', 'message', 'is_read'
    ];
}";

$wdModel = "<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Withdrawal extends Model
{
    use HasFactory, HasUuids;
    protected \$fillable = [
        'driver_id', 'amount', 'status', 'notes'
    ];
    public function driver() { return \$this->belongsTo(User::class, 'driver_id'); }
}";

file_put_contents($dirMod . 'Chat.php', $chatModel);
file_put_contents($dirMod . 'Notification.php', $notifModel);
file_put_contents($dirMod . 'Withdrawal.php', $wdModel);

echo "Migrations and Models for Phase 5 written.\n";
