<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Order;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function listMessages(Request $request, $order_id)
    {
        // Ensure user is part of the order
        $order = Order::findOrFail($order_id);
        $userId = $request->user()->id;

        if ($order->customer_id !== $userId && $order->driver_id !== $userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $chats = Chat::where('order_id', $order_id)->orderBy('created_at', 'asc')->get();

        // Mark as read
        Chat::where('order_id', $order_id)
            ->where('receiver_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['data' => $chats]);
    }

    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'message' => 'required|string'
        ]);

        $order = Order::findOrFail($validated['order_id']);
        $userId = $request->user()->id;

        if ($order->customer_id !== $userId && $order->driver_id !== $userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $receiverId = ($order->customer_id === $userId) ? $order->driver_id : $order->customer_id;

        if (!$receiverId) {
            return response()->json(['message' => 'Driver not assigned yet'], 400);
        }

        $chat = Chat::create([
            'order_id' => $order->id,
            'sender_id' => $userId,
            'receiver_id' => $receiverId,
            'message' => $validated['message']
        ]);

        return response()->json($chat, 201);
    }
}
