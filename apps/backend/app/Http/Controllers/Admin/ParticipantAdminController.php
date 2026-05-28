<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ParticipantResource;
use App\Models\Event;
use App\Models\Participant;
use App\Services\ParticipantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParticipantAdminController extends Controller
{
    public function __construct(private ParticipantService $participantService) {}

    public function index(Event $event, Request $request): JsonResponse
    {
        if ($request->boolean('paginated')) {
            $participants = $this->participantService->paginateByEvent(
                $event->id,
                $request->integer('per_page', 30)
            );

            return response()->json($participants->through(
                fn($participant) => (new ParticipantResource($participant))->resolve($request)
            ));
        }

        $participants = $this->participantService->getByEvent($event->id);
        return response()->json(ParticipantResource::collection($participants));
    }

    public function kick(Event $event, Participant $participant): JsonResponse
    {
        // Scope guard: ensure participant belongs to this event
        if ($participant->event_id !== $event->id) {
            return response()->json(['message' => 'Participant does not belong to this event'], 403);
        }

        $this->participantService->kick($participant);
        return response()->json(['message' => 'Participant removed']);
    }

    public function ranking(Event $event, Request $request): JsonResponse
    {
        if ($request->boolean('paginated')) {
            $ranking = $this->participantService->paginateRanking(
                $event->id,
                $request->integer('per_page', 50)
            );

            return response()->json($ranking->through(
                fn($participant) => (new ParticipantResource($participant))->resolve($request)
            ));
        }

        $ranking = $this->participantService->getRanking($event->id);
        return response()->json(ParticipantResource::collection($ranking));
    }
}
