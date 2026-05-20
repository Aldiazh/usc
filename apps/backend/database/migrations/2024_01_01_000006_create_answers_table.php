<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('answers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('participant_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('event_question_id')->constrained()->onDelete('cascade');
            $table->string('selected_option_id')->nullable();
            $table->text('text_answer')->nullable(); // for short_answer type
            $table->boolean('is_correct')->default(false);
            $table->integer('points_earned')->default(0);
            $table->integer('time_taken_ms')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['participant_id', 'event_question_id']); // one answer per question
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('answers');
    }
};
