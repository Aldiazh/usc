<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'pin',
        'status',
        'settings',
        'max_participants',
        'current_question_index',
        'scheduled_at',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'settings' => 'array',
        'max_participants' => 'integer',
        'current_question_index' => 'integer',
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function questions(): BelongsToMany
    {
        return $this->belongsToMany(Question::class, 'event_questions')
            ->withPivot(['id', 'sort_order', 'phase'])
            ->orderByPivot('sort_order');
    }

    public function eventQuestions(): HasMany
    {
        return $this->hasMany(EventQuestion::class)->orderBy('sort_order');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(Participant::class);
    }

    public function isLive(): bool
    {
        return $this->status === 'live';
    }

    public function isLobby(): bool
    {
        return $this->status === 'lobby';
    }
}
