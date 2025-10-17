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
