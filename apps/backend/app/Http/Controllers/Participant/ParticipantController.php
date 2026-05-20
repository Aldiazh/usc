<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Http\Requests\JoinEventRequest;
use App\Http\Resources\ParticipantResource;
use App\Models\Participant;
use App\Events\LobbyUpdated;
use App\Services\GameService;
use App\Services\ParticipantService;
use Illuminate\Http\JsonResponse;

class ParticipantController extends Controller
{
    public function __construct(
        private ParticipantService $participantService,
        private GameService $gameService
    ) {}

    /**
     * Join an event using a 6-digit PIN.
     * No authentication required.
     */
    public function join(JoinEventRequest $request): JsonResponse
    {
        $participant = $this->participantService->joinByPin(
            $request->validated('pin'),
            $request->validated()
        );

        $participant->load('event');

        // Broadcast lobby update to all listeners on this event
        $allParticipants = $this->participantService->getByEvent($participant->event_id);
        broadcast(new LobbyUpdated(
            $participant->event_id,
            ParticipantResource::collection($allParticipants)->toArray(request())
        ));

        return response()->json([
            'message' => 'Joined successfully',
            'participant' => new ParticipantResource($participant),
        ], 201);
    }

    /**
     * Get current status for a participant (game state, score, rank, progress).
     */
    public function status(Participant $participant): JsonResponse
    {
        $participant->load('event');
        $event = $participant->event;

        $data = [
            'participant' => new ParticipantResource($participant),
            'event_status' => $event->status,
            'current_question_index' => $event->current_question_index,
            'total_questions' => $event->eventQuestions()->count(),
        ];

        // If game is live, include current question info
        if ($event->status === 'live') {
            $currentEQ = $this->gameService->getCurrentQuestion($event);
            if ($currentEQ) {
                $question = $currentEQ->question;
                $data['current_question'] = [
                    'event_question_id' => $currentEQ->id,
                    'question_text' => $question->question_text,
                    'type' => $question->type,
                    'options' => collect($question->options ?? [])->map(fn($o) => [
                        'id' => $o['id'],
                        'text' => $o['text'],
                    ])->toArray(),
                    'time_limit' => $question->time_limit_seconds,
                    'index' => $event->current_question_index,
                    'total' => $data['total_questions'],
                ];
            }
        }

        return response()->json($data);
    }

    /**
     * Get leaderboard/ranking for a participant's event.
     */
    public function ranking(Participant $participant): JsonResponse
    {
        $ranking = $this->participantService->getRanking($participant->event_id);

        return response()->json([
            'ranking' => ParticipantResource::collection($ranking),
            'my_rank' => $ranking->search(fn($p) => $p->id === $participant->id) + 1,
            'my_score' => $participant->fresh()->total_score,
        ]);
    }

    /**
     * Heartbeat — update participant online status.
     */
    public function heartbeat(Participant $participant): JsonResponse
    {
        $this->participantService->setOnline($participant, true);

        return response()->json(['status' => 'ok']);
    }
}
