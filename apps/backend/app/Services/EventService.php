<?php

namespace App\Services;

use App\Models\Event;
use App\Models\EventQuestion;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EventService
{
    public function list(array $filters = [])
    {
        $query = Event::with(['participants' => fn($q) => $q->select('id', 'event_id', 'is_online')]);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    public function create(array $data): Event
    {
        $data['user_id'] = Auth::id();
        $data['pin'] = $this->generateUniquePin();

        return Event::create($data);
    }

    public function update(Event $event, array $data): Event
    {
        $event->update($data);
        return $event->fresh();
    }

    public function delete(Event $event): void
    {
        $event->delete();
    }

    public function show(Event $event): Event
    {
        return $event->load(['questions', 'participants']);
    }

    /**
     * Attach questions to event with sort order.
     * @param array $questionIds Array of question UUIDs
     */
    public function attachQuestions(Event $event, array $questionIds, int $phase = 1): void
    {
        DB::transaction(function () use ($event, $questionIds, $phase) {
            foreach (array_values($questionIds) as $index => $questionId) {
                EventQuestion::updateOrCreate(
                    ['event_id' => $event->id, 'question_id' => $questionId],
                    ['sort_order' => $index, 'phase' => $phase]
                );
            }
        });
    }

    public function updateStatus(Event $event, string $status): Event
    {
        return $this->transitionTo($event, $status);
    }

    public function getDashboardStats(): array
    {
        return [
            'active_events' => Event::whereIn('status', ['lobby', 'live'])->count(),
            'total_questions' => \App\Models\Question::count(),
            'total_participants' => \App\Models\Participant::count(),
            'events' => Event::withCount('participants')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
        ];
    }

    private function generateUniquePin(): string
    {
        do {
            $pin = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        } while (Event::where('pin', $pin)->exists());

        return $pin;
    }

    public function transitionTo(Event $event, string $status, array $extraAttributes = []): Event
    {
        $allowedTransitions = [
            'draft' => ['draft', 'lobby', 'live'],
            'lobby' => ['lobby', 'live', 'finished'],
            'live' => ['live', 'paused', 'finished'],
            'paused' => ['paused', 'live', 'finished'],
            'finished' => ['finished'],
        ];

        $currentStatus = $event->status;

        if (!in_array($status, $allowedTransitions[$currentStatus] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot transition event from {$currentStatus} to {$status}."],
            ]);
        }

        return DB::transaction(function () use ($event, $status, $extraAttributes) {
            $attributes = array_merge($extraAttributes, ['status' => $status]);

            if ($status === 'live' && !$event->started_at && !array_key_exists('started_at', $attributes)) {
                $attributes['started_at'] = now();
            }

            if ($status === 'finished' && !array_key_exists('ended_at', $attributes)) {
                $attributes['ended_at'] = now();
            }

            $event->update($attributes);

            return $event->fresh();
        });
    }
}
