<?php

namespace Tests\Feature;

use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class NoteleksGameTest extends TestCase
{
    // ── Redirect stubs (auth routes should all redirect away) ─────────────────

    #[DataProvider('authRedirectProvider')]
    public function test_auth_routes_redirect(string $path): void
    {
        $response = $this->get($path);

        $response->assertRedirect('/');
    }

    public static function authRedirectProvider(): array
    {
        return [
            'login' => ['/login'],
            'register' => ['/register'],
        ];
    }
}
