<?php

namespace App\Services;

use App\Models\Question;
use App\Support\QuestionPayload;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class QuestionService
{
    public function list(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Question::query();

        if (!empty($filters['search'])) {
            $query->where('question_text', 'ILIKE', "%{$filters['search']}%");
        }
        if (!empty($filters['topic'])) {
            $query->where('topic', $filters['topic']);
        }
        if (!empty($filters['difficulty'])) {
            $query->where('difficulty', $filters['difficulty']);
        }
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function create(array $data): Question
    {
        $data['user_id'] = Auth::id();

        return Question::create($data);
    }

    public function update(Question $question, array $data): Question
    {
        $question->update($data);

        return $question->fresh();
    }

    public function delete(Question $question): void
    {
        $question->delete();
    }

    /**
     * Bulk import questions from parsed JSON/CSV data.
     * Expects an array of question arrays.
     */
    public function importBulk(array $questionsData): int
    {
        $userId = Auth::id();
        $validatedPayloads = [];

        foreach ($questionsData as $index => $questionData) {
            $payload = $this->normalizeImportedQuestionPayload($questionData);
            $validator = Validator::make($payload, QuestionPayload::createRules());

            QuestionPayload::applyConditionalRules($validator);

            if ($validator->fails()) {
                throw ValidationException::withMessages([
                    "questions.{$index}" => $validator->errors()->all(),
                ]);
            }

            $validatedPayloads[] = array_merge($validator->validated(), [
                'user_id' => $userId,
            ]);
        }

        DB::transaction(function () use ($validatedPayloads) {
            foreach ($validatedPayloads as $payload) {
                Question::create($payload);
            }
        });

        return count($validatedPayloads);
    }

    public function getStats(): array
    {
        return [
            'total' => Question::count(),
            'by_difficulty' => [
                'easy' => Question::where('difficulty', 'easy')->count(),
                'medium' => Question::where('difficulty', 'medium')->count(),
                'hard' => Question::where('difficulty', 'hard')->count(),
            ],
            'by_type' => [
                'multiple_choice' => Question::where('type', 'multiple_choice')->count(),
                'short_answer' => Question::where('type', 'short_answer')->count(),
                'code_snippet' => Question::where('type', 'code_snippet')->count(),
                'essay' => Question::where('type', 'essay')->count(),
            ],
            'topics' => Question::select('topic')
                ->selectRaw('count(*) as count')
                ->groupBy('topic')
                ->pluck('count', 'topic'),
        ];
    }

    private function normalizeImportedQuestionPayload(array $payload): array
    {
        if (isset($payload['options']) && is_array($payload['options'])) {
            $payload['options'] = array_values(array_map(function (array $option) {
                return [
                    'id' => (string) ($option['id'] ?? ''),
                    'text' => trim((string) ($option['text'] ?? '')),
                    'isCorrect' => (bool) ($option['isCorrect'] ?? false),
                ];
            }, $payload['options']));
        }

        $payload['question_text'] = trim((string) ($payload['question_text'] ?? ''));
        $payload['type'] = $payload['type'] ?? 'multiple_choice';
        $payload['difficulty'] = $payload['difficulty'] ?? 'medium';
        $payload['topic'] = trim((string) ($payload['topic'] ?? 'General'));
        $payload['correct_answer'] = isset($payload['correct_answer']) ? trim((string) $payload['correct_answer']) : null;
        $payload['time_limit_seconds'] = isset($payload['time_limit_seconds']) ? (int) $payload['time_limit_seconds'] : 30;
        $payload['points'] = isset($payload['points']) ? (int) $payload['points'] : 1000;

        return $payload;
    }
}
