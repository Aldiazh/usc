<?php

namespace App\Services;

use App\Models\Answer;
use App\Models\Event;
use App\Models\EventQuestion;
use App\Models\Participant;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class GameService
{
    public function __construct(private EventService $eventService) {}

    /**
     * Process an answer submission from a participant.
     */
    public function submitAnswer(
        Participant $participant,
        string $eventQuestionId,
        ?string $selectedOptionId,
        ?string $textAnswer,
        int $timeTakenMs
    ): Answer {
        $eventQuestion = EventQuestion::with(['event', 'question'])->findOrFail($eventQuestionId);
        $event = $eventQuestion->event;
        $question = $eventQuestion->question;

        if ($participant->event_id !== $event->id) {
            throw ValidationException::withMessages([
                'event_question_id' => ['The selected question does not belong to the participant event.'],
            ]);
        }

        if ($event->status !== 'live') {
            throw ValidationException::withMessages([
                'event' => ['Answers are only accepted while the event is live.'],
            ]);
        }

        if ($participant->role !== 'player' || in_array($participant->status, ['eliminated', 'finished'], true)) {
            throw ValidationException::withMessages([
                'participant' => ['This participant is not allowed to answer the current question.'],
            ]);
        }

        $currentQuestion = $this->getCurrentQuestion($event);

        if (!$currentQuestion || $currentQuestion->id !== $eventQuestion->id) {
            throw ValidationException::withMessages([
                'event_question_id' => ['Answers are only accepted for the current live question.'],
            ]);
        }

        $this->assertAnswerPayloadIsValid($question->type, $selectedOptionId, $textAnswer);

        try {
            return DB::transaction(function () use ($participant, $eventQuestionId, $question, $selectedOptionId, $textAnswer, $timeTakenMs) {
                $existing = Answer::where('participant_id', $participant->id)
                    ->where('event_question_id', $eventQuestionId)
                    ->first();

                if ($existing) {
                    return $existing;
                }

                $isCorrect = $this->isCorrectAnswer($question->type, $question->options ?? [], $question->correct_answer, $selectedOptionId, $textAnswer);
                $pointsEarned = $this->calculatePoints(
                    (int) ($question->points ?? 0),
                    (int) ($question->time_limit_seconds ?? 30),
                    $isCorrect,
                    $timeTakenMs
                );

                $answer = Answer::create([
                    'participant_id' => $participant->id,
                    'event_question_id' => $eventQuestionId,
                    'selected_option_id' => $selectedOptionId,
                    'text_answer' => $textAnswer,
                    'is_correct' => $isCorrect,
                    'points_earned' => $pointsEarned,
                    'time_taken_ms' => $timeTakenMs,
                ]);

                if ($pointsEarned > 0) {
                    $participant->increment('total_score', $pointsEarned);
                }

                return $answer;
            });
        } catch (QueryException $exception) {
            if ($this->isUniqueConstraintViolation($exception)) {
                return Answer::where('participant_id', $participant->id)
                    ->where('event_question_id', $eventQuestionId)
                    ->firstOrFail();
            }

            throw $exception;
        }
    }

    /**
     * Get the current question for an event based on its index.
     */
    public function getCurrentQuestion(Event $event): ?EventQuestion
    {
        return $event->eventQuestions()
            ->with('question')
            ->skip($event->current_question_index)
            ->first();
    }

    /**
     * Advance to the next question.
     */
    public function nextQuestion(Event $event): ?EventQuestion
    {
        return DB::transaction(function () use ($event) {
            $lockedEvent = Event::query()->lockForUpdate()->findOrFail($event->id);

            if ($lockedEvent->status !== 'live') {
                throw ValidationException::withMessages([
                    'event' => ['The event must be live before moving to the next question.'],
                ]);
            }

            $nextIndex = $lockedEvent->current_question_index + 1;
            $totalQuestions = $lockedEvent->eventQuestions()->count();

            if ($nextIndex >= $totalQuestions) {
                return null;
            }

            $lockedEvent->update(['current_question_index' => $nextIndex]);

            return $this->getCurrentQuestion($lockedEvent->fresh());
        });
    }

    /**
     * Get live stats for admin during a game.
     */
    public function getLiveStats(Event $event): array
    {
        $currentEQ = $this->getCurrentQuestion($event);

        $answeredCount = 0;
        $avgTime = 0;
        $correctCount = 0;

        if ($currentEQ) {
            $answers = Answer::where('event_question_id', $currentEQ->id)->get();
            $answeredCount = $answers->count();
            $avgTime = $answers->avg('time_taken_ms') ?? 0;
            $correctCount = $answers->where('is_correct', true)->count();
        }

        return [
            'total_participants' => $event->participants()->where('role', 'player')->count(),
            'online_count' => $event->participants()->where('is_online', true)->count(),
            'answered_count' => $answeredCount,
            'correct_count' => $correctCount,
            'avg_time_ms' => (int) $avgTime,
            'current_question_index' => $event->current_question_index,
            'total_questions' => $event->eventQuestions()->count(),
        ];
    }

    /**
     * Eliminate players below the survival threshold.
     */
    public function eliminatePlayers(Event $event, int $survivalCount): array
    {
        return DB::transaction(function () use ($event, $survivalCount) {
            $lockedEvent = Event::query()->lockForUpdate()->findOrFail($event->id);

            if ($lockedEvent->status !== 'live') {
                throw ValidationException::withMessages([
                    'event' => ['Players can only be eliminated while the event is live.'],
                ]);
            }

            $players = $lockedEvent->participants()
                ->where('role', 'player')
                ->where('status', '!=', 'eliminated')
                ->orderBy('total_score', 'desc')
                ->get();

            if ($survivalCount > $players->count()) {
                throw ValidationException::withMessages([
                    'survival_count' => ['Survival count cannot exceed the number of active players.'],
                ]);
            }

            $eliminated = [];

            foreach ($players as $index => $player) {
                if ($index >= $survivalCount) {
                    $player->update([
                        'status' => 'eliminated',
                        'role' => 'spectator',
                    ]);
                    $eliminated[] = $player->id;
                }
            }

            return $eliminated;
        });
    }

    public function startGame(Event $event): EventQuestion
    {
        if ($event->eventQuestions()->count() === 0) {
            throw ValidationException::withMessages([
                'event' => ['No questions are attached to this event.'],
            ]);
        }

        $event = $this->eventService->transitionTo($event->fresh(), 'live', [
            'current_question_index' => 0,
            'ended_at' => null,
        ]);

        // Transition all waiting participants to playing
        $event->participants()
            ->where('status', 'waiting')
            ->where('role', 'player')
            ->update(['status' => 'playing']);

        $currentQuestion = $this->getCurrentQuestion($event);

        if (!$currentQuestion) {
            throw ValidationException::withMessages([
                'event' => ['Unable to determine the first question for this event.'],
            ]);
        }

        return $currentQuestion;
    }

    public function endCurrentQuestion(Event $event): array
    {
        if ($event->status !== 'live') {
            throw ValidationException::withMessages([
                'event' => ['The event must be live before ending the current question.'],
            ]);
        }

        $stats = $this->getLiveStats($event);

        // Include correct answer info for the current question
        $currentEQ = $this->getCurrentQuestion($event);
        if ($currentEQ && $currentEQ->question) {
            $question = $currentEQ->question;
            $stats['correct_answer'] = $question->correct_answer;
            $stats['correct_option_ids'] = collect($question->options ?? [])
                ->filter(fn($o) => $o['isCorrect'] ?? false)
                ->pluck('id')
                ->values()
                ->toArray();
        }

        return $stats;
    }

    public function endGame(Event $event): Event
    {
        $event = $this->eventService->transitionTo($event->fresh(), 'finished');

        // Transition all remaining playing participants to finished
        $event->participants()
            ->where('status', 'playing')
            ->update(['status' => 'finished']);

        return $event;
    }

    private function assertAnswerPayloadIsValid(string $type, ?string $selectedOptionId, ?string $textAnswer): void
    {
        if ($type === 'multiple_choice' && blank($selectedOptionId)) {
            throw ValidationException::withMessages([
                'selected_option_id' => ['A selected option is required for multiple choice questions.'],
            ]);
        }

        if ($type === 'short_answer' && blank($textAnswer)) {
            throw ValidationException::withMessages([
                'text_answer' => ['A text answer is required for short answer questions.'],
            ]);
        }
    }

    private function isCorrectAnswer(
        string $type,
        array $options,
        ?string $correctAnswer,
        ?string $selectedOptionId,
        ?string $textAnswer
    ): bool {
        if ($type === 'multiple_choice' && $selectedOptionId) {
            foreach ($options as $option) {
                if (($option['id'] ?? null) === $selectedOptionId && ($option['isCorrect'] ?? false)) {
                    return true;
                }
            }
        }

        if ($type === 'short_answer' && $textAnswer) {
            return strtolower(trim($textAnswer)) === strtolower(trim($correctAnswer ?? ''));
        }

        return false;
    }

    private function calculatePoints(int $maxPoints, int $timeLimitSeconds, bool $isCorrect, int $timeTakenMs): int
    {
        if (!$isCorrect) {
            return 0;
        }

        $timeLimitMs = max(1, $timeLimitSeconds * 1000);
        $timeRatio = max(0, 1 - ($timeTakenMs / $timeLimitMs));

        return (int) round($maxPoints * (0.5 + 0.5 * $timeRatio));
    }

    private function isUniqueConstraintViolation(QueryException $exception): bool
    {
        $sqlState = (string) ($exception->errorInfo[0] ?? '');

        return in_array($sqlState, ['23000', '23505'], true);
    }
}
