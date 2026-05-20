<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('participants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_id')->constrained()->onDelete('cascade');
            $table->string('nickname');
            $table->string('team_name')->nullable();
            $table->string('institution');
            $table->enum('status', ['waiting', 'playing', 'eliminated', 'finished'])->default('waiting');
            $table->enum('role', ['player', 'spectator'])->default('player');
            $table->integer('total_score')->default(0);
            $table->integer('current_rank')->nullable();
            $table->boolean('is_online')->default(false);
            $table->string('socket_id')->nullable();
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('participants');
    }
};
