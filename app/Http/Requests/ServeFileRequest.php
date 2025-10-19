<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ServeFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Only allow in local/testing environments per controller intention
        return app()->environment(['local', 'testing']);
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
