<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Order;
use App\Events\MessageSent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ChatController extends Controller
{
    public function listMessages(Request $request, $order_id)
    {
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
            'message'  => 'nullable|string',
            'image'    => 'nullable|image|mimes:jpg,jpeg,png,webp,gif|max:5120',
        ]);

        // Must have at least a message or an image
        if (empty($validated['message']) && !$request->hasFile('image')) {
            return response()->json(['message' => 'Message or image is required'], 422);
        }

        $order = Order::findOrFail($validated['order_id']);
        $userId = $request->user()->id;

        if ($order->customer_id !== $userId && $order->driver_id !== $userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $receiverId = ($order->customer_id === $userId) ? $order->driver_id : $order->customer_id;

        if (!$receiverId) {
            return response()->json(['message' => 'Driver not assigned yet'], 400);
        }

        // Handle image upload
        $imageUrl = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('chats', 'public');
            $imageUrl = asset('storage/' . $path);
        }

        $chat = Chat::create([
            'order_id'    => $order->id,
            'sender_id'   => $userId,
            'receiver_id' => $receiverId,
            'message'     => $validated['message'] ?? '',
            'image_url'   => $imageUrl,
        ]);

        broadcast(new MessageSent($chat))->toOthers();

        return response()->json($chat, 201);
    }
}
