<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Participant extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'event_id',
        'user_id',
        'nickname',
        'institution',
        'status',
        'role',
        'total_score',
        'current_rank',
        'is_online',
        'socket_id',
        'joined_at',
    ];

    protected $casts = [
        'total_score' => 'integer',
        'current_rank' => 'integer',
        'is_online' => 'boolean',
        'joined_at' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }

    public function isEliminated(): bool
    {
        return $this->status === 'eliminated';
    }
}
