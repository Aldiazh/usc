<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EliminatePlayersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'survival_count' => 'required|integer|min:1',
        ];
    }
}
