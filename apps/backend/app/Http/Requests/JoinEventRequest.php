<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class JoinEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'pin' => 'required|string|size:6',
            'nickname' => 'required|string|max:50',
            'team_name' => 'nullable|string|max:100',
            'institution' => 'required|string|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'pin.size' => 'Game PIN must be exactly 6 characters.',
            'nickname.required' => 'Please enter your nickname.',
            'institution.required' => 'Please enter your school or institution.',
        ];
    }
}
