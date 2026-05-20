<?php

namespace Database\Seeders;

use App\Models\Question;
use App\Models\User;
use Illuminate\Database\Seeder;

class QuestionSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@info-clash.com')->first();
        if (!$admin) return;

        $questions = [
            [
                'question_text' => 'Which data structure uses LIFO (Last In, First Out) principle?',
                'type' => 'multiple_choice',
                'difficulty' => 'easy',
                'topic' => 'Data Structures',
                'options' => [
                    ['id' => 'A', 'text' => 'Queue', 'isCorrect' => false],
                    ['id' => 'B', 'text' => 'Stack', 'isCorrect' => true],
                    ['id' => 'C', 'text' => 'Tree', 'isCorrect' => false],
                    ['id' => 'D', 'text' => 'Graph', 'isCorrect' => false],
                ],
                'time_limit_seconds' => 30,
                'points' => 1000,
            ],
            [
                'question_text' => 'What is the time complexity of binary search?',
                'type' => 'multiple_choice',
                'difficulty' => 'medium',
                'topic' => 'Algorithms',
                'options' => [
                    ['id' => 'A', 'text' => 'O(n)', 'isCorrect' => false],
                    ['id' => 'B', 'text' => 'O(log n)', 'isCorrect' => true],
                    ['id' => 'C', 'text' => 'O(n²)', 'isCorrect' => false],
                    ['id' => 'D', 'text' => 'O(1)', 'isCorrect' => false],
                ],
                'time_limit_seconds' => 30,
                'points' => 1000,
            ],
            [
                'question_text' => 'Evaluate: (TRUE AND FALSE) OR (NOT FALSE)',
                'type' => 'short_answer',
                'difficulty' => 'easy',
                'topic' => 'Logic',
                'correct_answer' => 'TRUE',
                'time_limit_seconds' => 20,
                'points' => 800,
            ],
            [
                'question_text' => 'Which sorting algorithm has the best average-case time complexity?',
                'type' => 'multiple_choice',
                'difficulty' => 'hard',
                'topic' => 'Algorithms',
                'options' => [
                    ['id' => 'A', 'text' => 'Bubble Sort', 'isCorrect' => false],
                    ['id' => 'B', 'text' => 'Merge Sort', 'isCorrect' => true],
                    ['id' => 'C', 'text' => 'Selection Sort', 'isCorrect' => false],
                    ['id' => 'D', 'text' => 'Insertion Sort', 'isCorrect' => false],
                ],
                'time_limit_seconds' => 25,
                'points' => 1200,
            ],
            [
                'question_text' => 'What keyword is used to inherit a class in Java?',
                'type' => 'short_answer',
                'difficulty' => 'easy',
                'topic' => 'OOP',
                'correct_answer' => 'extends',
                'time_limit_seconds' => 15,
                'points' => 800,
            ],
        ];

        foreach ($questions as $q) {
            Question::updateOrCreate(
                ['question_text' => $q['question_text']],
                array_merge($q, ['user_id' => $admin->id])
            );
        }
    }
}
