<?php

namespace Tests\Feature;

use App\Events\GameEnded;
use App\Events\LobbyUpdated;
use App\Events\QuestionEnded;
use App\Events\QuestionStarted;
use App\Models\Event as GameEvent;
use App\Models\EventQuestion;
use App\Models\Participant;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GameplayApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_participant_join_broadcasts_lobby_update_and_respects_capacity(): void
    {
        Event::fake([LobbyUpdated::class]);

        $event = $this->createEvent(status: 'lobby', maxParticipants: 1);
        $alpha = $this->createParticipantUser(['name' => 'Alpha', 'institution' => 'USC']);
        $beta = $this->createParticipantUser(['name' => 'Beta', 'institution' => 'USC']);

        Sanctum::actingAs($alpha);

        $joinResponse = $this->postJson('/api/participant/join', [
            'pin' => $event->pin,
        ]);

        $joinResponse
            ->assertCreated()
            ->assertJsonPath('participant.nickname', 'Alpha')
            ->assertJsonPath('participant.event.id', $event->id);

        Event::assertDispatched(LobbyUpdated::class);

        Sanctum::actingAs($beta);

        $this->postJson('/api/participant/join', [
            'pin' => $event->pin,
        ])->assertStatus(422)
            ->assertJsonPath('errors.pin.0', 'Event is full. Maximum participants reached.');
    }

    public function test_participant_can_only_answer_the_current_question_once(): void
    {
        $event = $this->createEvent(status: 'live');
        $currentQuestion = $this->attachQuestionToEvent($event, 0);
        $futureQuestion = $this->attachQuestionToEvent($event, 1);
        $participant = $this->createParticipant($event);
        Sanctum::actingAs($this->createParticipantUser());

        $firstAnswer = $this->postJson("/api/participant/{$participant->id}/answer", [
            'event_question_id' => $currentQuestion->id,
            'selected_option_id' => 'A',
            'time_taken_ms' => 1000,
        ]);

        $firstAnswer
            ->assertOk()
            ->assertJsonPath('is_correct', true);

        $this->assertDatabaseCount('answers', 1);

        $duplicateAnswer = $this->postJson("/api/participant/{$participant->id}/answer", [
            'event_question_id' => $currentQuestion->id,
            'selected_option_id' => 'A',
            'time_taken_ms' => 900,
        ]);

        $duplicateAnswer
            ->assertOk()
            ->assertJsonPath('is_correct', true);

        $this->assertDatabaseCount('answers', 1);

        $this->postJson("/api/participant/{$participant->id}/answer", [
            'event_question_id' => $futureQuestion->id,
            'selected_option_id' => 'A',
            'time_taken_ms' => 1000,
        ])->assertStatus(422)
            ->assertJsonPath('errors.event_question_id.0', 'Answers are only accepted for the current live question.');
    }

    public function test_admin_can_attach_questions_and_game_actions_dispatch_broadcasts_without_persisting_ranks(): void
    {
        Event::fake([QuestionStarted::class, QuestionEnded::class, GameEnded::class]);

        $admin = $this->createAdmin();
        Sanctum::actingAs($admin);

        $event = $this->createEvent(user: $admin, status: 'draft');
        $question = $this->createQuestion($admin);

        $this->postJson("/api/admin/events/{$event->id}/questions", [
            'question_ids' => [$question->id],
            'phase' => 1,
        ])->assertOk();

        $this->assertDatabaseHas('event_questions', [
            'event_id' => $event->id,
            'question_id' => $question->id,
            'sort_order' => 0,
        ]);

        $leader = $this->createParticipant($event, ['nickname' => 'Leader', 'total_score' => 1200]);
        $runnerUp = $this->createParticipant($event, ['nickname' => 'Runner Up', 'total_score' => 600]);

        $this->postJson("/api/admin/events/{$event->id}/start")
            ->assertOk()
            ->assertJsonPath('message', 'Game started');

        Event::assertDispatched(QuestionStarted::class);

        $this->postJson("/api/admin/events/{$event->id}/end-question")
            ->assertOk()
            ->assertJsonPath('message', 'Question ended');

        Event::assertDispatched(QuestionEnded::class);

        $rankingResponse = $this->getJson("/api/admin/events/{$event->id}/ranking");

        $rankingResponse
            ->assertOk()
            ->assertJsonFragment(['id' => $leader->id, 'current_rank' => 1])
            ->assertJsonFragment(['id' => $runnerUp->id, 'current_rank' => 2]);

        $this->assertNull($leader->fresh()->current_rank);
        $this->assertNull($runnerUp->fresh()->current_rank);

        $this->postJson("/api/admin/events/{$event->id}/end")
            ->assertOk()
            ->assertJsonPath('message', 'Game ended');

        Event::assertDispatched(GameEnded::class);
    }

    public function test_admin_participants_and_ranking_support_legacy_and_paginated_responses(): void
    {
        $admin = $this->createAdmin();
        Sanctum::actingAs($admin);

        $event = $this->createEvent(user: $admin, status: 'lobby');
        $leader = $this->createParticipant($event, ['nickname' => 'Leader', 'total_score' => 1200]);
        $runnerUp = $this->createParticipant($event, ['nickname' => 'Runner Up', 'total_score' => 600]);
        $third = $this->createParticipant($event, ['nickname' => 'Third', 'total_score' => 100]);

        $legacyParticipants = $this->getJson("/api/admin/events/{$event->id}/participants")
            ->assertOk()
            ->json();

        $this->assertCount(3, $legacyParticipants);
        $this->assertSame($leader->id, $legacyParticipants[0]['id']);

        $paginatedParticipants = $this->getJson("/api/admin/events/{$event->id}/participants?paginated=1&per_page=1")
            ->assertOk()
            ->assertJsonPath('current_page', 1)
            ->assertJsonPath('last_page', 3)
            ->assertJsonPath('total', 3)
            ->json();

        $this->assertCount(1, $paginatedParticipants['data']);
        $this->assertSame($leader->id, $paginatedParticipants['data'][0]['id']);

        $legacyRanking = $this->getJson("/api/admin/events/{$event->id}/ranking")
            ->assertOk()
            ->json();

        $this->assertCount(3, $legacyRanking);
        $this->assertSame($leader->id, $legacyRanking[0]['id']);
        $this->assertSame(1, $legacyRanking[0]['current_rank']);
        $this->assertSame(2, $legacyRanking[1]['current_rank']);

        $paginatedRanking = $this->getJson("/api/admin/events/{$event->id}/ranking?paginated=1&per_page=2&page=2")
            ->assertOk()
            ->assertJsonPath('current_page', 2)
            ->assertJsonPath('last_page', 2)
            ->assertJsonPath('total', 3)
            ->json();

        $this->assertCount(1, $paginatedRanking['data']);
        $this->assertSame($third->id, $paginatedRanking['data'][0]['id']);
        $this->assertSame(3, $paginatedRanking['data'][0]['current_rank']);

        $this->assertNull($runnerUp->fresh()->current_rank);
        $this->assertNull($third->fresh()->current_rank);
    }

    private function createAdmin(): User
    {
        return User::factory()->create([
            'role' => 'admin',
        ]);
    }

    private function createParticipantUser(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'name' => 'Participant User',
            'username' => 'participant_' . str()->random(8),
            'role' => 'participant',
            'institution' => 'University A',
            'is_active' => true,
        ], $overrides));
    }

    private function createEvent(?User $user = null, string $status = 'lobby', int $maxParticipants = 100): GameEvent
    {
        $user ??= $this->createAdmin();

        return GameEvent::create([
            'user_id' => $user->id,
            'title' => 'Qualifier',
            'description' => 'Test event',
            'pin' => str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT),
            'status' => $status,
            'settings' => [],
            'max_participants' => $maxParticipants,
            'current_question_index' => 0,
            'started_at' => $status === 'live' ? now() : null,
        ]);
    }

    private function createQuestion(?User $user = null): Question
    {
        $user ??= $this->createAdmin();

        return Question::create([
            'user_id' => $user->id,
            'question_text' => 'What is 2 + 2?',
            'type' => 'multiple_choice',
            'difficulty' => 'easy',
            'topic' => 'Math',
            'options' => [
                ['id' => 'A', 'text' => '4', 'isCorrect' => true],
                ['id' => 'B', 'text' => '5', 'isCorrect' => false],
            ],
            'correct_answer' => null,
            'time_limit_seconds' => 30,
            'points' => 1000,
        ]);
    }

    private function attachQuestionToEvent(GameEvent $event, int $sortOrder): EventQuestion
    {
        $question = $this->createQuestion($event->user);

        return EventQuestion::create([
            'event_id' => $event->id,
            'question_id' => $question->id,
            'sort_order' => $sortOrder,
            'phase' => 1,
        ]);
    }

    private function createParticipant(GameEvent $event, array $overrides = []): Participant
    {
        return Participant::create(array_merge([
            'event_id' => $event->id,
            'nickname' => 'John Doe',
            'institution' => 'University A',
            'status' => 'waiting',
            'role' => 'player',
            'total_score' => 0,
            'joined_at' => now(),
        ], $overrides));
    }
}
