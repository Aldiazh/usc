<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('question_text');
            $table->enum('type', ['multiple_choice', 'short_answer', 'code_snippet', 'essay'])->default('multiple_choice');
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('medium');
            $table->string('topic')->default('General');
            $table->json('options')->nullable(); // [{id, text, isCorrect}]
            $table->string('correct_answer')->nullable(); // for short_answer type
            $table->integer('time_limit_seconds')->default(30);
            $table->integer('points')->default(1000);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
