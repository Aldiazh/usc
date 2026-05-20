<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Participant;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ParticipantService
{
    /**
     * Join an event by PIN code.
     */
    public function joinByPin(string $pin, array $playerData): Participant
    {
        return DB::transaction(function () use ($pin, $playerData) {
            $event = Event::query()
                ->where('pin', $pin)
                ->whereIn('status', ['lobby', 'live'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($event->participants()->count() >= $event->max_participants) {
                throw ValidationException::withMessages([
                    'pin' => ['Event is full. Maximum participants reached.'],
                ]);
            }

            return Participant::create([
                'event_id' => $event->id,
                'nickname' => $playerData['nickname'],
                'team_name' => $playerData['team_name'] ?? null,
                'institution' => $playerData['institution'],
                'status' => 'waiting',
                'role' => 'player',
                'joined_at' => now(),
            ]);
        });
    }

    /**
     * Get participants for a specific event.
     */
    public function getByEvent(string $eventId)
    {
        return Participant::where('event_id', $eventId)
            ->orderBy('total_score', 'desc')
            ->get();
    }

    /**
     * Get leaderboard (ranked participants).
     */
    public function getRanking(string $eventId): Collection
    {
        return Participant::where('event_id', $eventId)
            ->where('role', 'player')
            ->orderBy('total_score', 'desc')
            ->get()
            ->map(function ($participant, $index) {
                $participant->setAttribute('current_rank', $index + 1);
                return $participant;
            });
    }

    /**
     * Kick (remove) a participant.
     */
    public function kick(Participant $participant): void
    {
        $participant->delete();
    }

    /**
     * Add score points to a participant.
     */
    public function addScore(Participant $participant, int $points): Participant
    {
        $participant->increment('total_score', $points);
        return $participant->fresh();
    }

    /**
     * Update participant connection status.
     */
    public function setOnline(Participant $participant, bool $online, ?string $socketId = null): void
    {
        $participant->update([
            'is_online' => $online,
            'socket_id' => $socketId,
        ]);
    }
}
