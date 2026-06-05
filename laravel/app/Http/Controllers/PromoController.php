<?php

namespace App\Http\Controllers;

use App\Models\Promo;
use Illuminate\Http\Request;

class PromoController extends Controller
{
    public function listAvailable(Request $request)
    {
        $promos = Promo::where('is_active', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->where(function ($query) {
                $query->where('quota', 0)
                      ->orWhereRaw('used_count < quota');
            })
            ->get();
            
        return response()->json(['data' => $promos]);
    }

    public function detail(Request $request, $id)
    {
        $promo = Promo::findOrFail($id);
        return response()->json($promo);
    }

    public function apply(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'order_amount' => 'required|integer',
            'vehicle_type' => 'nullable|string',
            'payment_method' => 'nullable|string'
        ]);

        $promo = Promo::where('code', $validated['code'])
            ->where('is_active', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->first();

        if (!$promo) {
            return response()->json(['message' => 'Promo tidak valid atau sudah kadaluarsa'], 400);
        }

        // Cek Syarat: Metode Pembayaran (Harus Non-Tunai)
        if (isset($validated['payment_method'])) {
            $paymentMethod = strtolower($validated['payment_method']);
            if (in_array($paymentMethod, ['tunai', 'cash'], true)) {
                return response()->json(['message' => 'Promo hanya dapat digunakan dengan metode pembayaran non-tunai.'], 400);
            }
        }

        if ($promo->quota > 0 && $promo->used_count >= $promo->quota) {
            return response()->json(['message' => 'Kuota promo sudah habis'], 400);
        }

        // Cek Syarat: Minimal Harga Order
        if ($validated['order_amount'] < $promo->min_order_amount) {
            return response()->json(['message' => 'Harga perjalanan belum memenuhi syarat minimum promo ini (Min. Rp' . number_format($promo->min_order_amount, 0, ',', '.') . ')'], 400);
        }

        // Cek Syarat: Jenis Kendaraan
        if (isset($validated['vehicle_type']) && $promo->applicable_vehicles) {
            $vehicles = is_array($promo->applicable_vehicles) ? $promo->applicable_vehicles : json_decode($promo->applicable_vehicles, true);
            if (is_array($vehicles) && !in_array($validated['vehicle_type'], $vehicles)) {
                return response()->json(['message' => 'Promo ini tidak berlaku untuk jenis kendaraan ' . ucfirst($validated['vehicle_type'])], 400);
            }
        }

        // Cek Syarat: Batas Pemakaian Per User
        $user = $request->user();
        if ($user) {
            $usageCount = \App\Models\Order::where('customer_id', $user->id)
                ->where('promo_id', $promo->id)
                ->whereIn('status', ['completed', 'pending', 'accepted', 'started'])
                ->count();

            if ($usageCount >= $promo->limit_per_user) {
                return response()->json(['message' => 'Anda sudah menggunakan promo ini melebihi batas yang ditentukan (' . $promo->limit_per_user . 'x)'], 400);
            }

            // Cek Syarat Khusus Misi / New User
            $codeUpper = strtoupper($promo->code);
            if ($codeUpper === 'FIVGOMOTOR10X') {
                $completedMotorOrders = \App\Models\Order::where('customer_id', $user->id)
                    ->where('vehicle_type', 'motor')
                    ->where('status', 'completed')
                    ->count();
                if ($completedMotorOrders < 10) {
                    return response()->json(['message' => "Promo ini hanya berlaku setelah Anda menyelesaikan 10x perjalanan FivGO Motor. Perjalanan Anda saat ini: {$completedMotorOrders}/10."], 400);
                }
            } elseif ($codeUpper === 'FIVGOMOBILBARU') {
                $hasMobilOrder = \App\Models\Order::where('customer_id', $user->id)
                    ->where('vehicle_type', 'mobil')
                    ->where('status', 'completed')
                    ->exists();
                if ($hasMobilOrder) {
                    return response()->json(['message' => 'Promo ini hanya berlaku untuk perjalanan pertama kali menggunakan FivGO Mobil.'], 400);
                }
            } elseif ($codeUpper === 'FIVGOMOTORBARU') {
                $hasMotorOrder = \App\Models\Order::where('customer_id', $user->id)
                    ->where('vehicle_type', 'motor')
                    ->where('status', 'completed')
                    ->exists();
                if ($hasMotorOrder) {
                    return response()->json(['message' => 'Promo ini hanya berlaku untuk perjalanan pertama kali menggunakan FivGO Motor.'], 400);
                }
            }
        }

        $discount = ($validated['order_amount'] * $promo->discount_percent) / 100;
        if ($discount > $promo->max_discount) {
            $discount = $promo->max_discount;
        }

        return response()->json([
            'promo_id' => $promo->id,
            'promo_code' => $promo->code,
            'discount_amount' => (int)$discount,
            'final_amount' => $validated['order_amount'] - (int)$discount
        ]);
    }
}
