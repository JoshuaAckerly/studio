<?php

namespace Tests\Feature;

use App\Models\TikTokVideo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VideoLogTikTokTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        DB::table('tiktok_videos')->delete();
    }

    protected function tearDown(): void
    {
        DB::table('tiktok_videos')->delete();
        parent::tearDown();
    }

    public function test_api_returns_tiktok_videos_when_present(): void
    {
        TikTokVideo::create([
            'tiktok_video_id' => '7123456789012345678',
            'post_type'       => 'video',
            'title'           => 'Studio Update',
            'description'     => 'Working on a track',
            'thumbnail_url'   => 'https://p16.tiktokcdn.com/thumb.jpg',
            'posted_at'       => '2026-03-20',
            'is_active'       => true,
            'sort_order'      => 0,
        ]);

        $response = $this->getJson('/api/video-logs');

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertNotEmpty($data);
        $item = collect($data)->firstWhere('title', 'Studio Update');
        $this->assertNotNull($item);

        $this->assertArrayHasKey('id', $item);
        $this->assertArrayHasKey('title', $item);
        $this->assertArrayHasKey('date', $item);
        $this->assertArrayHasKey('thumbnail', $item);
        $this->assertArrayHasKey('url', $item);
        $this->assertArrayHasKey('embed_url', $item);
        $this->assertArrayHasKey('description', $item);
    }

    public function test_api_tiktok_response_contains_embed_url(): void
    {
        TikTokVideo::create([
            'tiktok_video_id' => '9999',
            'post_type'       => 'video',
            'title'           => 'Embed Test',
            'is_active'       => true,
            'sort_order'      => 0,
        ]);

        $response = $this->getJson('/api/video-logs');
        $item     = collect($response->json('data'))->firstWhere('title', 'Embed Test');

        $this->assertStringContainsString('tiktok.com/embed/v2/9999', $item['embed_url']);
    }

    public function test_api_returns_only_active_tiktok_videos(): void
    {
        TikTokVideo::create([
            'tiktok_video_id' => 'active1',
            'post_type'       => 'video',
            'title'           => 'Active',
            'is_active'       => true,
            'sort_order'      => 0,
        ]);

        TikTokVideo::create([
            'tiktok_video_id' => 'inactive1',
            'post_type'       => 'video',
            'title'           => 'Inactive',
            'is_active'       => false,
            'sort_order'      => 0,
        ]);

        $response = $this->getJson('/api/video-logs');
        $data     = $response->json('data');

        $titles = collect($data)->pluck('title')->toArray();
        $this->assertContains('Active', $titles);
        $this->assertNotContains('Inactive', $titles);
    }

    public function test_api_falls_back_to_s3_service_when_no_tiktok_videos(): void
    {
        // No TikTokVideo rows — should fall back to VideoLogService (S3)
        config(['filesystems.default' => 's3']);
        Storage::fake('s3');
        Storage::disk('s3')->put('video-logs/demo.mp4', 'content');
        Storage::disk('s3')->put('images/vlogs/demo.jpg', 'thumb');

        $response = $this->getJson('/api/video-logs');

        $response->assertStatus(200);
        $this->assertIsArray($response->json('data'));
    }

    public function test_api_tiktok_date_format(): void
    {
        TikTokVideo::create([
            'tiktok_video_id' => 'date_test_1',
            'post_type'       => 'video',
            'title'           => 'Date Test',
            'posted_at'       => '2026-02-14',
            'is_active'       => true,
            'sort_order'      => 0,
        ]);

        $response = $this->getJson('/api/video-logs');
        $item     = collect($response->json('data'))->firstWhere('title', 'Date Test');

        $this->assertSame('2026-02-14', $item['date']);
    }
}
