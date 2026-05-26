<?php

$dirMig = __DIR__ . '/../database/migrations/';
$dirMod = __DIR__ . '/../app/Models/';

$files = scandir($dirMig);
$promoMigration = '';
$paymentMigration = '';

foreach ($files as $file) {
    if (strpos($file, 'create_promos_table.php') !== false) {
        $promoMigration = $file;
    }
    if (strpos($file, 'create_payments_table.php') !== false) {
        $paymentMigration = $file;
    }
}

$promoContent = "<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('promos', function (Blueprint \$table) {
            \$table->uuid('id')->primary();
            \$table->string('code')->unique();
            \$table->string('title');
            \$table->string('description')->nullable();
            \$table->integer('discount_percent');
            \$table->integer('max_discount');
            \$table->integer('quota')->default(0);
            \$table->integer('used_count')->default(0);
            \$table->timestamp('start_date')->nullable();
            \$table->timestamp('end_date')->nullable();
            \$table->boolean('is_active')->default(true);
            \$table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('promos');
    }
};";

$paymentContent = "<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('payments', function (Blueprint \$table) {
            \$table->uuid('id')->primary();
            \$table->foreignUuid('order_id')->constrained()->cascadeOnDelete();
            \$table->string('method'); // cash, e-wallet, credit_card
            \$table->integer('total_amount');
            \$table->integer('commission')->default(0);
            \$table->integer('net_income')->default(0);
            \$table->string('status')->default('pending'); // pending, authorized, captured, failed, cancelled
            \$table->string('transaction_id')->nullable(); // From payment gateway
            \$table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('payments');
    }
};";

file_put_contents($dirMig . $promoMigration, $promoContent);
file_put_contents($dirMig . $paymentMigration, $paymentContent);

$promoModel = "<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Promo extends Model
{
    use HasFactory, HasUuids;
    protected \$fillable = [
        'code', 'title', 'description', 'discount_percent', 'max_discount', 
        'quota', 'used_count', 'start_date', 'end_date', 'is_active'
    ];
    
    protected function casts(): array {
        return [
            'start_date' => 'datetime',
            'end_date' => 'datetime',
        ];
    }
}";

$paymentModel = "<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory, HasUuids;
    protected \$fillable = [
        'order_id', 'method', 'total_amount', 'commission', 'net_income', 'status', 'transaction_id'
    ];

    public function order() { return \$this->belongsTo(Order::class); }
}";

file_put_contents($dirMod . 'Promo.php', $promoModel);
file_put_contents($dirMod . 'Payment.php', $paymentModel);

echo "Migrations and Models for Phase 4 written.\n";
