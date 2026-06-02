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

        // Check if user is either current customer, current driver, or has participated in the chat
        $isParticipant = $order->customer_id === $userId 
            || $order->driver_id === $userId 
            || Chat::where('order_id', $order_id)
                ->where(function ($q) use ($userId) {
                    $q->where('sender_id', $userId)
                      ->orWhere('receiver_id', $userId);
                })->exists();

        if (!$isParticipant) {
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

        try {
            broadcast(new MessageSent($chat))->toOthers();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Broadcasting failed: ' . $e->getMessage());
        }

        return response()->json($chat, 201);
    }

    public function getConversations(Request $request)
    {
        $userId = $request->user()->id;

        // Fetch chats where the user is sender or receiver, ordered by latest first
        $chats = Chat::where('sender_id', $userId)
            ->orWhere('receiver_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        $grouped = $chats->groupBy('order_id');

        $conversations = [];

        foreach ($grouped as $orderId => $orderChats) {
            $latestChat = $orderChats->first();
            $order = Order::with(['customer', 'driver'])->find($orderId);

            if (!$order) {
                continue;
            }

            // Determine other participant
            $otherUser = null;
            if ($order->customer_id === $userId) {
                $otherUser = $order->driver;
            } else if ($order->driver_id === $userId) {
                $otherUser = $order->customer;
            }

            // Fallback: if order participant is null (e.g. cancelled/cleared driver), determine other user from chats
            if (!$otherUser) {
                $otherUserId = null;
                foreach ($orderChats as $chat) {
                    if ($chat->sender_id !== $userId) {
                        $otherUserId = $chat->sender_id;
                        break;
                    }
                    if ($chat->receiver_id !== $userId) {
                        $otherUserId = $chat->receiver_id;
                        break;
                    }
                }
                if ($otherUserId) {
                    $otherUser = \App\Models\User::find($otherUserId);
                }
            }

            // Calculate unread count for current user
            $unreadCount = $orderChats->where('receiver_id', $userId)->where('is_read', false)->count();

            // Structure conversation item
            $conversations[] = [
                'order_id' => $orderId,
                'last_message' => $latestChat->message ?: '[Gambar]',
                'last_message_time' => $latestChat->created_at->toIso8601String(),
                'unread_count' => $unreadCount,
                'other_user' => $otherUser ? [
                    'id' => $otherUser->id,
                    'name' => $otherUser->name,
                    'photo' => $otherUser->photo,
                    'role' => $otherUser->role,
                ] : null,
                'order_status' => $order->status,
            ];
        }

        return response()->json(['data' => $conversations]);
    }
}
