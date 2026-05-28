<?php

namespace App\Http\Controllers\Admin;

use App\Events\GameEnded;
use App\Events\LobbyUpdated;
use App\Events\ParticipantEliminated;
use App\Events\QuestionEnded;
use App\Events\QuestionStarted;
use App\Http\Controllers\Controller;
use App\Http\Requests\EliminatePlayersRequest;
use App\Http\Resources\ParticipantResource;
use App\Models\Event;
use App\Services\GameService;
use App\Services\ParticipantService;
use Illuminate\Http\JsonResponse;

class GameController extends Controller
{
    public function __construct(
        private GameService $gameService,
        private ParticipantService $participantService
    ) {}

    /**
     * Start the game — transition event to live, send first question.
     */
    public function start(Event $event): JsonResponse
    {
        $eq = $this->gameService->startGame($event);
        $event = $event->fresh();

        $question = $eq->question;

        // Broadcast game start with first question
        broadcast(new QuestionStarted($event->id, [
            'event_question_id' => $eq->id,
            'question_text' => $question->question_text,
            'type' => $question->type,
            'options' => collect($question->options ?? [])->map(fn($o) => [
                'id' => $o['id'],
                'text' => $o['text'],
            ])->toArray(),
            'time_limit' => $question->time_limit_seconds,
            'index' => 0,
            'total' => $event->eventQuestions()->count(),
        ]));

        // Also broadcast lobby update so participants know game started
        $participants = $this->participantService->getByEvent($event->id);
        broadcast(new LobbyUpdated(
            $event->id,
            ParticipantResource::collection($participants)->toArray(request())
        ));

        return response()->json(['message' => 'Game started', 'event' => $event->fresh()]);
    }

    /**
     * Advance to the next question.
     */
    public function nextQuestion(Event $event): JsonResponse
    {
        $eq = $this->gameService->nextQuestion($event);
        if (!$eq) {
            return response()->json(['message' => 'No more questions'], 404);
        }

        $question = $eq->question;
        broadcast(new QuestionStarted($event->id, [
            'event_question_id' => $eq->id,
            'question_text' => $question->question_text,
            'type' => $question->type,
            'options' => collect($question->options ?? [])->map(fn($o) => [
                'id' => $o['id'],
                'text' => $o['text'],
            ])->toArray(),
            'time_limit' => $question->time_limit_seconds,
            'index' => $event->fresh()->current_question_index,
            'total' => $event->eventQuestions()->count(),
        ]));

        return response()->json(['message' => 'Next question sent']);
    }

    /**
     * End the current question, broadcast results with correct answer.
     */
    public function endQuestion(Event $event): JsonResponse
    {
        $stats = $this->gameService->endCurrentQuestion($event);
        $ranking = $this->participantService->getRanking($event->id);

        broadcast(new QuestionEnded($event->id, [
            'stats' => $stats,
            'scoreboard' => ParticipantResource::collection($ranking->take(10))->toArray(request()),
        ]));

        return response()->json(['message' => 'Question ended', 'stats' => $stats]);
    }

    /**
     * Eliminate players below survival threshold.
     */
    public function eliminate(EliminatePlayersRequest $request, Event $event): JsonResponse
    {
        $eliminated = $this->gameService->eliminatePlayers($event, $request->validated('survival_count'));

        // Broadcast elimination event so affected players transition to Eliminated screen
        broadcast(new ParticipantEliminated($event->id, $eliminated));

        // Broadcast updated lobby with new participant statuses
        $participants = $this->participantService->getByEvent($event->id);
        broadcast(new LobbyUpdated($event->id,
            ParticipantResource::collection($participants)->toArray(request())
        ));

        return response()->json([
            'message' => count($eliminated) . ' players eliminated',
            'eliminated_ids' => $eliminated,
        ]);
    }

    /**
     * End the entire game.
     */
    public function endGame(Event $event): JsonResponse
    {
        $event = $this->gameService->endGame($event);
        $ranking = $this->participantService->getRanking($event->id);

        broadcast(new GameEnded($event->id,
            ParticipantResource::collection($ranking)->toArray(request())
        ));

        return response()->json(['message' => 'Game ended']);
    }

    /**
     * Get live stats for the admin dashboard.
     */
    public function liveStats(Event $event): JsonResponse
    {
        return response()
            ->json($this->gameService->getLiveStats($event))
            ->header('Cache-Control', 'no-store');
    }
}
