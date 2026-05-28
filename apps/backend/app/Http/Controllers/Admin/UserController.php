<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(private UserService $userService) {}

    /**
     * List all users with optional filters.
     */
    public function index(Request $request): JsonResponse
    {
        $users = $this->userService->list(
            $request->only(['search', 'role', 'is_active']),
            $request->integer('per_page', 20)
        );

        return response()->json($users);
    }

    /**
     * Create a new user.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->userService->create($request->validated());

        return response()->json(new UserResource($user), 201);
    }

    /**
     * Show a specific user.
     */
    public function show(User $user): JsonResponse
    {
        return response()->json(new UserResource($user));
    }

    /**
     * Update a user.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user = $this->userService->update($user, $request->validated());

        return response()->json(new UserResource($user));
    }

    /**
     * Delete a user.
     */
    public function destroy(User $user): JsonResponse
    {
        $this->userService->delete($user);

        return response()->json(['message' => 'User deleted']);
    }

    /**
     * Toggle user active/inactive status.
     */
    public function toggleActive(User $user): JsonResponse
    {
        $user = $this->userService->toggleActive($user);

        return response()->json(new UserResource($user));
    }

    /**
     * Bulk create users from array.
     */
    public function bulkCreate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'users' => 'required|array|min:1',
            'users.*.name' => 'required|string|max:100',
            'users.*.email' => 'required|email|distinct|unique:users,email',
            'users.*.password' => 'nullable|string|min:6',
            'users.*.role' => 'nullable|in:admin,host,participant',
            'users.*.institution' => 'nullable|string|max:200',
        ]);

        $count = $this->userService->bulkCreate($data['users']);

        return response()->json([
            'message' => "{$count} users created successfully",
            'count' => $count,
        ], 201);
    }

    /**
     * Get user statistics.
     */
    public function stats(): JsonResponse
    {
        return response()->json($this->userService->getStats());
    }
}
