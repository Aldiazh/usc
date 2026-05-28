<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

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

        $user = User::create([
            'name' => $data['name'],
            'username' => $data['username'] ?? null,
            'email' => $email,
            'password' => $data['password'], // auto-hashed by model cast
            'role' => $data['role'] ?? 'participant',
            'institution' => $data['institution'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        Cache::forget('user_stats');

        return $user;
    }

    /**
     * Update a user.
     */
    public function update(User $user, array $data): User
    {
        $updateData = collect($data)->only([
            'name', 'username', 'email', 'role', 'institution', 'is_active',
        ])->toArray();

        // Only update password if provided
        if (!empty($data['password'])) {
            $updateData['password'] = $data['password'];
        }

        $user->update($updateData);

        Cache::forget('user_stats');

        return $user->fresh();
    }

    /**
     * Delete a user.
     */
    public function delete(User $user): void
    {
        $user->delete();
        Cache::forget('user_stats');
    }

    /**
     * Toggle user active status.
     */
    public function toggleActive(User $user): User
    {
        $user->update(['is_active' => !$user->is_active]);
        Cache::forget('user_stats');
        return $user->fresh();
    }

    /**
     * Bulk create users.
     */
    public function bulkCreate(array $usersData): int
    {
        $now = now();

        DB::transaction(function () use ($usersData, $now) {
            $records = array_map(function ($userData) use ($now) {
                $username = $userData['username'] ?? strtolower(str_replace(' ', '.', $userData['name']));
                $email = $userData['email'] ?? $username . '@info-clash.local';

                return [
                    'id' => (string) Str::uuid(),
                    'name' => $userData['name'],
                    'username' => $userData['username'] ?? null,
                    'email' => $email,
                    'password' => Hash::make($userData['password'] ?? 'password123'),
                    'role' => $userData['role'] ?? 'participant',
                    'institution' => $userData['institution'] ?? null,
                    'is_active' => $userData['is_active'] ?? true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }, $usersData);

            // Insert in chunks of 100 to avoid query size limits
            foreach (array_chunk($records, 100) as $chunk) {
                User::insert($chunk);
            }
        });

        Cache::forget('user_stats');

        return count($usersData);
    }

    /**
     * Get user statistics.
     */
    public function getStats(): array
    {
        return Cache::remember('user_stats', 300, function () {
            $stats = User::query()
                ->selectRaw('COUNT(*) as total')
                ->selectRaw("COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count")
                ->selectRaw("COUNT(CASE WHEN role = 'host' THEN 1 END) as host_count")
                ->selectRaw("COUNT(CASE WHEN role = 'participant' THEN 1 END) as participant_count")
                ->selectRaw('COUNT(CASE WHEN is_active THEN 1 END) as active_count')
                ->selectRaw('COUNT(CASE WHEN NOT is_active THEN 1 END) as inactive_count')
                ->first();

            return [
                'total' => (int) $stats->total,
                'by_role' => [
                    'admin' => (int) $stats->admin_count,
                    'host' => (int) $stats->host_count,
                    'participant' => (int) $stats->participant_count,
                ],
                'active' => (int) $stats->active_count,
                'inactive' => (int) $stats->inactive_count,
            ];
        });
    }
}
