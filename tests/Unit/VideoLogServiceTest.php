<?php

namespace Tests\Unit;

use Tests\TestCase;
use Illuminate\Support\Facades\Storage;
use App\Services\VideoLogService;

class VideoLogServiceTest extends TestCase
{
    public function test_list_returns_video_and_thumbnail_from_fake_s3()
    {
        // Ensure default disk is s3 for this test
        config(['filesystems.default' => 's3']);
        Storage::fake('s3');

        // Put a fake video and thumbnail
        Storage::disk('s3')->put('video-logs/unit-video.mp4', 'video-content');
        Storage::disk('s3')->put('images/vlogs/unit-video.jpg', 'thumb-content');

        $svc = new VideoLogService();
        $items = $svc->list();

        $this->assertIsArray($items);
        $this->assertNotEmpty($items);

        // Find by url or thumbnail path to avoid depending on title formatting
        $found = collect($items)->first(function ($it) {
            return str_contains($it->url, 'unit-video.mp4') || str_contains($it->thumbnail, 'unit-video.jpg');
        });

        $this->assertNotNull($found, 'expected unit-video entry by url/thumbnail');

        // In testing, URLs should be proxy URLs (serve endpoint)
        $this->assertStringContainsString('/api/video-logs/serve', $found->url);
        $this->assertStringContainsString('/api/video-logs/serve', $found->thumbnail);
    }

    public function test_cloudfront_rewrite_when_configured()
    {
        // Configure CloudFront env and assert the URL rewrite logic directly by invoking
        // the protected makeS3Url method via reflection. This avoids depending on
        // the service's S3-use decision which is influenced by the test environment.
        putenv('CLOUDFRONT_DOMAIN=cdn.example.test');
        config(['filesystems.default' => 's3']);

        // Ensure the application environment is not 'testing' so makeS3Url avoids the proxy branch
        $originalEnv = $this->app['env'] ?? null;
        $this->app['env'] = 'local';

        // Mock the s3 disk so makeS3Url can obtain a sample s3 url/temporaryUrl
        $mock = \Mockery::mock();
        $mock->shouldReceive('temporaryUrl')->andReturnUsing(function ($path, $expires) {
            return 'https://graveyardjokes-cdn.s3.us-east-2.amazonaws.com/' . $path;
        });
        $mock->shouldReceive('url')->andReturnUsing(function ($path) {
            return 'https://graveyardjokes-cdn.s3.us-east-2.amazonaws.com/' . $path;
        });

        \Illuminate\Support\Facades\Storage::shouldReceive('disk')->with('s3')->andReturn($mock);

        $svc = new VideoLogService();

        $ref = new \ReflectionObject($svc);
        $method = $ref->getMethod('makeS3Url');
        $method->setAccessible(true);

        $result = $method->invoke($svc, 'video-logs/cf-video.mp4');

        $this->assertStringContainsString('cdn.example.test', $result);

        // Cleanup env and Mockery
        putenv('CLOUDFRONT_DOMAIN');
        if ($originalEnv !== null) {
            $this->app['env'] = $originalEnv;
        }
        \Mockery::close();
    }
}
