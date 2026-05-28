<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'pin' => $this->pin,
            'status' => $this->status,
            'settings' => $this->settings,
            'max_participants' => $this->max_participants,
            'current_question_index' => $this->current_question_index,
            'participants_count' => $this->when(
                $this->relationLoaded('participants'),
                fn() => $this->participants->count(),
                $this->participants_count ?? 0
            ),
            'online_count' => $this->when(
                $this->relationLoaded('participants'),
                fn() => $this->participants->where('is_online', true)->count()
            ),
            'questions_count' => $this->when(
                $this->relationLoaded('questions'),
                fn() => $this->questions->count(),
                $this->questions_count ?? 0
            ),
            'questions' => QuestionResource::collection($this->whenLoaded('questions')),
            'scheduled_at' => $this->scheduled_at?->toISOString(),
            'started_at' => $this->started_at?->toISOString(),
            'ended_at' => $this->ended_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
