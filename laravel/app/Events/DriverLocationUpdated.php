<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DriverLocationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $orderId;
    public $lat;
    public $lng;
    public $heading;

    /**
     * Create a new event instance.
     */
    public function __construct($orderId, $lat, $lng, $heading = 0)
    {
        $this->orderId = $orderId;
        $this->lat = (float) $lat;
        $this->lng = (float) $lng;
        $this->heading = (float) $heading;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('order.' . $this->orderId),
        ];
    }

    /**
     * Nama event yang dibroadcast secara kustom
     */
    public function broadcastAs(): string
    {
        return 'DriverLocationUpdated';
    }

    /**
     * Data yang akan dikirim ke client
     */
    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->orderId,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'heading' => $this->heading,
        ];
    }
}
