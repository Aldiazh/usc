<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Http\Requests\SubmitAnswerRequest;
use App\Models\Participant;
use App\Services\GameService;
use App\Services\ParticipantService;
use Illuminate\Http\JsonResponse;

class GamePlayController extends Controller
{
    public function __construct(
        private GameService $gameService,
        private ParticipantService $participantService
    ) {}

    /**
     * Submit an answer for the current question.
     */
    public function answer(SubmitAnswerRequest $request, Participant $participant): JsonResponse
    {
        $data = $request->validated();

        $answer = $this->gameService->submitAnswer(
            $participant,
            $data['event_question_id'],
            $data['selected_option_id'] ?? null,
            $data['text_answer'] ?? null,
            $data['time_taken_ms']
        );

        $participant = $participant->fresh();
        $ranking = $this->participantService->getRanking($participant->event_id);
        $myRank = $ranking->search(fn($p) => $p->id === $participant->id);

        return response()->json([
            'is_correct' => $answer->is_correct,
            'points_earned' => $answer->points_earned,
            'total_score' => $participant->total_score,
            'current_rank' => $myRank !== false ? $myRank + 1 : null,
        ]);
    }
}
