<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('reporter_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('reported_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('order_id')->nullable(); // will add orders table later
            $table->string('reason');
            $table->text('description')->nullable();
            $table->string('status')->default('open');
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('reports');
    }
};