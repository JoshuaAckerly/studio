<?php

namespace Tests\Unit;

use App\Models\TikTokVideo;
use Tests\TestCase;

class TikTokVideoTest extends TestCase
{
    public function test_embed_url_attribute_builds_correct_url(): void
    {
        $video = new TikTokVideo(['tiktok_video_id' => '7123456789012345678']);

        $this->assertSame(
            'https://www.tiktok.com/embed/v2/7123456789012345678',
            $video->embed_url
        );
    }

    public function test_video_url_attribute_uses_config_username(): void
    {
        config(['services.tiktok.username' => '@testuser']);

        $video = new TikTokVideo([
            'tiktok_video_id' => '7123456789012345678',
            'post_type' => 'video',
        ]);

        $this->assertSame(
            'https://www.tiktok.com/@testuser/video/7123456789012345678',
            $video->video_url
        );
    }

    public function test_video_url_attribute_strips_leading_at_from_config(): void
    {
        config(['services.tiktok.username' => '@graveyardjokes']);

        $video = new TikTokVideo([
            'tiktok_video_id' => '111',
            'post_type' => 'photo',
        ]);

        $this->assertSame(
            'https://www.tiktok.com/@graveyardjokes/photo/111',
            $video->video_url
        );
    }

    public function test_video_url_falls_back_to_video_type_when_post_type_null(): void
    {
        config(['services.tiktok.username' => 'myuser']);

        $video = new TikTokVideo([
            'tiktok_video_id' => '999',
            'post_type' => null,
        ]);

        $this->assertStringContainsString('/video/999', $video->video_url);
    }

    public function test_is_active_cast_to_boolean(): void
    {
        $active = new TikTokVideo(['is_active' => 1]);
        $inactive = new TikTokVideo(['is_active' => 0]);

        $this->assertTrue($active->is_active);
        $this->assertFalse($inactive->is_active);
    }

    public function test_posted_at_cast_to_date(): void
    {
        $video = new TikTokVideo(['posted_at' => '2026-03-25']);

        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $video->posted_at);
        $this->assertSame('2026-03-25', $video->posted_at->format('Y-m-d'));
    }

    public function test_fillable_fields_are_set(): void
    {
        $video = new TikTokVideo([
            'tiktok_video_id' => 'abc',
            'post_type' => 'video',
            'title' => 'My Video',
            'description' => 'A description',
            'thumbnail_url' => 'https://cdn.test/thumb.jpg',
            'is_active' => true,
            'sort_order' => 3,
        ]);

        $this->assertSame('abc', $video->tiktok_video_id);
        $this->assertSame('My Video', $video->title);
        $this->assertSame(3, $video->sort_order);
    }
}
