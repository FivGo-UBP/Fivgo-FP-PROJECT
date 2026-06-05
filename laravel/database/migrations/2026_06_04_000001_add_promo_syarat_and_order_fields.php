<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('promos', function (Blueprint $table) {
            $table->integer('min_order_amount')->default(0)->after('max_discount');
            $table->integer('limit_per_user')->default(1)->after('min_order_amount');
            $table->text('applicable_vehicles')->nullable()->after('limit_per_user'); // stored as JSON array, e.g., ["motor", "mobil"]
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignUuid('promo_id')->nullable()->after('payment_method')->constrained('promos')->nullOnDelete();
            $table->integer('discount_amount')->default(0)->after('promo_id');
        });
    }

    public function down(): void {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['promo_id']);
            $table->dropColumn(['promo_id', 'discount_amount']);
        });

        Schema::table('promos', function (Blueprint $table) {
            $table->dropColumn(['min_order_amount', 'limit_per_user', 'applicable_vehicles']);
        });
    }
};
