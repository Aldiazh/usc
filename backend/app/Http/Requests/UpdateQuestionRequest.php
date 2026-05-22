<?php

namespace App\Http\Requests;

use App\Support\QuestionPayload;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return QuestionPayload::updateRules();
    }

    public function withValidator(Validator $validator): void
    {
        QuestionPayload::applyConditionalRules($validator, partial: true);
    }
}
