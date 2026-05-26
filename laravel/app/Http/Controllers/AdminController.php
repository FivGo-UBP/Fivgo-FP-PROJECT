<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Order;
use App\Models\DriverProfile;
use App\Models\DriverDocument;
use App\Models\Promo;
use App\Models\Report;
use App\Models\Withdrawal;
use App\Models\Notification;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function dashboard(Request $request)
    {
        return response()->json([
            'total_users' => User::count(),
            'active_drivers' => DriverProfile::where('status', 'online')->count(),
            'total_orders' => Order::count(),
            'revenue' => Order::sum('final_price')
        ]);
    }

    public function monitoring(Request $request)
    {
        $activeOrders = Order::whereNotIn('status', ['completed', 'cancelled', 'rejected'])->get();
        return response()->json(['active_orders' => $activeOrders]);
    }

    public function drivers(Request $request)
    {
        $drivers = User::where('role', 'driver')->with(['driverProfile', 'driverDocuments'])->get();
        return response()->json(['data' => $drivers]);
    }

    public function verifyDriver(Request $request, $id)
    {
        $driver = User::where('role', 'driver')->findOrFail($id);
        // Assuming we verify by updating document status or a verified flag
        DriverDocument::where('user_id', $driver->id)->update(['status' => 'approved']);
        return response()->json(['message' => 'Driver verified']);
    }

    public function toggleDriver(Request $request, $id)
    {
        $driver = User::where('role', 'driver')->findOrFail($id);
        // Could disable login or set profile status to suspended
        return response()->json(['message' => 'Driver status toggled']);
    }

    public function orders(Request $request)
    {
        $orders = Order::with(['customer', 'driver'])->orderBy('created_at', 'desc')->get();
        return response()->json(['data' => $orders]);
    }

    public function orderDetail(Request $request, $id)
    {
        $order = Order::with(['customer', 'driver', 'trackings'])->findOrFail($id);
        return response()->json($order);
    }

    public function analytics(Request $request)
    {
        // Mock analytics
        return response()->json([
            'orders_today' => Order::whereDate('created_at', today())->count(),
            'revenue_today' => Order::whereDate('created_at', today())->sum('final_price')
        ]);
    }

    public function createPromo(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:promos',
            'title' => 'required|string',
            'discount_percent' => 'required|integer|min:1|max:100',
            'max_discount' => 'required|integer',
            'quota' => 'integer',
            'start_date' => 'date',
            'end_date' => 'date'
        ]);

        $promo = Promo::create($validated);
        return response()->json($promo, 201);
    }

    public function reports(Request $request)
    {
        $reports = Report::with(['reporter', 'reported'])->get();
        return response()->json(['data' => $reports]);
    }

    public function respondReport(Request $request, $id)
    {
        $report = Report::findOrFail($id);
        $report->update([
            'status' => 'resolved',
        ]);
        return response()->json(['message' => 'Report resolved', 'report' => $report]);
    }

    public function withdrawals(Request $request)
    {
        $withdrawals = Withdrawal::with('driver')->orderBy('created_at', 'desc')->get();
        return response()->json(['data' => $withdrawals]);
    }

    public function processWithdrawal(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:processed,rejected',
            'notes' => 'nullable|string'
        ]);

        $withdrawal = Withdrawal::findOrFail($id);
        $withdrawal->update($validated);

        if ($validated['status'] === 'rejected' && $withdrawal->driver && $withdrawal->driver->driverProfile) {
            // Refund the balance to driver
            $withdrawal->driver->driverProfile->increment('wallet_balance', $withdrawal->amount);
        }

        return response()->json(['message' => 'Withdrawal processed', 'withdrawal' => $withdrawal]);
    }

    public function messages(Request $request)
    {
        $messages = Notification::whereNull('user_id')->get(); // Global messages
        return response()->json(['data' => $messages]);
    }

    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'message' => 'required|string',
            'user_id' => 'nullable|exists:users,id'
        ]);

        $notification = Notification::create($validated);
        return response()->json($notification, 201);
    }
}
