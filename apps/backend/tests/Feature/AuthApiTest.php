<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login_fetch_profile_and_logout(): void
    {
        $user = User::factory()->create([
            'role' => 'admin',
            'password' => Hash::make('secret-pass'),
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'secret-pass',
        ]);

        $loginResponse
            ->assertOk()
            ->assertJsonPath('user.email', $user->email)
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'email', 'role'],
                'token',
            ]);

        $token = $loginResponse->json('token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('email', $user->email);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logged out successfully');

        // Pre-existing bug fix: flush Sanctum's in-process guard resolver cache.
        // Without this, Sanctum re-uses the already-resolved (and now logged-out) user
        // from memory within the same PHP process, returning 200 instead of 401.
        Auth::forgetGuards();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me')
            ->assertStatus(401);
    }
}
