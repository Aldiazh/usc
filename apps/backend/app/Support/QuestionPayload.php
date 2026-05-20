<?php

namespace App\Support;

use Illuminate\Validation\Validator;

class QuestionPayload
{
    public static function createRules(): array
    {
        return [
            'question_text' => 'required|string',
            'type' => 'required|in:multiple_choice,short_answer,code_snippet,essay',
            'difficulty' => 'required|in:easy,medium,hard',
            'topic' => 'required|string|max:100',
            'options' => 'nullable|array',
            'options.*.id' => 'required_with:options|string',
            'options.*.text' => 'required_with:options|string',
            'options.*.isCorrect' => 'required_with:options|boolean',
            'correct_answer' => 'nullable|string',
            'time_limit_seconds' => 'nullable|integer|min:5|max:300',
            'points' => 'nullable|integer|min:100|max:5000',
        ];
    }

    public static function updateRules(): array
    {
        return [
            'question_text' => 'sometimes|required|string',
            'type' => 'sometimes|required|in:multiple_choice,short_answer,code_snippet,essay',
            'difficulty' => 'sometimes|required|in:easy,medium,hard',
            'topic' => 'sometimes|required|string|max:100',
            'options' => 'nullable|array',
            'options.*.id' => 'required_with:options|string',
            'options.*.text' => 'required_with:options|string',
            'options.*.isCorrect' => 'required_with:options|boolean',
            'correct_answer' => 'nullable|string',
            'time_limit_seconds' => 'nullable|integer|min:5|max:300',
            'points' => 'nullable|integer|min:100|max:5000',
        ];
    }

    public static function applyConditionalRules(Validator $validator, bool $partial = false): void
    {
        $validator->after(function (Validator $validator) use ($partial) {
            $data = $validator->getData();
            $type = $data['type'] ?? null;
            $hasOptions = array_key_exists('options', $data);
            if (!$partial || $type !== null) {
                if ($type === 'multiple_choice') {
                    $options = $data['options'] ?? null;

                    if (!is_array($options) || count($options) < 2) {
                        $validator->errors()->add('options', 'Multiple choice questions must include at least two options.');
                    } else {
                        $correctCount = collect($options)
                            ->filter(fn ($option) => (bool) ($option['isCorrect'] ?? false))
                            ->count();

                        if ($correctCount < 1) {
                            $validator->errors()->add('options', 'Multiple choice questions must include at least one correct option.');
                        }
                    }
                }

                if ($type === 'short_answer' && blank($data['correct_answer'] ?? null)) {
                    $validator->errors()->add('correct_answer', 'Short answer questions require a correct answer.');
                }

                if (in_array($type, ['short_answer', 'code_snippet', 'essay'], true) && $hasOptions && !empty($data['options'])) {
                    $validator->errors()->add('options', 'Only multiple choice questions may include options.');
                }
            }
        });
    }
}
