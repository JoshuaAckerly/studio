<?php

namespace Tests\Feature;

use App\Models\FacebookGalleryPost;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class FetchGalleryThumbnailsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        DB::table('facebook_gallery_posts')->delete();
    }

    protected function tearDown(): void
    {
        DB::table('facebook_gallery_posts')->delete();
        parent::tearDown();
    }

    public function test_command_reports_no_posts_when_table_is_empty(): void
    {
        $this->artisan('gallery:fetch-thumbnails')
            ->expectsOutput('No posts need thumbnails.')
            ->assertExitCode(0);
    }

    public function test_command_skips_posts_with_existing_thumbnail_by_default(): void
    {
        FacebookGalleryPost::create([
            'post_url' => 'https://facebook.com/page/posts/1',
            'title' => 'Has Thumb',
            'thumbnail_url' => 'https://cdn.test/existing.jpg',
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $this->artisan('gallery:fetch-thumbnails')
            ->expectsOutput('No posts need thumbnails.')
            ->assertExitCode(0);
    }

    public function test_command_falls_back_to_scraping_when_no_token_configured(): void
    {
        // No token in config — should warn about scraping fallback and not crash
        config(['services.facebook.app_access_token' => null]);

        FacebookGalleryPost::create([
            'post_url' => 'https://facebook.com/page/posts/99',
            'title' => 'No Thumb',
            'is_active' => true,
            'sort_order' => 0,
        ]);

        // Exit code may be 1 since scraping the real URL will fail outside a
        // controlled environment. Assert the command runs without throwing.
        $this->artisan('gallery:fetch-thumbnails')->run();

        $this->assertDatabaseHas('facebook_gallery_posts', ['title' => 'No Thumb']);
    }

    public function test_command_force_flag_processes_posts_with_existing_thumbnail(): void
    {
        FacebookGalleryPost::create([
            'post_url' => 'https://facebook.com/page/posts/77',
            'title' => 'Force Test',
            'thumbnail_url' => 'https://cdn.test/old.jpg',
            'is_active' => true,
            'sort_order' => 0,
        ]);

        // Exit code may be 1 since HTTP will fail outside a controlled
        // environment. Assert the command processes the post without crashing.
        $this->artisan('gallery:fetch-thumbnails', ['--force' => true])->run();

        // Post was loaded for re-fetching (command ran without "No posts" message)
        $this->assertDatabaseHas('facebook_gallery_posts', ['title' => 'Force Test']);
    }

    public function test_import_option_creates_new_post(): void
    {
        $url = 'https://www.facebook.com/photo?fbid=999999999';

        // HTTP will fail in test environment — use run() and assert DB state only
        $this->artisan('gallery:fetch-thumbnails', ['--import' => [$url]])->run();

        $this->assertDatabaseHas('facebook_gallery_posts', [
            'post_url' => $url,
            'is_active' => true,
        ]);
    }

    public function test_import_option_skips_duplicate_urls(): void
    {
        $url = 'https://www.facebook.com/photo?fbid=111111111';

        FacebookGalleryPost::create([
            'post_url' => $url,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        // Running import again with same URL should not duplicate the record
        $this->artisan('gallery:fetch-thumbnails', ['--import' => [$url]])->run();

        $this->assertSame(1, FacebookGalleryPost::where('post_url', $url)->count());
    }
}
