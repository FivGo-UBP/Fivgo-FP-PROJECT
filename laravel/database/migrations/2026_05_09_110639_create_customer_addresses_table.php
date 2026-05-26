<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('customer_addresses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('title'); // e.g. Home, Work
            $table->text('full_address');
            $table->decimal('lat', 10, 8);
            $table->decimal('lng', 11, 8);
            $table->text('notes')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('customer_addresses');
    }
};