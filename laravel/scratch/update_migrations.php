<?php

$dir = __DIR__ . '/../database/migrations/';

// Customer Address
$addr = "<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('customer_addresses', function (Blueprint \$table) {
            \$table->uuid('id')->primary();
            \$table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            \$table->string('title'); // e.g. Home, Work
            \$table->text('full_address');
            \$table->decimal('lat', 10, 8);
            \$table->decimal('lng', 11, 8);
            \$table->text('notes')->nullable();
            \$table->boolean('is_primary')->default(false);
            \$table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('customer_addresses');
    }
};";

// Driver Profile
$driver = "<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('driver_profiles', function (Blueprint \$table) {
            \$table->uuid('id')->primary();
            \$table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            \$table->string('status')->default('offline'); // online, offline, busy
            \$table->decimal('rating', 3, 2)->default(5.00);
            \$table->string('vehicle_type')->nullable(); // car, motorcycle
            \$table->string('plate_number')->nullable();
            \$table->integer('wallet_balance')->default(0);
            \$table->decimal('current_lat', 10, 8)->nullable();
            \$table->decimal('current_lng', 11, 8)->nullable();
            \$table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('driver_profiles');
    }
};";

// Driver Document
$doc = "<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('driver_documents', function (Blueprint \$table) {
            \$table->uuid('id')->primary();
            \$table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            \$table->string('type'); // ktp, sim, stnk
            \$table->string('file_path');
            \$table->string('status')->default('pending'); // pending, approved, rejected
            \$table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('driver_documents');
    }
};";

// Report
$report = "<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('reports', function (Blueprint \$table) {
            \$table->uuid('id')->primary();
            \$table->foreignUuid('reporter_id')->constrained('users')->cascadeOnDelete();
            \$table->foreignUuid('reported_id')->constrained('users')->cascadeOnDelete();
            \$table->uuid('order_id')->nullable(); // will add orders table later
            \$table->string('reason');
            \$table->text('description')->nullable();
            \$table->string('status')->default('open');
            \$table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('reports');
    }
};";

file_put_contents($dir . '2026_05_09_110639_create_customer_addresses_table.php', $addr);
file_put_contents($dir . '2026_05_09_110639_create_driver_profiles_table.php', $driver);
file_put_contents($dir . '2026_05_09_110639_create_driver_documents_table.php', $doc);
file_put_contents($dir . '2026_05_09_110639_create_reports_table.php', $report);

echo "Migrations written.\n";
