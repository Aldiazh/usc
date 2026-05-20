<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImportQuestionsRequest;
use App\Http\Requests\StoreQuestionRequest;
use App\Http\Requests\UpdateQuestionRequest;
use App\Http\Resources\QuestionResource;
use App\Models\Question;
use App\Services\QuestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    public function __construct(private QuestionService $questionService) {}

    public function index(Request $request): JsonResponse
    {
        $questions = $this->questionService->list(
            $request->only(['search', 'topic', 'difficulty', 'type']),
            $request->integer('per_page', 20)
        );

        return response()->json($questions);
    }

    public function store(StoreQuestionRequest $request): JsonResponse
    {
        $question = $this->questionService->create($request->validated());

        return response()->json(new QuestionResource($question), 201);
    }

    public function update(UpdateQuestionRequest $request, Question $question): JsonResponse
    {
        $question = $this->questionService->update($question, $request->validated());

        return response()->json(new QuestionResource($question));
    }

    public function destroy(Question $question): JsonResponse
    {
        $this->questionService->delete($question);

        return response()->json(['message' => 'Question deleted']);
    }

    public function import(ImportQuestionsRequest $request): JsonResponse
    {
        $file = $request->file('file');
        $content = file_get_contents($file->getRealPath());
        $extension = $file->getClientOriginalExtension();

        $questionsData = [];

        if ($extension === 'json') {
            $parsed = json_decode($content, true);
            if (!$parsed) {
                return response()->json(['message' => 'Invalid JSON file'], 422);
            }
            $questionsData = isset($parsed['questions']) ? $parsed['questions'] : $parsed;
        } elseif ($extension === 'csv' || $extension === 'txt') {
            $lines = array_filter(explode("\n", $content));
            $headers = str_getcsv(array_shift($lines));

            foreach ($lines as $line) {
                $values = str_getcsv($line);
                if (count($values) === count($headers)) {
                    $row = array_combine($headers, $values);
                    // Parse options from CSV format: "A|B|C|D" and correct: "A"
                    if (isset($row['options'])) {
                        $optTexts = explode('|', $row['options']);
                        $correct = $row['correct_answer'] ?? '';
                        $row['options'] = array_map(fn($text, $i) => [
                            'id' => chr(65 + $i), // A, B, C, D
                            'text' => trim($text),
                            'isCorrect' => trim($text) === trim($correct) || chr(65 + $i) === trim($correct),
                        ], $optTexts, array_keys($optTexts));
                    }
                    $questionsData[] = $row;
                }
            }
        }

        if (empty($questionsData)) {
            return response()->json(['message' => 'No valid questions found in file'], 422);
        }

        $count = $this->questionService->importBulk($questionsData);

        return response()->json([
            'message' => "{$count} questions imported successfully",
            'count' => $count,
        ]);
    }

    public function stats(): JsonResponse
    {
        return response()->json($this->questionService->getStats());
    }
}
