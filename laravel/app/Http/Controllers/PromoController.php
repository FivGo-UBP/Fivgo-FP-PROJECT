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
            ->whereRaw('used_count < quota')
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
            'order_amount' => 'required|integer'
        ]);

        $promo = Promo::where('code', $validated['code'])
            ->where('is_active', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->first();

        if (!$promo) {
            return response()->json(['message' => 'Promo tidak valid atau sudah kadaluarsa'], 400);
        }

        if ($promo->quota > 0 && $promo->used_count >= $promo->quota) {
            return response()->json(['message' => 'Kuota promo sudah habis'], 400);
        }

        $discount = ($validated['order_amount'] * $promo->discount_percent) / 100;
        if ($discount > $promo->max_discount) {
            $discount = $promo->max_discount;
        }

        return response()->json([
            'promo_code' => $promo->code,
            'discount_amount' => (int)$discount,
            'final_amount' => $validated['order_amount'] - (int)$discount
        ]);
    }
}
