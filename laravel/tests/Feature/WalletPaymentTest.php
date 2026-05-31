<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Order;
use App\Models\Payment;
use App\Models\WalletTransaction;
use App\Models\DriverProfile;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class WalletPaymentTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_wallet_balance_endpoint_returns_balance_and_transactions(): void
    {
        $user = User::factory()->create([
            'wallet_balance' => 50000,
        ]);

        // Create a transaction record
        WalletTransaction::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $user->id,
            'amount' => 50000,
            'type' => 'topup',
            'status' => 'success',
            'reference' => 'TEST-REF-123',
            'payment_method' => 'qris',
            'description' => 'Top Up Saldo FivGo Pay',
        ]);

        $response = $this->actingAs($user, 'api')->getJson('/api/wallet/balance');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'balance',
                'transactions',
            ])
            ->assertJsonFragment([
                'balance' => 50000,
            ]);
    }

    public function test_pre_auth_payment_with_insufficient_wallet_balance(): void
    {
        $customer = User::factory()->create([
            'wallet_balance' => 10000,
        ]);

        $driver = User::factory()->create(['role' => 'driver']);
        DriverProfile::create([
            'user_id' => $driver->id,
            'status' => 'online',
            'current_lat' => -6.175392,
            'current_lng' => 106.827153,
            'vehicle_type' => 'motor',
            'plate_number' => 'B 1234 CD',
        ]);

        $order = Order::create([
            'customer_id' => $customer->id,
            'driver_id' => $driver->id,
            'pickup_address' => 'Point A',
            'pickup_lat' => -6.175392,
            'pickup_lng' => 106.827153,
            'dropoff_address' => 'Point B',
            'dropoff_lat' => -6.195325,
            'dropoff_lng' => 106.782006,
            'payment_method' => 'wallet',
            'status' => 'payment_pending',
            'estimated_price' => 25000,
        ]);

        $response = $this->actingAs($customer, 'api')->postJson('/api/payments/pre-auth', [
            'order_id' => $order->id,
            'method' => 'wallet',
            'amount' => 25000,
        ]);

        $response->assertStatus(400)
            ->assertJsonFragment([
                'message' => 'Saldo FivGo Pay tidak cukup. Silakan top up terlebih dahulu.',
            ]);
    }

    public function test_pre_auth_payment_with_sufficient_wallet_balance(): void
    {
        $customer = User::factory()->create([
            'wallet_balance' => 100000,
        ]);

        $driver = User::factory()->create(['role' => 'driver']);
        DriverProfile::create([
            'user_id' => $driver->id,
            'status' => 'online',
            'current_lat' => -6.175392,
            'current_lng' => 106.827153,
            'vehicle_type' => 'motor',
            'plate_number' => 'B 1234 CD',
        ]);

        $order = Order::create([
            'customer_id' => $customer->id,
            'driver_id' => $driver->id,
            'pickup_address' => 'Point A',
            'pickup_lat' => -6.175392,
            'pickup_lng' => 106.827153,
            'dropoff_address' => 'Point B',
            'dropoff_lat' => -6.195325,
            'dropoff_lng' => 106.782006,
            'payment_method' => 'wallet',
            'status' => 'payment_pending',
            'estimated_price' => 25000,
        ]);

        $response = $this->actingAs($customer, 'api')->postJson('/api/payments/pre-auth', [
            'order_id' => $order->id,
            'method' => 'wallet',
            'amount' => 25000,
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'method' => 'wallet',
                'status' => 'captured',
                'total_amount' => 25000,
            ]);

        // Assert customer balance has been decremented
        $customer->refresh();
        $this->assertEquals(75000, $customer->wallet_balance);

        // Assert ledger entry created
        $this->assertDatabaseHas('wallet_transactions', [
            'user_id' => $customer->id,
            'amount' => -25000,
            'type' => 'payment',
            'status' => 'success',
            'payment_method' => 'wallet',
        ]);

        // Assert order status released
        $order->refresh();
        $this->assertEquals('pending', $order->status);
    }

    public function test_cancellation_prepaid_refund(): void
    {
        $customer = User::factory()->create([
            'wallet_balance' => 0,
        ]);

        $order = Order::create([
            'customer_id' => $customer->id,
            'pickup_address' => 'Point A',
            'pickup_lat' => -6.175392,
            'pickup_lng' => 106.827153,
            'dropoff_address' => 'Point B',
            'dropoff_lat' => -6.195325,
            'dropoff_lng' => 106.782006,
            'payment_method' => 'wallet',
            'status' => 'pending',
            'estimated_price' => 30000,
        ]);

        // Create success payment record
        Payment::create([
            'order_id' => $order->id,
            'method' => 'wallet',
            'gateway' => 'wallet',
            'total_amount' => 30000,
            'status' => 'captured',
            'commission' => 6000,
            'net_income' => 24000,
        ]);

        $response = $this->actingAs($customer, 'api')->postJson("/api/orders/{$order->id}/cancel", [
            'reason' => 'Change of plans',
        ]);

        $response->assertStatus(200);

        // Verify customer wallet refunded
        $customer->refresh();
        $this->assertEquals(30000, $customer->wallet_balance);

        // Assert database ledger logs the refund
        $this->assertDatabaseHas('wallet_transactions', [
            'user_id' => $customer->id,
            'amount' => 30000,
            'type' => 'refund',
            'status' => 'success',
        ]);
    }

    public function test_cancellation_penalty_applied_and_driver_credited(): void
    {
        $customer = User::factory()->create([
            'wallet_balance' => 10000,
        ]);

        $driver = User::factory()->create(['role' => 'driver', 'wallet_balance' => 5000]);

        $order = Order::create([
            'customer_id' => $customer->id,
            'driver_id' => $driver->id,
            'pickup_address' => 'Point A',
            'pickup_lat' => -6.175392,
            'pickup_lng' => 106.827153,
            'dropoff_address' => 'Point B',
            'dropoff_lat' => -6.195325,
            'dropoff_lng' => 106.782006,
            'payment_method' => 'wallet',
            'status' => 'accepted',
            'estimated_price' => 30000,
        ]);

        $response = $this->actingAs($customer, 'api')->postJson("/api/orders/{$order->id}/cancel", [
            'reason' => 'Accidental order',
        ]);

        $response->assertStatus(200);

        // Verify penalty deducted from customer
        $customer->refresh();
        $this->assertEquals(7500, $customer->wallet_balance);

        // Verify penalty credited to driver
        $driver->refresh();
        $this->assertEquals(7500, $driver->wallet_balance);

        // Assert database ledger logs the penalty for customer
        $this->assertDatabaseHas('wallet_transactions', [
            'user_id' => $customer->id,
            'amount' => -2500,
            'type' => 'penalty',
            'status' => 'success',
        ]);

        // Assert database ledger logs the income compensation for driver
        $this->assertDatabaseHas('wallet_transactions', [
            'user_id' => $driver->id,
            'amount' => 2500,
            'type' => 'income',
            'status' => 'success',
        ]);
    }

    public function test_driver_rejection_prepaid_refund(): void
    {
        $customer = User::factory()->create([
            'role' => 'customer',
            'wallet_balance' => 0,
        ]);

        $driver = User::factory()->create(['role' => 'driver']);

        $order = Order::create([
            'customer_id' => $customer->id,
            'driver_id' => $driver->id,
            'pickup_address' => 'Point A',
            'pickup_lat' => -6.175392,
            'pickup_lng' => 106.827153,
            'dropoff_address' => 'Point B',
            'dropoff_lat' => -6.195325,
            'dropoff_lng' => 106.782006,
            'payment_method' => 'wallet',
            'status' => 'pending',
            'estimated_price' => 30000,
        ]);

        // Create success payment record
        Payment::create([
            'order_id' => $order->id,
            'method' => 'wallet',
            'gateway' => 'wallet',
            'total_amount' => 30000,
            'status' => 'captured',
            'commission' => 6000,
            'net_income' => 24000,
        ]);

        // Act as the driver and reject the order
        $driverToken = auth('api')->login($driver);
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $driverToken
        ])->postJson("/api/orders/{$order->id}/reject");

        $response->assertStatus(200);

        // Manually back-date updated_at to simulate polling delay (> 30 seconds)
        \DB::table('orders')->where('id', $order->id)->update([
            'updated_at' => now()->subSeconds(35)
        ]);
        $order->refresh();

        \App\Models\DriverProfile::where('status', 'online')->update(['status' => 'offline']);

        // Customer polls the active order endpoint to trigger auto-dispatch/refund
        $customerToken = auth('api')->login($customer);
        $activeResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $customerToken
        ])->getJson("/api/orders/active");
        $activeResponse->assertStatus(200);

        // Verify customer wallet refunded
        $customer->refresh();
        $this->assertEquals(30000, $customer->wallet_balance);

        // Assert database ledger logs the refund
        $this->assertDatabaseHas('wallet_transactions', [
            'user_id' => $customer->id,
            'amount' => 30000,
            'type' => 'refund',
            'status' => 'success',
        ]);

        // Assert order status rejected and driver set to null
        $order->refresh();
        $this->assertEquals('rejected', $order->status);
        $this->assertNull($order->driver_id);
    }
}
