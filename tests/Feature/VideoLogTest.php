<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class VideoLogTest extends TestCase
{
    public function test_api_returns_s3_files_when_present()
    {
        // Ensure default disk is s3 for this test and fake the s3 disk
        config(['filesystems.default' => 's3']);
        
        // Fake the s3 disk
        Storage::fake('s3');

        // Put a fake video and thumbnail
        Storage::disk('s3')->put('video-logs/testvideo.mp4', 'video-content');
        Storage::disk('s3')->put('images/vlogs/testvideo.jpg', 'thumb-content');

    // Put files on fake disk (no explicit existence checks)

        // Call the API
        $response = $this->getJson('/api/video-logs');

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertIsArray($data);
        $this->assertNotEmpty($data);

        // Find our testvideo entry
        $found = collect($data)->firstWhere('title', 'Testvideo');
        $this->assertNotNull($found, 'Expected to find testvideo in API output');
    $this->assertArrayHasKey('url', $found);
    $this->assertArrayHasKey('thumbnail', $found);

    // (no debug output)

        // Verify the returned URLs are reachable (proxy will serve fake storage files)
        if (! empty($found['url'])) {
            $videoUrl = $found['url'];
            // If an absolute URL was returned, convert to a relative path for the test client
            if (preg_match('#^https?://#', $videoUrl)) {
                $p = parse_url($videoUrl);
                $videoUrl = ($p['path'] ?? $videoUrl) . (isset($p['query']) ? '?' . $p['query'] : '');
            }

            $videoResponse = $this->get($videoUrl);
            $videoResponse->assertStatus(200);
            $this->assertStringStartsWith('video/', $videoResponse->headers->get('Content-Type'));
        }

        if (! empty($found['thumbnail'])) {
            $thumbUrl = $found['thumbnail'];
            if (preg_match('#^https?://#', $thumbUrl)) {
                $p = parse_url($thumbUrl);
                $thumbUrl = ($p['path'] ?? $thumbUrl) . (isset($p['query']) ? '?' . $p['query'] : '');
            }

            $thumbResponse = $this->get($thumbUrl);
            $thumbResponse->assertStatus(200);
            $this->assertStringStartsWith('image/', $thumbResponse->headers->get('Content-Type'));
        }
    }

    public function test_api_falls_back_to_static_when_no_s3()
    {
        // Ensure default disk is not s3 for this test by faking local
        config(['filesystems.default' => 'local']);

        $response = $this->getJson('/api/video-logs');
        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertIsArray($data);
        $this->assertCount(2, $data);
        $this->assertEquals('Studio Update — Composing Session', $data[0]['title']);
    }
}
