<?php

namespace App\Events;

use App\Models\Chat;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $chat;

    /**
     * Create a new event instance.
     */
    public function __construct(Chat $chat)
    {
        $this->chat = $chat;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        if (empty($this->chat->order_id)) {
            $sender = \App\Models\User::find($this->chat->sender_id);
            $userId = ($sender && $sender->role === 'admin') ? $this->chat->receiver_id : $this->chat->sender_id;
            return [
                new PrivateChannel('chat.support.' . $userId),
            ];
        }

        return [
            new PrivateChannel('chat.' . $this->chat->order_id),
        ];
    }

    /**
     * Nama event yang dibroadcast secara kustom
     */
    public function broadcastAs(): string
    {
        return 'MessageSent';
    }
    
    /**
     * Data yang akan dikirim ke client
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->chat->id,
            'order_id' => $this->chat->order_id,
            'sender_id' => $this->chat->sender_id,
            'receiver_id' => $this->chat->receiver_id,
            'message' => $this->chat->message,
            'image_url' => $this->chat->image_url,
            'created_at' => $this->chat->created_at->toIso8601String(),
        ];
    }
}
