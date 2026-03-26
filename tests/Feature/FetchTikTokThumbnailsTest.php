<?php

namespace Tests\Feature;

use App\Models\TikTokVideo;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class FetchTikTokThumbnailsTest extends TestCase
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

    public function test_command_reports_no_videos_when_table_is_empty(): void
    {
        $this->artisan('tiktok:fetch-thumbnails')
             ->expectsOutput('No videos need thumbnails.')
             ->assertExitCode(0);
    }

    public function test_command_skips_videos_with_existing_thumbnail_by_default(): void
    {
        TikTokVideo::create([
            'tiktok_video_id' => '111',
            'post_type'       => 'video',
            'title'           => 'Has Thumb',
            'thumbnail_url'   => 'https://cdn.test/existing.jpg',
            'is_active'       => true,
            'sort_order'      => 0,
        ]);

        $this->artisan('tiktok:fetch-thumbnails')
             ->expectsOutput('No videos need thumbnails.')
             ->assertExitCode(0);
    }

    public function test_command_import_extracts_video_id_from_video_url(): void
    {
        // The command uses `new Client()` directly, so run --import and assert
        // the DB record was created with the correct parsed values.
        // Exit code may be 1 if oEmbed fails (no network), which is acceptable here.
        $this->artisan('tiktok:fetch-thumbnails', [
            '--import' => ['https://www.tiktok.com/@graveyardjokes/video/7999888777666555444'],
        ])->run();

        $this->assertDatabaseHas('tiktok_videos', [
            'tiktok_video_id' => '7999888777666555444',
            'post_type'       => 'video',
        ]);
    }

    public function test_command_import_detects_photo_type(): void
    {
        $this->artisan('tiktok:fetch-thumbnails', [
            '--import' => ['https://www.tiktok.com/@graveyardjokes/photo/1234567890'],
        ])->run();

        $this->assertDatabaseHas('tiktok_videos', [
            'tiktok_video_id' => '1234567890',
            'post_type'       => 'photo',
        ]);
    }

    public function test_command_import_skips_duplicate_video_id(): void
    {
        TikTokVideo::create([
            'tiktok_video_id' => '555',
            'post_type'       => 'video',
            'title'           => 'Existing',
            'thumbnail_url'   => 'https://cdn.test/t.jpg',
            'is_active'       => true,
            'sort_order'      => 0,
        ]);

        $this->artisan('tiktok:fetch-thumbnails', [
            '--import' => ['https://www.tiktok.com/@graveyardjokes/video/555'],
        ])->run();

        $this->assertDatabaseCount('tiktok_videos', 1);
    }

    public function test_command_import_warns_on_unrecognised_url(): void
    {
        $this->artisan('tiktok:fetch-thumbnails', [
            '--import' => ['https://example.com/not-a-tiktok-url'],
        ])->expectsOutput('Could not extract video ID from: https://example.com/not-a-tiktok-url')
          ->assertExitCode(0);
    }
}
