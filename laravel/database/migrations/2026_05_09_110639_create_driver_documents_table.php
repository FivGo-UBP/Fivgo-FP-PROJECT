<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('driver_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // ktp, sim, stnk
            $table->string('file_path');
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('driver_documents');
    }
};