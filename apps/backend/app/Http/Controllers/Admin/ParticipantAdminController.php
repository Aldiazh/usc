<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ParticipantResource;
use App\Models\Event;
use App\Models\Participant;
use App\Services\ParticipantService;
use Illuminate\Http\JsonResponse;

class ParticipantAdminController extends Controller
{
    public function __construct(private ParticipantService $participantService) {}

    public function index(Event $event): JsonResponse
    {
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

    public function ranking(Event $event): JsonResponse
    {
        $ranking = $this->participantService->getRanking($event->id);
        return response()->json(ParticipantResource::collection($ranking));
    }
}
