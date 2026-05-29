<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('chat.{orderId}', function ($user, $orderId) {
    $order = \App\Models\Order::find($orderId);
    if (!$order) {
        return false;
    }
    return $user->id === $order->user_id || $user->id === $order->driver_id;
});

Broadcast::channel('order.tracking.{orderId}', function ($user, $orderId) {
    $order = \App\Models\Order::find($orderId);
    if (!$order) {
        return false;
    }
    // Otorisasi: hanya penumpang (customer) atau driver pesanan ini yang dapat mengakses tracking channel
    return $user->id === $order->customer_id || $user->id === $order->driver_id;
});
