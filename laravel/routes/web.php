<?php

use App\Http\Controllers\Admin\WebAdminController;
use Illuminate\Support\Facades\Route;

Route::get('/login', function () {
    return redirect()->route('admin.login');
})->name('login');

Route::get('/', function () {
    return view('landing.index');
});

Route::get('/kebijakan-privasi', function () {
    return view('landing.kebijakan-privasi');
});

Route::get('/syarat-ketentuan', function () {
    return view('landing.syarat-ketentuan');
});

Route::prefix('admin')->name('admin.')->controller(WebAdminController::class)->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('login', 'showLogin')->name('login');
        Route::post('login', 'login')->name('login.store');
    });

    Route::middleware('auth')->group(function () {
        Route::get('/', 'dashboard')->name('dashboard');
        Route::get('dashboard', fn () => redirect()->route('admin.dashboard'))->name('dashboard.redirect');
        Route::get('monitoring', 'monitoring')->name('monitoring');
        Route::get('analytics', 'analytics')->name('analytics');
        Route::get('customers', 'customers')->name('customers');
        Route::get('customers/{id}', 'showCustomer')->name('customers.show');
        Route::delete('customers/{id}', 'destroyCustomer')->name('customers.destroy');
        
        Route::get('drivers', 'drivers')->name('drivers');
        Route::get('drivers/create', 'createDriver')->name('drivers.create');
        Route::post('drivers', 'storeDriver')->name('drivers.store');
        Route::get('drivers/{id}', 'showDriver')->name('drivers.show');
        Route::put('drivers/{id}', 'updateDriver')->name('drivers.update');
        Route::delete('drivers/{id}', 'destroyDriver')->name('drivers.destroy');
        
        Route::post('users/{id}/toggle-status', 'toggleUserStatus')->name('users.toggle-status');
        Route::get('verification', 'verification')->name('verification');
        Route::get('orders', 'orders')->name('orders');
        Route::get('orders/{id}', 'showOrder')->name('orders.show');
        Route::get('promo', 'promo')->name('promo');
        Route::get('promo/create', 'createPromo')->name('promo.create');
        Route::post('promo', 'storePromo')->name('promo.store');
        Route::get('promo/{id}/edit', 'editPromo')->name('promo.edit');
        Route::put('promo/{id}', 'updatePromo')->name('promo.update');
        Route::delete('promo/{id}', 'destroyPromo')->name('promo.destroy');
        Route::get('reports/customer', 'reportsCustomer')->name('reports.customer');
        Route::get('reports/driver', 'reportsDriver')->name('reports.driver');
        Route::post('reports/tindakan', 'tindakanReport')->name('reports.tindakan');
        Route::post('reports/{id}/status', 'updateReportStatus')->name('reports.status.update');
        Route::delete('reports/{id}', 'destroyReport')->name('reports.destroy');
        Route::get('messages', 'messages')->name('messages');
        Route::get('messages/conversations', 'getConversations')->name('messages.conversations');
        Route::get('messages/user/{userId}', 'getChatMessages')->name('messages.user');
        Route::post('messages/send', 'adminSendMessage')->name('messages.send');
        Route::get('withdrawals', 'withdrawals')->name('withdrawals');
        Route::post('logout', 'logout')->name('logout');
    });
});
