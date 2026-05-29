<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DriverLocationUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $orderId;
    public float $lat;
    public float $lng;
    public string $status;
    public bool $snapped;

    /**
     * Create a new event instance.
     *
     * @param string $orderId
     * @param float $lat
     * @param float $lng
     * @param string $status
     * @param bool $snapped
     */
    public function __construct(string $orderId, float $lat, float $lng, string $status, bool $snapped = false)
    {
        $this->orderId = $orderId;
        $this->lat = $lat;
        $this->lng = $lng;
        $this->status = $status;
        $this->snapped = $snapped;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('order.tracking.' . $this->orderId),
        ];
    }

    /**
     * Data yang akan dikirim ke client (penumpang).
     *
     * @return array
     */
    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->orderId,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'status' => $this->status,
            'snapped' => $this->snapped,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
