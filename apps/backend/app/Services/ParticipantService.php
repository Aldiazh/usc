<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Participant;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
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
                // Otherwise return existing participant (e.g. reconnect)
                return $existing;
            }

            // Note: elimination only applies per-event.
            // A user eliminated from a previous event is still allowed to join a new event.

            $participant = Participant::create([
                'event_id' => $event->id,
                'user_id' => $user->id,
                'nickname' => $user->name,
                'institution' => $user->institution ?? '-',
                'status' => 'waiting',
                'role' => 'player',
                'joined_at' => now(),
            ]);

            Cache::forget('dashboard_stats');

            return $participant;
        });
    }

    /**
     * Get participants for a specific event (all, for admin).
     */
    public function getByEvent(string $eventId)
    {
        return $this->baseEventQuery($eventId)->get();
    }

    /**
     * PERF-03 FIX: Get a limited snapshot of participants for WebSocket lobby broadcasts.
     * Avoids loading all participants into memory on every join event.
     * Returns the most recently joined participants, up to $limit.
     */
    public function getLobbySnapshot(string $eventId, int $limit = 100): \Illuminate\Support\Collection
    {
        return Participant::where('event_id', $eventId)
            ->orderBy('joined_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function paginateByEvent(string $eventId, int $perPage = 30): LengthAwarePaginator
    {
        return $this->baseEventQuery($eventId)
            ->paginate($this->boundedPerPage($perPage));
    }

    /**
     * Get leaderboard (ranked participants).
     */
    public function getRanking(string $eventId): Collection
    {
        return $this->baseRankingQuery($eventId)
            ->get()
            ->map(function ($participant, $index) {
                $participant->setAttribute('current_rank', $index + 1);
                return $participant;
            });
    }

    public function paginateRanking(string $eventId, int $perPage = 50): LengthAwarePaginator
    {
        $ranking = $this->baseRankingQuery($eventId)
            ->paginate($this->boundedPerPage($perPage));

        $firstRank = $ranking->firstItem() ?? 1;
        $ranking->getCollection()->transform(function ($participant, $index) use ($firstRank) {
            $participant->setAttribute('current_rank', $firstRank + $index);
            return $participant;
        });

        return $ranking;
    }

    private function baseEventQuery(string $eventId)
    {
        return Participant::where('event_id', $eventId)
            ->orderBy('total_score', 'desc')
            ->orderBy('joined_at');
    }

    private function baseRankingQuery(string $eventId)
    {
        return Participant::where('event_id', $eventId)
            ->where('role', 'player')
            ->orderBy('total_score', 'desc')
            ->orderBy('joined_at');
    }

    private function boundedPerPage(int $perPage): int
    {
        return max(1, min($perPage, 100));
    }

    /**
     * Kick (remove) a participant.
     */
    public function kick(Participant $participant): void
    {
        $participant->delete();
        Cache::forget('dashboard_stats');
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
