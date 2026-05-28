<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParticipantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nickname' => $this->nickname,
            'institution' => $this->institution,
            'status' => $this->status,
            'role' => $this->role,
            'total_score' => $this->total_score,
            'current_rank' => $this->current_rank,
            'is_online' => $this->is_online,
            'joined_at' => $this->joined_at?->toISOString(),
            'event' => new EventResource($this->whenLoaded('event')),
        ];
    }
}
