<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class AuthSystemService
{
    protected string $baseUrl;

    public function __construct()
    {
        $url = config('services.auth_system.url', 'http://auth-system.local/api');
        $this->baseUrl = is_string($url) ? $url : 'http://auth-system.local/api';
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getMessages(string $token): ?array
    {
        $response = Http::withToken($token)->get($this->baseUrl.'/messages');
        if ($response instanceof \Illuminate\Http\Client\Response && $response->successful()) {
            $data = $response->json();
            if (is_array($data)) {
                return $data;
            }
        }

        return null;
    }

    public function markMessageRead(string $token, int $id): bool
    {
        $response = Http::withToken($token)->patch($this->baseUrl.'/messages/'.$id.'/read');

        return $response instanceof \Illuminate\Http\Client\Response && $response->successful();
    }

    public function markAllMessagesRead(string $token): bool
    {
        $response = Http::withToken($token)->patch($this->baseUrl.'/messages/read-all');

        return $response instanceof \Illuminate\Http\Client\Response && $response->successful();
    }
}
