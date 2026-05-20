<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Support\QuestionPayload;
use Illuminate\Validation\Validator;

class StoreQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return QuestionPayload::createRules();
    }

    public function withValidator(Validator $validator): void
    {
        QuestionPayload::applyConditionalRules($validator);
    }
}
