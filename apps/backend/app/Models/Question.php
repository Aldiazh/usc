<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Question extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'question_text',
        'type',
        'difficulty',
        'topic',
        'options',
        'correct_answer',
        'time_limit_seconds',
        'points',
    ];

    protected $casts = [
        'options' => 'array',
        'time_limit_seconds' => 'integer',
        'points' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function events(): BelongsToMany
    {
        return $this->belongsToMany(Event::class, 'event_questions')
            ->withPivot(['sort_order', 'phase'])
            ->orderByPivot('sort_order');
    }
}
