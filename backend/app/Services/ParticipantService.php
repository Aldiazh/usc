<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Participant;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ParticipantService
{
    /**
     * Join an event by PIN code.
     * Uses authenticated user data for participant info.
     * Blocks users who have been eliminated in any event.
     */
    public function joinByPin(string $pin, User $user): Participant
    {
        return DB::transaction(function () use ($pin, $user) {
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

            // Check if user already joined this event
            $existing = Participant::where('event_id', $event->id)
                ->where('user_id', $user->id)
                ->first();

            if ($existing) {
                // If eliminated in this event, block rejoin
                if ($existing->isEliminated()) {
                    throw ValidationException::withMessages([
                        'pin' => ['Anda telah tereliminasi dari event ini dan tidak dapat bergabung kembali.'],
                    ]);
                }
                // Otherwise return existing participant
                return $existing;
            }

            // Check if user was eliminated in ANY previous event
            $wasEliminated = Participant::where('user_id', $user->id)
                ->where('status', 'eliminated')
                ->exists();

            if ($wasEliminated) {
                throw ValidationException::withMessages([
                    'pin' => ['Anda telah tereliminasi di event sebelumnya dan tidak dapat mengikuti event selanjutnya.'],
                ]);
            }

            return Participant::create([
                'event_id' => $event->id,
                'user_id' => $user->id,
                'nickname' => $user->name,
                'team_name' => $user->team_name,
                'institution' => $user->institution ?? '-',
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
