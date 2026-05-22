<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitAnswerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'event_question_id' => 'required|uuid|exists:event_questions,id',
            'selected_option_id' => 'nullable|string',
            'text_answer' => 'nullable|string',
            'time_taken_ms' => 'required|integer|min:0',
        ];
    }
}
