<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('driver_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('offline'); // online, offline, busy
            $table->decimal('rating', 3, 2)->default(5.00);
            $table->string('vehicle_type')->nullable(); // car, motorcycle
            $table->string('plate_number')->nullable();
            $table->integer('wallet_balance')->default(0);
            $table->decimal('current_lat', 10, 8)->nullable();
            $table->decimal('current_lng', 11, 8)->nullable();
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('driver_profiles');
    }
};