<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Determine if we should hide correct answers (security during live games)
        $isAdminRequest = $request->is('api/admin/*');

        $data = [
            'id' => $this->id,
            'question_text' => $this->question_text,
            'type' => $this->type,
            'difficulty' => $this->difficulty,
            'topic' => $this->topic,
            'time_limit_seconds' => $this->time_limit_seconds,
            'points' => $this->points,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];

        if ($isAdminRequest) {
            // Admin can always see full question data including answers
            $data['options'] = $this->options;
            $data['correct_answer'] = $this->correct_answer;
        } else {
            // Participants only see option text, not which is correct
            $data['options'] = collect($this->options ?? [])->map(fn($o) => [
                'id' => $o['id'],
                'text' => $o['text'],
            ])->toArray();
        }

        return $data;
    }
}
