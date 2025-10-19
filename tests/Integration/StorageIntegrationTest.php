<?php

namespace Tests\Integration;

use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use App\Services\StorageUrlGenerator;

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

        // Ensure S3 disk has required config values in CI/integration environments
        // Ensure env vars are present and set sane defaults for integration (MinIO)
        if (! env('AWS_BUCKET')) {
            putenv('AWS_BUCKET=test-bucket');
            $_ENV['AWS_BUCKET'] = 'test-bucket';
            $_SERVER['AWS_BUCKET'] = 'test-bucket';
        }
        if (! env('AWS_ENDPOINT')) {
            putenv('AWS_ENDPOINT=http://localhost:9000');
            $_ENV['AWS_ENDPOINT'] = 'http://localhost:9000';
            $_SERVER['AWS_ENDPOINT'] = 'http://localhost:9000';
        }
        // Ensure AWS credentials are present to prevent SDK trying instance profile (IMDS)
        if (! env('AWS_ACCESS_KEY_ID')) {
            putenv('AWS_ACCESS_KEY_ID=minioadmin');
            $_ENV['AWS_ACCESS_KEY_ID'] = 'minioadmin';
            $_SERVER['AWS_ACCESS_KEY_ID'] = 'minioadmin';
        }
        if (! env('AWS_SECRET_ACCESS_KEY')) {
            putenv('AWS_SECRET_ACCESS_KEY=minioadmin');
            $_ENV['AWS_SECRET_ACCESS_KEY'] = 'minioadmin';
            $_SERVER['AWS_SECRET_ACCESS_KEY'] = 'minioadmin';
        }

        // Ensure app.url is not localhost in CI so StorageUrlGenerator won't proxy local URLs
        if (! env('APP_URL')) {
            putenv('APP_URL=https://studio.test');
            $_ENV['APP_URL'] = 'https://studio.test';
            $_SERVER['APP_URL'] = 'https://studio.test';
        }

        // Ensure S3 disk config is populated from env / existing config and not empty
        config(['filesystems.disks.s3' => array_merge(config('filesystems.disks.s3', []), [
            'key' => env('AWS_ACCESS_KEY_ID', config('filesystems.disks.s3.key')),
            'secret' => env('AWS_SECRET_ACCESS_KEY', config('filesystems.disks.s3.secret')),
            'region' => env('AWS_DEFAULT_REGION', config('filesystems.disks.s3.region', 'us-east-1')),
            'bucket' => env('AWS_BUCKET', config('filesystems.disks.s3.bucket', 'test-bucket')),
            'endpoint' => env('AWS_ENDPOINT', config('filesystems.disks.s3.endpoint', 'http://localhost:9000')),
            'use_path_style_endpoint' => filter_var(env('AWS_USE_PATH_STYLE_ENDPOINT', config('filesystems.disks.s3.use_path_style_endpoint', true)), FILTER_VALIDATE_BOOLEAN),
        ])]);

        // Ensure app.url does not match the S3 host in CI (prevents proxying in StorageUrlGenerator)
        config(['app.url' => env('APP_URL', 'https://studio.test')]);
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

    public function test_storage_url_generator_signed_url_and_cloudfront_rewrite()
    {
        $disk = Storage::disk('s3');

        $path = 'integration-test/' . uniqid() . '.txt';
        $disk->put($path, 'integration-url-test');

        // instantiate generator with disk and a fake cloudfront domain
        $generator = new StorageUrlGenerator($disk, 'd123.cloudfront.net', 10);

        $url = $generator->url($path, 5);

        $this->assertIsString($url);

        $parsed = parse_url($url);
        $this->assertNotFalse($parsed);

        // when CloudFront domain is provided, hostname should be rewritten
        $this->assertStringContainsString('d123.cloudfront.net', $parsed['host'] ?? '');

        // query should exist and contain signature-like components (MinIO uses X-Amz-Algorithm/X-Amz-Signature)
        $this->assertArrayHasKey('query', $parsed);
        parse_str($parsed['query'], $qs);

        $this->assertTrue(isset($qs['X-Amz-Algorithm']) || isset($qs['X-Amz-Signature']) || isset($qs['Signature']) , 'No signature/query params found on presigned URL');

        // Validate expiry param exists and is approximately 5 minutes (300s)
        if (isset($qs['X-Amz-Expires'])) {
            $expiresVal = (int) $qs['X-Amz-Expires'];
        } elseif (isset($qs['Expires'])) {
            $expiresVal = (int) $qs['Expires'];
        } else {
            $this->fail('No expiry parameter (X-Amz-Expires or Expires) found on presigned URL');
        }

    // allow small clock skew tolerance (configurable)
    $tolerance = (int) config('media.url_expiry_tolerance_seconds', 20);
    $expected = 300; // seconds for 5 minutes
    $this->assertGreaterThanOrEqual($expected - $tolerance, $expiresVal, 'Expiry is too small');
    $this->assertLessThanOrEqual($expected + $tolerance, $expiresVal, 'Expiry is larger than expected');

        // Also ensure that when no CloudFront domain is provided, host is the original S3/MinIO host
        $generatorNoCf = new StorageUrlGenerator($disk, null, 10);
        $urlNoCf = $generatorNoCf->url($path, 5);
        $parsedNoCf = parse_url($urlNoCf);
        $this->assertNotFalse($parsedNoCf);
        $this->assertStringNotContainsString('d123.cloudfront.net', $parsedNoCf['host'] ?? '', 'Host unexpectedly contains CloudFront when none provided');

        if (isset($parsedNoCf['query'])) {
            parse_str($parsedNoCf['query'], $qs2);
            $this->assertTrue(isset($qs2['X-Amz-Signature']) || isset($qs2['Signature']) || isset($qs2['X-Amz-Algorithm']), 'Unsigned presigned URL missing signature params');
        } else {
            $this->fail('Presigned URL without CloudFront did not include a query string');
        }

        // cleanup
        $disk->delete($path);
    }

    public function test_unsigned_disk_url_has_no_signature_params()
    {
        $disk = Storage::disk('s3');

        $path = 'integration-test/' . uniqid() . '.txt';
        $disk->put($path, 'unsigned-url-test');

        // get unsigned url from the disk (no temporaryUrl)
        $url = $disk->url($path);

        $this->assertIsString($url);

        $parsed = parse_url($url);
        $this->assertNotFalse($parsed);

        // if query exists, ensure it does not contain signature params
        if (isset($parsed['query'])) {
            parse_str($parsed['query'], $qs);
            $this->assertFalse(isset($qs['X-Amz-Signature']) || isset($qs['Signature']) || isset($qs['X-Amz-Algorithm']), 'Unsigned URL unexpectedly contains signature params');
        }

        $disk->delete($path);
    }
}
