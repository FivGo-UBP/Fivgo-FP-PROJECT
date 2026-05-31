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
        // 1. Add wallet_balance to users table
        Schema::table('users', function (Blueprint $table) {
            $table->integer('wallet_balance')->default(0)->after('gender');
        });

        // 2. Create wallet_transactions table
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->integer('amount'); // Positive for credit, negative for debit
            $table->string('type'); // 'topup', 'payment', 'payout', etc.
            $table->string('status')->default('pending'); // 'pending', 'success', 'failed'
            $table->string('reference')->unique();
            $table->string('payment_method')->nullable();
            $table->string('transaction_id')->nullable();
            $table->json('gateway_payload')->nullable();
            $table->string('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('wallet_balance');
        });
    }
};
