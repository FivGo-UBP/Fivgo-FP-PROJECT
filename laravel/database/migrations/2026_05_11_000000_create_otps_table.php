<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('otps', function (Blueprint $table) {
            $table->id();
            $table->string('phone');
            $table->enum('role', ['customer', 'driver']);
            $table->string('code'); // 4-digit OTP
            $table->timestamp('expires_at'); // OTP expiration time
            $table->integer('attempts')->default(0); // Track attempts
            $table->boolean('is_verified')->default(false);
            $table->timestamps();

            // Create composite index for faster lookups
            $table->index(['phone', 'role']);
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('otps');
    }
};
