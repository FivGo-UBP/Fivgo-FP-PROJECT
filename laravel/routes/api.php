<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::prefix('auth')->group(function () {
    Route::post('/request-otp', [AuthController::class, 'requestOtp']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/google-login', [AuthController::class, 'googleLogin']);
    Route::post('/admin-login', [AuthController::class, 'adminLogin']);
    
    Route::middleware('auth:api')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh-token', [AuthController::class, 'refreshToken']);
    });
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\TrackingController;
use App\Http\Controllers\PromoController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AdminController;

Route::middleware('auth:api')->group(function () {
    // Customer Endpoints
    Route::prefix('customers')->group(function () {
        Route::get('me', [CustomerController::class, 'me']);
        Route::put('me', [CustomerController::class, 'updateProfile']);
        Route::get('addresses', [CustomerController::class, 'getAddresses']);
        Route::post('addresses', [CustomerController::class, 'createAddress']);
        Route::put('addresses/{id}', [CustomerController::class, 'updateAddress']);
        Route::delete('addresses/{id}', [CustomerController::class, 'deleteAddress']);
        Route::get('history', [CustomerController::class, 'history']);
        Route::get('history/{id}', [CustomerController::class, 'historyDetail']);
        Route::post('report-driver', [CustomerController::class, 'reportDriver']);
        Route::post('request-phone-change-otp', [CustomerController::class, 'requestPhoneChangeOtp']);
        Route::post('change-phone', [CustomerController::class, 'changePhone']);
        Route::delete('me', [CustomerController::class, 'deleteAccount']);
    });

    // Driver Endpoints
    Route::prefix('drivers')->group(function () {
        Route::post('register', [DriverController::class, 'register']);
        Route::post('documents', [DriverController::class, 'uploadDocuments']);
        Route::get('me', [DriverController::class, 'me']);
        Route::put('me', [DriverController::class, 'updateProfile']);
        Route::post('me', [DriverController::class, 'updateProfile']); // Support multipart form data via POST + X-HTTP-Method-Override
        Route::post('request-phone-change-otp', [DriverController::class, 'requestPhoneChangeOtp']);
        Route::post('change-phone', [DriverController::class, 'changePhone']);
        Route::patch('status', [DriverController::class, 'updateStatus']);
        Route::post('location', [DriverController::class, 'updateLocation']);
        Route::get('history', [DriverController::class, 'history']);
        Route::get('history/{id}', [DriverController::class, 'historyDetail']);
        Route::get('performance', [DriverController::class, 'performance']);
        Route::post('report-customer', [DriverController::class, 'reportCustomer']);
    });

    // Tracking Endpoints
    Route::get('drivers/nearby', [TrackingController::class, 'nearbyDrivers']);

    // Order Endpoints
    Route::prefix('orders')->group(function () {
        Route::post('/', [OrderController::class, 'create']);
        Route::get('active', [OrderController::class, 'active']); // Must be before {id}
        Route::get('{id}', [OrderController::class, 'detail']);
        Route::post('{id}/accept', [OrderController::class, 'accept']);
        Route::post('{id}/arrived', [OrderController::class, 'arrived']);
        Route::post('{id}/start', [OrderController::class, 'start']);
        Route::post('{id}/complete', [OrderController::class, 'complete']);
        Route::post('{id}/cancel', [OrderController::class, 'cancel']);
        Route::post('{id}/reject', [OrderController::class, 'reject']);
        Route::post('{id}/retry', [OrderController::class, 'retry']);
        Route::post('{id}/rating', [OrderController::class, 'rating']);
        
        // Tracking
        Route::get('{id}/tracking', [TrackingController::class, 'tracking']);
    });

    // Promo Endpoints
    Route::prefix('promos')->group(function () {
        Route::get('/', [PromoController::class, 'listAvailable']);
        Route::get('{id}', [PromoController::class, 'detail']);
        Route::post('apply', [PromoController::class, 'apply']);
    });

    // Payment Endpoints
    Route::prefix('payments')->group(function () {
        Route::post('pre-auth', [PaymentController::class, 'preAuth']);
        Route::post('capture', [PaymentController::class, 'capture']);
        Route::post('cancel', [PaymentController::class, 'cancel']);
        Route::get('{order_id}', [PaymentController::class, 'status']);
    });

    // Wallet Endpoints
    Route::prefix('wallet')->group(function () {
        Route::get('balance', [\App\Http\Controllers\WalletController::class, 'balance']);
        Route::post('topup', [\App\Http\Controllers\WalletController::class, 'topup']);
        Route::post('withdraw', [\App\Http\Controllers\WalletController::class, 'withdraw']);
    });

    // Chat Endpoints
    Route::prefix('chats')->group(function () {
        Route::get('support/messages', [ChatController::class, 'listSupportMessages']);
        Route::post('support/messages', [ChatController::class, 'sendSupportMessage']);
        Route::get('/', [ChatController::class, 'getConversations']);
        Route::get('{order_id}', [ChatController::class, 'listMessages']);
        Route::post('/', [ChatController::class, 'sendMessage']);
    });

    // Notification Endpoints
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'listNotifications']);
        Route::patch('{id}/read', [NotificationController::class, 'markAsRead']);
    });

    // Admin Endpoints
    Route::prefix('admin')->group(function () {
        Route::get('dashboard', [AdminController::class, 'dashboard']);
        Route::get('monitoring', [AdminController::class, 'monitoring']);
        Route::get('drivers', [AdminController::class, 'drivers']);
        Route::patch('drivers/{id}/verify', [AdminController::class, 'verifyDriver']);
        Route::patch('drivers/{id}/toggle', [AdminController::class, 'toggleDriver']);
        Route::get('orders', [AdminController::class, 'orders']);
        Route::get('orders/{id}', [AdminController::class, 'orderDetail']);
        Route::get('analytics', [AdminController::class, 'analytics']);
        Route::post('promos', [AdminController::class, 'createPromo']);
        Route::get('reports', [AdminController::class, 'reports']);
        Route::post('reports/{id}/respond', [AdminController::class, 'respondReport']);
        Route::get('withdrawals', [AdminController::class, 'withdrawals']);
        Route::post('withdrawals/{id}/process', [AdminController::class, 'processWithdrawal']);
        Route::get('messages', [AdminController::class, 'messages']);
        Route::post('messages', [AdminController::class, 'sendMessage']);
    });

    // Custom Broadcast Auth for JWT
    Route::post('/broadcasting/auth', function (Request $request) {
        return \Illuminate\Support\Facades\Broadcast::auth($request);
    });
});

// Webhook outside sanctum middleware
Route::post('/payments/webhook', [PaymentController::class, 'webhook']);
Route::post('/wallet/webhook', [\App\Http\Controllers\WalletController::class, 'webhook']);

// Form Submissions (public — no auth required)
use App\Http\Controllers\FormPengajuanController;
use App\Http\Controllers\LaporanMasalahController;

Route::post('/form-pengajuan', [FormPengajuanController::class, 'submit']);
Route::post('/laporan-masalah', [LaporanMasalahController::class, 'submit']);
