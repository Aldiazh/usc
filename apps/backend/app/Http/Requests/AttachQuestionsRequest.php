<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AttachQuestionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'question_ids' => 'required|array|min:1',
            'question_ids.*' => 'uuid|exists:questions,id',
            'phase' => 'nullable|integer|in:1,2,3',
        ];
    }
}
