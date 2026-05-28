<?php

namespace App\Services;

use App\Models\Question;
use App\Support\QuestionPayload;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Cache;

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

        $question = Question::create($data);

        Cache::forget('question_stats');
        Cache::forget('dashboard_stats');

        return $question;
    }

    public function update(Question $question, array $data): Question
    {
        $question->update($data);

        Cache::forget('question_stats');

        return $question->fresh();
    }

    public function delete(Question $question): void
    {
        $question->delete();
        Cache::forget('question_stats');
        Cache::forget('dashboard_stats');
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

        $now = now();

        DB::transaction(function () use ($validatedPayloads, $now) {
            $records = array_map(function ($payload) use ($now) {
                // Encode options array to JSON for batch insert
                if (isset($payload['options']) && is_array($payload['options'])) {
                    $payload['options'] = json_encode($payload['options']);
                }
                $payload['id'] = (string) Str::uuid();
                $payload['created_at'] = $now;
                $payload['updated_at'] = $now;
                return $payload;
            }, $validatedPayloads);

            // Insert in chunks of 100 to avoid query size limits
            foreach (array_chunk($records, 100) as $chunk) {
                Question::insert($chunk);
            }
        });

        Cache::forget('question_stats');
        Cache::forget('dashboard_stats');

        return count($validatedPayloads);
    }

    public function getStats(): array
    {
        return Cache::remember('question_stats', 300, function () {
            $stats = Question::query()
                ->selectRaw('COUNT(*) as total')
                ->selectRaw("COUNT(CASE WHEN difficulty = 'easy' THEN 1 END) as easy")
                ->selectRaw("COUNT(CASE WHEN difficulty = 'medium' THEN 1 END) as medium")
                ->selectRaw("COUNT(CASE WHEN difficulty = 'hard' THEN 1 END) as hard")
                ->selectRaw("COUNT(CASE WHEN type = 'multiple_choice' THEN 1 END) as multiple_choice")
                ->selectRaw("COUNT(CASE WHEN type = 'short_answer' THEN 1 END) as short_answer")
                ->selectRaw("COUNT(CASE WHEN type = 'code_snippet' THEN 1 END) as code_snippet")
                ->selectRaw("COUNT(CASE WHEN type = 'essay' THEN 1 END) as essay")
                ->first();

            return [
                'total' => (int) $stats->total,
                'by_difficulty' => [
                    'easy' => (int) $stats->easy,
                    'medium' => (int) $stats->medium,
                    'hard' => (int) $stats->hard,
                ],
                'by_type' => [
                    'multiple_choice' => (int) $stats->multiple_choice,
                    'short_answer' => (int) $stats->short_answer,
                    'code_snippet' => (int) $stats->code_snippet,
                    'essay' => (int) $stats->essay,
                ],
                'topics' => Question::select('topic')
                    ->selectRaw('count(*) as count')
                    ->groupBy('topic')
                    ->pluck('count', 'topic'),
            ];
        });
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
