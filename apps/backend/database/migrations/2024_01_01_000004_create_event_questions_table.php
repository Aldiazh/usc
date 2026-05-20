<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('question_id')->constrained()->onDelete('cascade');
            $table->integer('sort_order')->default(0);
            $table->integer('phase')->default(1); // 1, 2, or 3
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['event_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_questions');
    }
};
