<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\StorageUrlGenerator;

class StorageUrlGeneratorTest extends TestCase
{
    public function test_returns_proxy_url_in_testing_environment()
    {
        // Ensure the environment is testing for this assertion
        $this->assertTrue(app()->environment('testing'));

        $mockDisk = \Mockery::mock();
        $generator = new StorageUrlGenerator($mockDisk, null, 60);

        $result = $generator->url('some/path/file.mp4');

        $this->assertStringContainsString('/api/video-logs/serve', $result);
        $this->assertStringContainsString('some%2Fpath%2Ffile.mp4', $result);
    }

    public function test_uses_temporaryUrl_and_rewrites_to_cloudfront()
    {
        // Make sure we're not in testing so generator uses disk methods
        $originalEnv = $this->app['env'] ?? null;
        $this->app['env'] = 'local';

        $mock = new class {
            public function temporaryUrl($path, $expires)
            {
                return 'https://bucket.s3.amazonaws.com/' . $path . '?x=1';
            }

            public function url($path)
            {
                return 'https://bucket.s3.amazonaws.com/' . $path;
            }
        };

        $generator = new StorageUrlGenerator($mock, 'cdn.example.test', 60);

        $res = $generator->url('video-logs/cf-video.mp4');

        $this->assertStringContainsString('cdn.example.test', $res);
        $this->assertStringContainsString('/video-logs/cf-video.mp4', $res);

        if ($originalEnv !== null) {
            $this->app['env'] = $originalEnv;
        }
    }

    public function test_falls_back_to_url_when_temporaryUrl_missing()
    {
        $originalEnv = $this->app['env'] ?? null;
        $this->app['env'] = 'local';

        $mock = \Mockery::mock();
        $mock->shouldReceive('temporaryUrl')->andThrow(new \Exception('no temporaryUrl'));
        $mock->shouldReceive('url')->andReturn('https://bucket.s3.amazonaws.com/some/path.jpg');

        $generator = new StorageUrlGenerator($mock, null, 60);

        $res = $generator->url('some/path.jpg');

        $this->assertStringContainsString('bucket.s3.amazonaws.com', $res);

        if ($originalEnv !== null) {
            $this->app['env'] = $originalEnv;
        }
        \Mockery::close();
    }
}
