<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Mengubah semua kolom ID dari UUID ke string(20) dengan format custom prefix.
     * Strategi: Drop SEMUA FK dulu, ubah kolom, lalu re-add FK.
     */
    public function up(): void
    {
        // ══════════════════════════════════════════════════════
        // FASE 1: DROP SEMUA FOREIGN KEY CONSTRAINTS
        // Harus dilakukan sebelum mengubah tipe kolom primary key
        // ══════════════════════════════════════════════════════

        Schema::table('customer_addresses', fn(Blueprint $t) => $t->dropForeign(['user_id']));
        Schema::table('driver_documents',   fn(Blueprint $t) => $t->dropForeign(['user_id']));
        Schema::table('driver_profiles',    fn(Blueprint $t) => $t->dropForeign(['user_id']));
        Schema::table('notifications',      fn(Blueprint $t) => $t->dropForeign(['user_id']));
        Schema::table('wallet_transactions',fn(Blueprint $t) => $t->dropForeign(['user_id']));
        Schema::table('withdrawals',        fn(Blueprint $t) => $t->dropForeign(['driver_id']));
        Schema::table('profile_update_requests', fn(Blueprint $t) => $t->dropForeign(['user_id']));

        Schema::table('reports', function (Blueprint $t) {
            $t->dropForeign(['reporter_id']);
            $t->dropForeign(['reported_id']);
        });

        Schema::table('orders', function (Blueprint $t) {
            $t->dropForeign(['customer_id']);
            $t->dropForeign(['driver_id']);
        });

        // Drop promo_id FK jika ada
        $promoFk = collect(Schema::getForeignKeys('orders'))
            ->firstWhere(fn($fk) => in_array('promo_id', $fk['columns']));
        if ($promoFk) {
            DB::statement('ALTER TABLE `orders` DROP FOREIGN KEY `' . $promoFk['name'] . '`');
        }

        Schema::table('order_trackings', function (Blueprint $t) {
            $t->dropForeign(['order_id']);
            $t->dropForeign(['driver_id']);
        });

        Schema::table('payments', fn(Blueprint $t) => $t->dropForeign(['order_id']));

        // Chats — drop semua FK yang ada secara dinamis
        foreach (Schema::getForeignKeys('chats') as $fk) {
            DB::statement('ALTER TABLE `chats` DROP FOREIGN KEY `' . $fk['name'] . '`');
        }

        // ══════════════════════════════════════════════════════
        // FASE 2: UBAH TIPE KOLOM PRIMARY KEY
        // ══════════════════════════════════════════════════════

        // users
        Schema::table('users', fn(Blueprint $t) => $t->string('id', 20)->change());

        // sessions (hanya index, bukan FK)
        Schema::table('sessions', fn(Blueprint $t) => $t->string('user_id', 20)->nullable()->change());

        // promos
        Schema::table('promos', fn(Blueprint $t) => $t->string('id', 20)->change());

        // orders
        Schema::table('orders', function (Blueprint $t) {
            $t->string('id', 20)->change();
            $t->string('customer_id', 20)->change();
            $t->string('driver_id', 20)->nullable()->change();
            $t->string('promo_id', 20)->nullable()->change();
        });

        // order_trackings
        Schema::table('order_trackings', function (Blueprint $t) {
            $t->string('id', 20)->change();
            $t->string('order_id', 20)->change();
            $t->string('driver_id', 20)->change();
        });

        // payments
        Schema::table('payments', function (Blueprint $t) {
            $t->string('id', 20)->change();
            $t->string('order_id', 20)->change();
        });

        // chats
        Schema::table('chats', function (Blueprint $t) {
            $t->string('id', 20)->change();
            $t->string('order_id', 20)->nullable()->change();
            $t->string('sender_id', 20)->change();
            $t->string('receiver_id', 20)->change();
        });

        // reports
        Schema::table('reports', function (Blueprint $t) {
            $t->string('id', 20)->change();
            $t->string('reporter_id', 20)->change();
            $t->string('reported_id', 20)->change();
            $t->string('order_id', 20)->nullable()->change();
        });

        // notifications
        Schema::table('notifications', function (Blueprint $t) {
            $t->string('id', 20)->change();
            $t->string('user_id', 20)->nullable()->change();
        });

        // withdrawals
        Schema::table('withdrawals', function (Blueprint $t) {
            $t->string('id', 20)->change();
            $t->string('driver_id', 20)->change();
        });

        // wallet_transactions
        Schema::table('wallet_transactions', function (Blueprint $t) {
            $t->string('id', 20)->change();
            $t->string('user_id', 20)->change();
        });

        // driver_profiles
        Schema::table('driver_profiles', function (Blueprint $t) {
            $t->string('id', 20)->change();
            $t->string('user_id', 20)->change();
        });

        // driver_documents
        Schema::table('driver_documents', function (Blueprint $t) {
            $t->string('id', 20)->change();
            $t->string('user_id', 20)->change();
        });

        // customer_addresses
        Schema::table('customer_addresses', function (Blueprint $t) {
            $t->string('id', 20)->change();
            $t->string('user_id', 20)->change();
        });

        // profile_update_requests
        Schema::table('profile_update_requests', function (Blueprint $t) {
            $t->string('id', 20)->change();
            $t->string('user_id', 20)->change();
        });

        // ══════════════════════════════════════════════════════
        // FASE 3: RE-ADD FOREIGN KEY CONSTRAINTS
        // ══════════════════════════════════════════════════════

        Schema::table('customer_addresses',
            fn(Blueprint $t) => $t->foreign('user_id')->references('id')->on('users')->cascadeOnDelete());
        Schema::table('driver_documents',
            fn(Blueprint $t) => $t->foreign('user_id')->references('id')->on('users')->cascadeOnDelete());
        Schema::table('driver_profiles',
            fn(Blueprint $t) => $t->foreign('user_id')->references('id')->on('users')->cascadeOnDelete());
        Schema::table('notifications',
            fn(Blueprint $t) => $t->foreign('user_id')->references('id')->on('users')->nullOnDelete());
        Schema::table('wallet_transactions',
            fn(Blueprint $t) => $t->foreign('user_id')->references('id')->on('users')->cascadeOnDelete());
        Schema::table('withdrawals',
            fn(Blueprint $t) => $t->foreign('driver_id')->references('id')->on('users')->cascadeOnDelete());
        Schema::table('profile_update_requests',
            fn(Blueprint $t) => $t->foreign('user_id')->references('id')->on('users')->cascadeOnDelete());

        Schema::table('reports', function (Blueprint $t) {
            $t->foreign('reporter_id')->references('id')->on('users')->cascadeOnDelete();
            $t->foreign('reported_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::table('orders', function (Blueprint $t) {
            $t->foreign('customer_id')->references('id')->on('users')->cascadeOnDelete();
            $t->foreign('driver_id')->references('id')->on('users')->nullOnDelete();
            $t->foreign('promo_id')->references('id')->on('promos')->nullOnDelete();
        });

        Schema::table('order_trackings', function (Blueprint $t) {
            $t->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            $t->foreign('driver_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::table('payments',
            fn(Blueprint $t) => $t->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete());

        Schema::table('chats', function (Blueprint $t) {
            $t->foreign('sender_id')->references('id')->on('users')->cascadeOnDelete();
            $t->foreign('receiver_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Untuk rollback penuh diperlukan fresh migrate karena format data sudah berbeda
        // Tabel ini tidak dapat di-rollback tanpa data loss
    }
};
