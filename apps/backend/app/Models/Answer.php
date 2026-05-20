<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Answer extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'participant_id',
        'event_question_id',
        'selected_option_id',
        'text_answer',
        'is_correct',
        'points_earned',
        'time_taken_ms',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'points_earned' => 'integer',
        'time_taken_ms' => 'integer',
    ];

    public function participant(): BelongsTo
    {
        return $this->belongsTo(Participant::class);
    }

    public function eventQuestion(): BelongsTo
    {
        return $this->belongsTo(EventQuestion::class);
    }
}
