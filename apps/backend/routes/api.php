<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\GameController;
use App\Http\Controllers\Admin\QuestionController;
use App\Http\Controllers\Admin\ParticipantAdminController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Participant\ParticipantController;
use App\Http\Controllers\Participant\GamePlayController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| AUTH Routes (Public)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/participant-login', [AuthController::class, 'participantLogin']);
});

/*
|--------------------------------------------------------------------------
| AUTH Routes (Protected)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});

/*
|--------------------------------------------------------------------------
| PARTICIPANT Routes (Protected — Sanctum token for participant)
|--------------------------------------------------------------------------
*/
Route::prefix('participant')->middleware('auth:sanctum')->group(function () {
    Route::post('/join', [ParticipantController::class, 'join']);
    Route::get('/{participant}/status', [ParticipantController::class, 'status']);
    Route::post('/{participant}/answer', [GamePlayController::class, 'answer']);
    Route::get('/{participant}/ranking', [ParticipantController::class, 'ranking']);
    Route::post('/{participant}/heartbeat', [ParticipantController::class, 'heartbeat']);
});

/*
|--------------------------------------------------------------------------
| ADMIN Routes (Protected — Sanctum token)
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->middleware('auth:sanctum')->group(function () {

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Questions
    Route::prefix('questions')->group(function () {
        Route::get('/', [QuestionController::class, 'index']);
        Route::post('/', [QuestionController::class, 'store']);
        Route::put('/{question}', [QuestionController::class, 'update']);
        Route::delete('/{question}', [QuestionController::class, 'destroy']);
        Route::post('/import', [QuestionController::class, 'import']);
        Route::get('/stats', [QuestionController::class, 'stats']);
    });

    // User Management
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/stats', [UserController::class, 'stats']);
        Route::get('/{user}', [UserController::class, 'show']);
        Route::put('/{user}', [UserController::class, 'update']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
        Route::patch('/{user}/toggle-active', [UserController::class, 'toggleActive']);
        Route::post('/bulk', [UserController::class, 'bulkCreate']);
    });

    // Events
    Route::prefix('events')->group(function () {
        Route::get('/', [EventController::class, 'index']);
        Route::post('/', [EventController::class, 'store']);
        Route::get('/{event}', [EventController::class, 'show']);
        Route::put('/{event}', [EventController::class, 'update']);
        Route::delete('/{event}', [EventController::class, 'destroy']);
        Route::post('/{event}/questions', [EventController::class, 'attachQuestions']);
        Route::put('/{event}/status', [EventController::class, 'updateStatus']);

        // Participants within an event (admin-managed)
        Route::get('/{event}/participants', [ParticipantAdminController::class, 'index']);
        Route::delete('/{event}/participants/{participant}', [ParticipantAdminController::class, 'kick']);
        Route::get('/{event}/ranking', [ParticipantAdminController::class, 'ranking']);

        // Game control (live game management)
        Route::post('/{event}/start', [GameController::class, 'start']);
        Route::post('/{event}/next-question', [GameController::class, 'nextQuestion']);
        Route::post('/{event}/end-question', [GameController::class, 'endQuestion']);
        Route::post('/{event}/eliminate', [GameController::class, 'eliminate']);
        Route::post('/{event}/end', [GameController::class, 'endGame']);
        Route::get('/{event}/live-stats', [GameController::class, 'liveStats']);
    });
});
