<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventQuestion;
use App\Models\Question;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoEventSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@info-clash.com')->first();
        if (!$admin) return;

        // Create a demo event with a fixed PIN for easy testing
        $event = Event::updateOrCreate(
            ['pin' => '111111'],
            [
                'user_id' => $admin->id,
                'title' => 'Demo Event — Info Clash',
                'description' => 'A pre-configured demo event for testing the full game flow.',
                'status' => 'lobby',
                'max_participants' => 100,
                'current_question_index' => 0,
            ]
        );

        // Attach all available questions to this event
        $questions = Question::orderBy('created_at')->get();

        foreach ($questions as $index => $question) {
            EventQuestion::updateOrCreate(
                ['event_id' => $event->id, 'question_id' => $question->id],
                ['sort_order' => $index, 'phase' => 1]
            );
        }
    }
}
