<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ServeFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Only allow in local/testing environments per controller intention
        $env = config('app.env', env('APP_ENV'));
        return in_array($env, ['local', 'testing'], true);
    }

    public function rules(): array
    {
        return [
            'path' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'path.required' => 'Missing path',
        ];
    }
}
