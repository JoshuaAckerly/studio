<?php

namespace Tests\Integration;

use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * @group integration
 */
class StorageIntegrationTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();

        // Ensure we use the s3 disk for integration
        config(['filesystems.default' => 's3']);
    }

    public function test_s3_temporary_url_and_upload()
    {
        $disk = Storage::disk('s3');

        // create a small test file
        $path = 'integration-test/' . uniqid() . '.txt';
        $contents = "hello-integration";

        $disk->put($path, $contents);

        $this->assertTrue($disk->exists($path));

        // temporaryUrl should return a string (MinIO will return a presigned URL)
        $tmp = $disk->temporaryUrl($path, now()->addMinutes(5));

        $this->assertIsString($tmp);
        $this->assertStringContainsString($path, $tmp);

        // cleanup
        $disk->delete($path);
        $this->assertFalse($disk->exists($path));
    }
}
