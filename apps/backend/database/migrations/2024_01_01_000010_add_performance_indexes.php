<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Participants ──
        Schema::table('participants', function (Blueprint $table) {
            $table->index(['event_id', 'status'], 'idx_participants_event_status');
            $table->index(['event_id', 'role'], 'idx_participants_event_role');
            $table->index(['event_id', 'total_score'], 'idx_participants_event_score');
            $table->index(['user_id', 'status'], 'idx_participants_user_status');
            $table->index('is_online', 'idx_participants_online');
        });

        // ── Answers ──
        Schema::table('answers', function (Blueprint $table) {
            $table->index('event_question_id', 'idx_answers_event_question');
        });

        // ── Events ──
        Schema::table('events', function (Blueprint $table) {
            $table->index(['pin', 'status'], 'idx_events_pin_status');
            $table->index('status', 'idx_events_status');
        });

        // ── Questions ──
        Schema::table('questions', function (Blueprint $table) {
            $table->index('topic', 'idx_questions_topic');
            $table->index('difficulty', 'idx_questions_difficulty');
            $table->index('type', 'idx_questions_type');
        });

        // ── Event Questions ──
        Schema::table('event_questions', function (Blueprint $table) {
            $table->index(['event_id', 'sort_order'], 'idx_event_questions_event_sort');
        });

        // ── Users ──
        Schema::table('users', function (Blueprint $table) {
            $table->index('role', 'idx_users_role');
            $table->index('is_active', 'idx_users_active');
        });
    }

    public function down(): void
    {
        Schema::table('participants', function (Blueprint $table) {
            $table->dropIndex('idx_participants_event_status');
            $table->dropIndex('idx_participants_event_role');
            $table->dropIndex('idx_participants_event_score');
            $table->dropIndex('idx_participants_user_status');
            $table->dropIndex('idx_participants_online');
        });

        Schema::table('answers', function (Blueprint $table) {
            $table->dropIndex('idx_answers_event_question');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex('idx_events_pin_status');
            $table->dropIndex('idx_events_status');
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->dropIndex('idx_questions_topic');
            $table->dropIndex('idx_questions_difficulty');
            $table->dropIndex('idx_questions_type');
        });

        Schema::table('event_questions', function (Blueprint $table) {
            $table->dropIndex('idx_event_questions_event_sort');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_role');
            $table->dropIndex('idx_users_active');
        });
    }
};
