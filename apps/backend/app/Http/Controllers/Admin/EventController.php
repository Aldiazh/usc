<?php

namespace App\Http\Controllers\Admin;

use App\Events\LobbyUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEventRequest;
use App\Http\Resources\EventResource;
use App\Http\Resources\ParticipantResource;
use App\Models\Event;
use App\Services\EventService;
use App\Services\ParticipantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function __construct(
        private EventService $eventService,
        private ParticipantService $participantService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $events = $this->eventService->list($request->only('status'));
        return response()->json(EventResource::collection($events));
    }

    public function store(StoreEventRequest $request): JsonResponse
    {
        $event = $this->eventService->create($request->validated());

        return response()->json(new EventResource($event), 201);
    }

    public function show(Event $event): JsonResponse
    {
        return response()->json(new EventResource($this->eventService->show($event)));
    }

    public function update(Request $request, Event $event): JsonResponse
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'settings' => 'nullable|array',
            'max_participants' => 'nullable|integer|min:2|max:500',
            'scheduled_at' => 'nullable|date',
        ]);

        $event = $this->eventService->update($event, $data);

        return response()->json(new EventResource($event));
    }

    public function destroy(Event $event): JsonResponse
    {
        $this->eventService->delete($event);
        return response()->json(['message' => 'Event deleted']);
    }

    public function attachQuestions(Request $request, Event $event): JsonResponse
    {
        $data = $request->validate([
            'question_ids' => 'required|array',
            'question_ids.*' => 'uuid|exists:questions,id',
            'phase' => 'nullable|integer|in:1,2,3',
        ]);

        $this->eventService->attachQuestions(
            $event,
            $data['question_ids'],
            $data['phase'] ?? 1
        );

        return response()->json(['message' => 'Questions attached successfully']);
    }

    public function updateStatus(Request $request, Event $event): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:draft,lobby,live,paused,finished',
        ]);

        $event = $this->eventService->updateStatus($event, $data['status']);

        // Broadcast lobby update when transitioning to lobby
        if ($event->status === 'lobby') {
            $participants = $this->participantService->getByEvent($event->id);
            broadcast(new LobbyUpdated(
                $event->id,
                ParticipantResource::collection($participants)->toArray(request())
            ));
        }

        return response()->json(new EventResource($event));
    }
}
