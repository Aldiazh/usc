<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserService
{
    /**
     * List users with optional filters and pagination.
     */
    public function list(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = User::query();

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('username', 'ILIKE', "%{$search}%")
                  ->orWhere('email', 'ILIKE', "%{$search}%")
                  ->orWhere('institution', 'ILIKE', "%{$search}%");
            });
        }

        if (!empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Create a new user.
     */
    public function create(array $data): User
    {
        // Auto-generate email from username if not provided
        $email = $data['email'] ?? null;
        if (empty($email)) {
            $username = $data['username'] ?? strtolower(str_replace(' ', '.', $data['name']));
            $email = $username . '@info-clash.local';
        }

        return User::create([
            'name' => $data['name'],
            'username' => $data['username'] ?? null,
            'email' => $email,
            'password' => $data['password'], // auto-hashed by model cast
            'role' => $data['role'] ?? 'participant',
            'institution' => $data['institution'] ?? null,
            'team_name' => $data['team_name'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    /**
     * Update a user.
     */
    public function update(User $user, array $data): User
    {
        $updateData = collect($data)->only([
            'name', 'username', 'email', 'role', 'institution', 'team_name', 'is_active',
        ])->toArray();

        // Only update password if provided
        if (!empty($data['password'])) {
            $updateData['password'] = $data['password'];
        }

        $user->update($updateData);

        return $user->fresh();
    }

    /**
     * Delete a user.
     */
    public function delete(User $user): void
    {
        $user->delete();
    }

    /**
     * Toggle user active status.
     */
    public function toggleActive(User $user): User
    {
        $user->update(['is_active' => !$user->is_active]);
        return $user->fresh();
    }

    /**
     * Bulk create users.
     */
    public function bulkCreate(array $usersData): int
    {
        $count = 0;

        DB::transaction(function () use ($usersData, &$count) {
            foreach ($usersData as $userData) {
                User::create([
                    'name' => $userData['name'],
                    'username' => $userData['username'] ?? null,
                    'email' => $userData['email'],
                    'password' => $userData['password'] ?? 'password123',
                    'role' => $userData['role'] ?? 'participant',
                    'institution' => $userData['institution'] ?? null,
                    'team_name' => $userData['team_name'] ?? null,
                    'is_active' => $userData['is_active'] ?? true,
                ]);
                $count++;
            }
        });

        return $count;
    }

    /**
     * Get user statistics.
     */
    public function getStats(): array
    {
        return [
            'total' => User::count(),
            'by_role' => [
                'admin' => User::where('role', 'admin')->count(),
                'host' => User::where('role', 'host')->count(),
                'participant' => User::where('role', 'participant')->count(),
            ],
            'active' => User::where('is_active', true)->count(),
            'inactive' => User::where('is_active', false)->count(),
        ];
    }
}
