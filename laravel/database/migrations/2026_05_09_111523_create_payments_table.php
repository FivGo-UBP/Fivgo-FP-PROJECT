<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->constrained()->cascadeOnDelete();
            $table->string('method'); // cash, e-wallet, credit_card
            $table->integer('total_amount');
            $table->integer('commission')->default(0);
            $table->integer('net_income')->default(0);
            $table->string('status')->default('pending'); // pending, authorized, captured, failed, cancelled
            $table->string('transaction_id')->nullable(); // From payment gateway
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('payments');
    }
};