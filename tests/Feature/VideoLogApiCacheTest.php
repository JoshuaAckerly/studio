<?php

namespace Tests\Feature;

use App\Models\TikTokVideo;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\PendingCommand;
use Tests\TestCase;

class VideoLogApiCacheTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        DB::table('tiktok_videos')->delete();
        Cache::forget('video-log.api');
    }

    protected function tearDown(): void
    {
        DB::table('tiktok_videos')->delete();
        Cache::forget('video-log.api');
        parent::tearDown();
    }

    public function test_api_response_is_served_from_cache_on_second_call(): void
    {
        TikTokVideo::create([
            'tiktok_video_id' => '111111111',
            'post_type' => 'video',
            'title' => 'Original Video',
            'thumbnail_url' => 'https://cdn.test/thumb1.jpg',
            'is_active' => true,
            'sort_order' => 0,
        ]);

        // First call populates the cache
        $first = $this->getJson('/api/video-logs');
        $first->assertStatus(200);
        $this->assertCount(1, (array) $first->json('data'));

        // Insert a new active video after the cache is warm
        TikTokVideo::create([
            'tiktok_video_id' => '222222222',
            'post_type' => 'video',
            'title' => 'New Video',
            'thumbnail_url' => 'https://cdn.test/thumb2.jpg',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        // Second call should still return the cached result (1 item, not 2)
        $second = $this->getJson('/api/video-logs');
        $second->assertStatus(200);
        $this->assertCount(1, (array) $second->json('data'));
    }

    public function test_cache_is_stored_under_video_log_api_key(): void
    {
        TikTokVideo::create([
            'tiktok_video_id' => '333333333',
            'post_type' => 'video',
            'title' => 'Cached Video',
            'thumbnail_url' => 'https://cdn.test/thumb3.jpg',
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $this->assertFalse(Cache::has('video-log.api'));

        $this->getJson('/api/video-logs')->assertStatus(200);

        $this->assertTrue(Cache::has('video-log.api'));
    }

    public function test_fetch_tiktok_thumbnails_command_clears_cache(): void
    {
        // Prime the cache with a dummy value
        Cache::put('video-log.api', [['id' => 999, 'title' => 'Stale']], now()->addHours(6));

        $this->assertTrue(Cache::has('video-log.api'));

        TikTokVideo::create([
            'tiktok_video_id' => '444444444',
            'post_type' => 'video',
            'title' => 'Has Thumb',
            'thumbnail_url' => 'https://cdn.test/existing.jpg',
            'is_active' => true,
            'sort_order' => 0,
        ]);

        // --force processes the video (network will fail, but cache is still cleared)
        $command = $this->artisan('tiktok:fetch-thumbnails', ['--force' => true]);
        assert($command instanceof PendingCommand);
        $command->run();

        $this->assertFalse(Cache::has('video-log.api'));
    }

    public function test_api_returns_fresh_data_after_cache_is_cleared(): void
    {
        TikTokVideo::create([
            'tiktok_video_id' => '555555555',
            'post_type' => 'video',
            'title' => 'Original Video',
            'thumbnail_url' => 'https://cdn.test/thumb5.jpg',
            'is_active' => true,
            'sort_order' => 0,
        ]);

        // Warm the cache
        $this->getJson('/api/video-logs')->assertStatus(200);
        $this->assertCount(1, (array) $this->getJson('/api/video-logs')->json('data'));

        // Manually clear cache and add a new record
        Cache::forget('video-log.api');
        TikTokVideo::create([
            'tiktok_video_id' => '666666666',
            'post_type' => 'video',
            'title' => 'New Video',
            'thumbnail_url' => 'https://cdn.test/thumb6.jpg',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        // Next call should return fresh data with 2 items
        $response = $this->getJson('/api/video-logs');
        $response->assertStatus(200);
        $this->assertCount(2, (array) $response->json('data'));
    }
}
