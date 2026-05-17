<?php

namespace Tests\Feature;

use App\Models\FacebookGalleryPost;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class IllustrationApiCacheTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        DB::table('facebook_gallery_posts')->delete();
        Cache::forget('illustrations.api');
    }

    protected function tearDown(): void
    {
        DB::table('facebook_gallery_posts')->delete();
        Cache::forget('illustrations.api');
        parent::tearDown();
    }

    public function test_api_response_is_served_from_cache_on_second_call(): void
    {
        FacebookGalleryPost::create([
            'post_url' => 'https://facebook.com/page/posts/1',
            'title' => 'Original Post',
            'is_active' => true,
            'sort_order' => 0,
        ]);

        // First call populates the cache
        $first = $this->getJson('/api/illustrations');
        $first->assertStatus(200);
        $this->assertCount(1, $first->json('data'));

        // Insert a new active post after the cache is warm
        FacebookGalleryPost::create([
            'post_url' => 'https://facebook.com/page/posts/2',
            'title' => 'New Post',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        // Second call should still return the cached result (1 item, not 2)
        $second = $this->getJson('/api/illustrations');
        $second->assertStatus(200);
        $this->assertCount(1, $second->json('data'));
    }

    public function test_cache_is_stored_under_illustrations_api_key(): void
    {
        FacebookGalleryPost::create([
            'post_url' => 'https://facebook.com/page/posts/10',
            'title' => 'Cached Post',
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $this->assertFalse(Cache::has('illustrations.api'));

        $this->getJson('/api/illustrations')->assertStatus(200);

        $this->assertTrue(Cache::has('illustrations.api'));
    }

    public function test_fetch_gallery_thumbnails_command_clears_cache(): void
    {
        // Prime the cache with a dummy value
        Cache::put('illustrations.api', [['id' => 999, 'title' => 'Stale']], now()->addHours(6));

        $this->assertTrue(Cache::has('illustrations.api'));

        // Run the command against an empty table (no-op path that still clears cache)
        FacebookGalleryPost::create([
            'post_url' => 'https://facebook.com/page/posts/77',
            'title' => 'Has Thumb',
            'thumbnail_url' => 'https://cdn.test/thumb.jpg',
            'is_active' => true,
            'sort_order' => 0,
        ]);

        // --force processes the post (network will fail, but cache is still cleared)
        $this->artisan('gallery:fetch-thumbnails', ['--force' => true])->run();

        $this->assertFalse(Cache::has('illustrations.api'));
    }

    public function test_api_returns_fresh_data_after_cache_is_cleared(): void
    {
        FacebookGalleryPost::create([
            'post_url' => 'https://facebook.com/page/posts/1',
            'title' => 'Original Post',
            'is_active' => true,
            'sort_order' => 0,
        ]);

        // Warm the cache
        $this->getJson('/api/illustrations')->assertStatus(200);
        $this->assertCount(1, $this->getJson('/api/illustrations')->json('data'));

        // Manually clear cache and add a new record
        Cache::forget('illustrations.api');
        FacebookGalleryPost::create([
            'post_url' => 'https://facebook.com/page/posts/2',
            'title' => 'New Post',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        // Next call should return fresh data with 2 items
        $response = $this->getJson('/api/illustrations');
        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
    }
}
