<?php
// tests/bootstrap/minio-check.php
// Quick test bootstrap to verify the configured S3 bucket exists for integration tests.

require __DIR__ . '/../../vendor/autoload.php';

$app = require __DIR__ . '/../../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Decide whether to run the integration bucket check.
$shouldRun = false;
$argv = isset($_SERVER['argv']) ? $_SERVER['argv'] : [];
// Check common CLI flags: --group integration or --group=integration
foreach ($argv as $i => $a) {
    if ($a === '--group' && isset($argv[$i + 1]) && stripos($argv[$i + 1], 'integration') !== false) {
        $shouldRun = true;
        break;
    }
    if (preg_match('/^--group=(.*)/i', $a, $m) && stripos($m[1], 'integration') !== false) {
        $shouldRun = true;
        break;
    }
    if (preg_match('/^--testsuite=(.*)/i', $a, $m) && stripos($m[1], 'integration') !== false) {
        $shouldRun = true;
        break;
    }
}

// Allow an explicit env var to force the check (useful in CI): RUN_INTEGRATION=1
if (! $shouldRun && getenv('RUN_INTEGRATION')) {
    $shouldRun = true;
}

if ($shouldRun) {
    $bucket = getenv('AWS_BUCKET') ?: config('filesystems.disks.s3.bucket');
    $diskName = getenv('FILESYSTEM_DISK') ?: 's3';
    $disk = Illuminate\Support\Facades\Storage::disk($diskName);
    try {
        // Build an S3 client directly from config to avoid coupling to Flysystem internals
        $s3cfg = config('filesystems.disks.' . $diskName, []);
        $key = $s3cfg['key'] ?? getenv('AWS_ACCESS_KEY_ID');
        $secret = $s3cfg['secret'] ?? getenv('AWS_SECRET_ACCESS_KEY');
        $region = $s3cfg['region'] ?? getenv('AWS_DEFAULT_REGION') ?: 'us-east-1';
        $endpoint = $s3cfg['endpoint'] ?? getenv('AWS_ENDPOINT');
        $usePath = isset($s3cfg['use_path_style_endpoint']) ? (bool) $s3cfg['use_path_style_endpoint'] : filter_var(getenv('AWS_USE_PATH_STYLE_ENDPOINT') ?: 'false', FILTER_VALIDATE_BOOLEAN);

        $client = new Aws\S3\S3Client([
            'version' => 'latest',
            'region' => $region,
            'endpoint' => $endpoint ?: null,
            'use_path_style_endpoint' => $usePath,
            'credentials' => [
                'key' => $key,
                'secret' => $secret,
            ],
            'http' => ['verify' => false],
        ]);

        // Attempt a minimal list to verify bucket accessibility
        $client->listObjectsV2(['Bucket' => $bucket, 'MaxKeys' => 1]);
    } catch (Throwable $e) {
        fwrite(STDERR, "Integration bootstrap failure: S3 bucket '{$bucket}' not accessible.\n");
        fwrite(STDERR, "Ensure MinIO is running and the bucket exists (scripts/Start-Minio.ps1 or scripts/start_minio.sh).\n");
        // Diagnostic info
        fwrite(STDERR, "Exception: " . get_class($e) . " - " . $e->getMessage() . "\n");
        if ($e instanceof Aws\Exception\AwsException && method_exists($e, 'getResponse')) {
            $resp = $e->getResponse();
            if ($resp) {
                fwrite(STDERR, "Response code: " . $resp->getStatusCode() . "\n");
                fwrite(STDERR, (string)$resp->getBody() . "\n");
            }
        }
        fwrite(STDERR, "Stack:\n" . $e->getTraceAsString() . "\n");
        exit(2);
    }
}

// Fallback: don't interfere for other test groups
return;
