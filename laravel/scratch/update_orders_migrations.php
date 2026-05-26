<?php

$dir = __DIR__ . '/../database/migrations/';

$files = scandir($dir);
$orderMigration = '';
$trackingMigration = '';

foreach ($files as $file) {
    if (strpos($file, 'create_orders_table.php') !== false) {
        $orderMigration = $file;
    }
    if (strpos($file, 'create_order_trackings_table.php') !== false) {
        $trackingMigration = $file;
    }
}

$orderContent = "<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('orders', function (Blueprint \$table) {
            \$table->uuid('id')->primary();
            \$table->foreignUuid('customer_id')->constrained('users')->cascadeOnDelete();
            \$table->foreignUuid('driver_id')->nullable()->constrained('users')->cascadeOnDelete();
            \$table->string('status')->default('pending'); // pending, accepted, started, completed, cancelled, rejected
            \$table->string('pickup_address');
            \$table->decimal('pickup_lat', 10, 8);
            \$table->decimal('pickup_lng', 11, 8);
            \$table->string('dropoff_address');
            \$table->decimal('dropoff_lat', 10, 8);
            \$table->decimal('dropoff_lng', 11, 8);
            \$table->integer('estimated_price')->default(0);
            \$table->integer('final_price')->nullable();
            \$table->string('payment_method')->default('cash');
            \$table->text('cancel_reason')->nullable();
            \$table->integer('rating')->nullable();
            \$table->text('review')->nullable();
            \$table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('orders');
    }
};";

$trackingContent = "<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('order_trackings', function (Blueprint \$table) {
            \$table->uuid('id')->primary();
            \$table->foreignUuid('order_id')->constrained()->cascadeOnDelete();
            \$table->foreignUuid('driver_id')->constrained('users')->cascadeOnDelete();
            \$table->decimal('lat', 10, 8);
            \$table->decimal('lng', 11, 8);
            \$table->string('status')->nullable();
            \$table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('order_trackings');
    }
};";

file_put_contents($dir . $orderMigration, $orderContent);
file_put_contents($dir . $trackingMigration, $trackingContent);

echo "Migrations for Orders written.\n";
