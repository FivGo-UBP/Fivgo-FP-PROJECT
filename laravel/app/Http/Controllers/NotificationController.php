<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function listNotifications(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->orWhereNull('user_id')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json(['data' => $notifications]);
    }

    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::where('user_id', $request->user()->id)->findOrFail($id);
        $notification->update(['is_read' => true]);

        return response()->json(['message' => 'Notification marked as read', 'notification' => $notification]);
    }
}
