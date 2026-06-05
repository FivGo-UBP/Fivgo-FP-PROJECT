<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory, HasUuids;
    protected $fillable = [
        'customer_id', 'driver_id', 'status', 'vehicle_type', 'pickup_address', 'pickup_lat', 'pickup_lng', 
        'dropoff_address', 'dropoff_lat', 'dropoff_lng', 'estimated_price', 'final_price',
        'payment_method', 'notes', 'cancel_reason', 'rating', 'review', 'promo_id', 'discount_amount'
    ];

    public function customer() { return $this->belongsTo(User::class, 'customer_id'); }
    public function promo() { return $this->belongsTo(Promo::class, 'promo_id'); }
    public function driver() { return $this->belongsTo(User::class, 'driver_id')->with('driverProfile'); }
    public function trackings() { return $this->hasMany(OrderTracking::class); }

    public static function cleanUpStaleRejectedOrders($customerId)
    {
        $staleOrders = self::where('customer_id', $customerId)
            ->where('status', 'rejected')
            ->where('updated_at', '<', now()->subMinutes(3))
            ->get();

        foreach ($staleOrders as $order) {
            \Illuminate\Support\Facades\DB::transaction(function () use ($order) {
                /** @var \App\Models\Order $order */
                $payment = Payment::where('order_id', $order->id)
                    ->whereIn('status', ['paid', 'captured', 'success', 'settled'])
                    ->first();

                $customer = $order->customer;

                if ($payment && $customer) {
                    $customer->increment('wallet_balance', $payment->total_amount);

                    WalletTransaction::create([
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'user_id' => $customer->id,
                        'amount' => $payment->total_amount,
                        'type' => 'refund',
                        'status' => 'success',
                        'reference' => 'FIVGO-REFUND-AUTO-' . $order->id . '-' . \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(8)),
                        'payment_method' => 'wallet',
                        'description' => 'Refund Otomatis Sistem Expired (Order #' . substr($order->id, 0, 8) . ')',
                    ]);
                }

                $order->update([
                    'status' => 'cancelled',
                    'cancel_reason' => 'Auto cancelled stale rejected order due to inactivity'
                ]);
            });
        }
    }
}