<?php

namespace Tests\Feature;

use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class NoteleksGameTest extends TestCase
{
    // ── Game page ─────────────────────────────────────────────────────────────

    public function test_noteleks_page_loads_successfully(): void
    {
        $response = $this->withoutVite()->get('/noteleks');

        $response->assertStatus(200);
    }

    public function test_noteleks_page_contains_game_container(): void
    {
        $response = $this->withoutVite()->get('/noteleks');

        $response->assertSee('phaser-game', escape: false);
    }

    public function test_noteleks_page_contains_mobile_controls(): void
    {
        $response = $this->withoutVite()->get('/noteleks');

        $response->assertSee('mobile-controls-area', escape: false);
        $response->assertSee('mobile-left', escape: false);
        $response->assertSee('mobile-right', escape: false);
    }

    public function test_noteleks_page_loads_phaser(): void
    {
        $response = $this->withoutVite()->get('/noteleks');

        $response->assertSee('phaser', false);
    }

    public function test_noteleks_page_has_correct_title(): void
    {
        $response = $this->withoutVite()->get('/noteleks');

        $response->assertSee('Noteleks Heroes Beyond Light');
    }

    // ── Spine asset route ─────────────────────────────────────────────────────

    public function test_spine_asset_route_returns_404_for_missing_file(): void
    {
        $response = $this->get('/games/noteleks/spine/characters/nonexistent.json');

        $response->assertStatus(404);
    }

    public function test_spine_asset_route_rejects_path_traversal(): void
    {
        // Ensure directory traversal attempts are rejected (route constraint `.*`
        // matches the filename, but the file_exists check on the resolved
        // public_path should prevent escaping the intended directory).
        $response = $this->get('/games/noteleks/spine/characters/../../web.php');

        // Either 404 (file not found) or 400/403 are acceptable — never a 200 leak.
        $this->assertNotEquals(200, $response->getStatusCode());
    }

    // ── Named route ───────────────────────────────────────────────────────────

    public function test_games_noteleks_named_route_resolves_correctly(): void
    {
        $this->assertEquals('/noteleks', route('games.noteleks', [], false));
    }

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
            'login'    => ['/login'],
            'register' => ['/register'],
        ];
    }
}
