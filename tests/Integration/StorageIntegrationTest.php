<?php

namespace Tests\Integration;

use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Group;
use Tests\TestCase;
use App\Services\StorageUrlGenerator;
use App\Services\StorageConfigProvider;

#[Group('integration')]
class StorageIntegrationTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();

        // Ensure we use the s3 disk for integration
        config(['filesystems.default' => 's3']);

        // Ensure S3 disk has required config values in CI/integration environments
        // Use StorageConfigProvider to normalize env reads and provide sensible defaults for integration (MinIO)
        $provider = new StorageConfigProvider(base_path());

        $awsBucket = env('AWS_BUCKET') ?: ($provider->lookup('AWS_BUCKET') ?: 'test-bucket');
        putenv('AWS_BUCKET=' . $awsBucket);
        $_ENV['AWS_BUCKET'] = $awsBucket;
        $_SERVER['AWS_BUCKET'] = $awsBucket;

        $awsEndpoint = env('AWS_ENDPOINT') ?: ($provider->lookup('AWS_ENDPOINT') ?: 'http://127.0.0.1:9000');
        putenv('AWS_ENDPOINT=' . $awsEndpoint);
        $_ENV['AWS_ENDPOINT'] = $awsEndpoint;
        $_SERVER['AWS_ENDPOINT'] = $awsEndpoint;

        // Ensure AWS credentials are present to prevent SDK trying instance profile (IMDS)
        $awsKey = env('AWS_ACCESS_KEY_ID') ?: ($provider->lookup('AWS_ACCESS_KEY_ID') ?: 'minioadmin');
        putenv('AWS_ACCESS_KEY_ID=' . $awsKey);
        $_ENV['AWS_ACCESS_KEY_ID'] = $awsKey;
        $_SERVER['AWS_ACCESS_KEY_ID'] = $awsKey;

        $awsSecret = env('AWS_SECRET_ACCESS_KEY') ?: ($provider->lookup('AWS_SECRET_ACCESS_KEY') ?: 'minioadmin');
        putenv('AWS_SECRET_ACCESS_KEY=' . $awsSecret);
        $_ENV['AWS_SECRET_ACCESS_KEY'] = $awsSecret;
        $_SERVER['AWS_SECRET_ACCESS_KEY'] = $awsSecret;

        // Ensure app.url is not localhost in CI so StorageUrlGenerator won't proxy local URLs
        $appUrl = env('APP_URL') ?: ($provider->lookup('APP_URL') ?: 'https://studio.test');
        putenv('APP_URL=' . $appUrl);
        $_ENV['APP_URL'] = $appUrl;
        $_SERVER['APP_URL'] = $appUrl;

        // Ensure S3 disk config is populated from env / existing config and not empty
        // Populate S3 disk config but FORCE MinIO values for local integration runs so tests don't
        // accidentally pick up developer AWS credentials from the environment which will cause 403s.
        $s3Config = array_merge(config('filesystems.disks.s3', []), [
            // Explicit MinIO test credentials and endpoint for local integration
            'key' => 'minioadmin',
            'secret' => 'minioadmin',
            'region' => env('AWS_DEFAULT_REGION', config('filesystems.disks.s3.region', 'us-east-1')),
            'bucket' => env('AWS_BUCKET', config('filesystems.disks.s3.bucket', 'graveyardjokes-cdn')),
            'endpoint' => env('AWS_ENDPOINT', config('filesystems.disks.s3.endpoint', 'http://127.0.0.1:9000')),
            // Ensure path-style addressing so the host is 127.0.0.1 and bucket isn't used as hostname
            'use_path_style_endpoint' => true,
        ]);

        config(['filesystems.disks.s3' => $s3Config]);

        // Ensure app.url does not match the S3 host in CI (prevents proxying in StorageUrlGenerator)
        config(['app.url' => env('APP_URL', 'https://studio.test')]);
    }

    /**
     * When a test fails, write helpful debug files for CI artifact collection.
     * PHPUnit will call this when a test throws an exception/fails.
     *
     * @param \Throwable $t
     * @return void
     * @throws \Throwable
     */
    public function onNotSuccessfulTest(\Throwable $t): never
    {
        try {
            $this->writeFailureDebugFiles($t);
        } catch (\Throwable $e) {
            // Avoid masking the original failure; just log locally if debug write fails
            @file_put_contents(base_path('artifacts/phpunit/debug-write-error.txt'), (string) $e);
        }

        parent::onNotSuccessfulTest($t);
    }

    protected function writeFailureDebugFiles(\Throwable $t): void
    {
    $timestamp = date('Ymd-His');
    // Use class short name + uniqid to avoid relying on PHPUnit internals
    $testName = preg_replace('/[^A-Za-z0-9_\-]/', '_', (new \ReflectionClass($this))->getShortName() . '_' . uniqid());

        // Ensure directories exist in repo root so workflow artifact paths pick them up
        $phpunitDir = base_path('artifacts/phpunit');
        if (! is_dir($phpunitDir)) {
            @mkdir($phpunitDir, 0777, true);
        }

        $minioDir = base_path('minio-debug');
        if (! is_dir($minioDir)) {
            @mkdir($minioDir, 0777, true);
        }

        // Debug file with exception and env dump
        $debugPath = $phpunitDir . "/debug-{$testName}-{$timestamp}.log";
        $content = "Exception: " . $t->getMessage() . "\n\n";
        $content .= "Stack:\n" . $t->getTraceAsString() . "\n\n";
        $content .= "ENV VARS:\n";
        $provider = new StorageConfigProvider(base_path());
        foreach (['AWS_BUCKET','AWS_ENDPOINT','AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY','APP_URL'] as $k) {
            $val = $provider->lookup($k) ?: (getenv($k) ?: ($_ENV[$k] ?? ($_SERVER[$k] ?? '(empty)')));
            $content .= "$k=$val\n";
        }
        $content .= "\nLaravel filesystems.disks.s3:\n" . var_export(config('filesystems.disks.s3'), true) . "\n";

        @file_put_contents($debugPath, $content);

        // Attempt to list a small prefix (integration-test/) via AWS SDK to avoid huge listings
        try {
            $s3 = new \Aws\S3\S3Client([
                'version' => 'latest',
                'region' => config('filesystems.disks.s3.region', 'us-east-1'),
                'endpoint' => config('filesystems.disks.s3.endpoint') ?? null,
                'use_path_style_endpoint' => config('filesystems.disks.s3.use_path_style_endpoint', true),
                'credentials' => [
                    'key' => config('filesystems.disks.s3.key'),
                    'secret' => config('filesystems.disks.s3.secret'),
                ],
            ]);

            $bucket = config('filesystems.disks.s3.bucket');
            $prefix = 'integration-test/';

            $out = [];
            $paginator = $s3->getPaginator('ListObjectsV2', [
                'Bucket' => $bucket,
                'Prefix' => $prefix,
                'MaxKeys' => 100,
            ]);

            foreach ($paginator as $page) {
                if (! empty($page['Contents'])) {
                    foreach ($page['Contents'] as $obj) {
                        $out[] = sprintf("%s\t%d\t%s", $obj['Key'], $obj['Size'], $obj['LastModified']);
                    }
                }
            }

            $s3ListingPath = $minioDir . "/s3-listing-{$testName}-{$timestamp}.txt";
            @file_put_contents($s3ListingPath, implode("\n", $out));
        } catch (\Throwable $e) {
            @file_put_contents($minioDir . '/s3-listing-error.txt', (string) $e);
        }
    }

    /**
     * Wait for an object to be visible on the given disk.
     * Returns true when the object exists within the timeout, false otherwise.
     *
     * @param \Illuminate\Contracts\Filesystem\Filesystem $disk
     * @param string $path
     * @param int $timeoutSeconds
     * @param int $intervalMs
     * @return bool
     */
    protected function waitForObject($disk, string $path, int $timeoutSeconds = 10, int $intervalMs = 250): bool
    {
        $attempts = (int) ceil(($timeoutSeconds * 1000) / $intervalMs);
        for ($i = 0; $i < $attempts; $i++) {
            try {
                if ($disk->exists($path)) {
                    return true;
                }
            } catch (\Throwable $e) {
                // Ignore transient SDK exceptions while waiting
            }
            usleep($intervalMs * 1000);
        }
        return false;
    }

    public function test_s3_temporary_url_and_upload()
    {
        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('s3');

        // create a small test file
        $path = 'integration-test/' . uniqid() . '.txt';
        $contents = "hello-integration";

        $disk->put($path, $contents);

        // Wait for object to be visible (MinIO / CI can be transient)
        $this->assertTrue($this->waitForObject($disk, $path, 10, 250), 'Uploaded object did not become available in time');

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
        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('s3');

    $path = 'integration-test/' . uniqid() . '.txt';
    $disk->put($path, 'integration-url-test');
    $this->assertTrue($this->waitForObject($disk, $path, 10, 250), 'Uploaded object did not become available in time');

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
        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('s3');

    $path = 'integration-test/' . uniqid() . '.txt';
    $disk->put($path, 'unsigned-url-test');
    $this->assertTrue($this->waitForObject($disk, $path, 10, 250), 'Uploaded object did not become available in time');

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
