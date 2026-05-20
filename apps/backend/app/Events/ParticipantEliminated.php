<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ParticipantEliminated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $eventId,
        public array $eliminatedIds
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel("event.{$this->eventId}");
    }

    public function broadcastAs(): string
    {
        return 'participant.eliminated';
    }
}
