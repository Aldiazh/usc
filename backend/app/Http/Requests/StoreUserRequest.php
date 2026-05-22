<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:100',
            'username' => 'nullable|string|max:50|unique:users,username|alpha_dash',
            'email' => 'nullable|email|unique:users,email',
            'password' => 'required|string|min:6|max:100',
            'role' => 'required|in:admin,host,participant',
            'institution' => 'nullable|string|max:200',
            'team_name' => 'nullable|string|max:100',
            'is_active' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Name is required.',
            'email.required' => 'Email is required.',
            'email.unique' => 'This email is already registered.',
            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 6 characters.',
            'role.required' => 'Role is required.',
            'role.in' => 'Role must be admin, host, or participant.',
        ];
    }
}
