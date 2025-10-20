<?php
// scripts/aws_to_minio_copy.php
// Copy objects from AWS S3 to local MinIO (same bucket name, different endpoints)
// Usage: php scripts/aws_to_minio_copy.php [--dry]

require __DIR__ . '/../vendor/autoload.php';

use Aws\S3\S3Client;
use App\Services\StorageConfigProvider;

// Simple CLI arg parsing
$dry = in_array('--dry', $argv, true);
$help = in_array('--help', $argv, true) || in_array('-h', $argv, true);

$sourceBucket = 'graveyardjokes-cdn';
$prefix = rtrim('images/illustrations', '/') . '/';
$destBucket = 'graveyardjokes-cdn';
$destEndpoint = null;

for ($i = 1; $i < count($argv); $i++) {
    $arg = $argv[$i];
    if ($arg === '--bucket' && isset($argv[$i+1])) { $sourceBucket = $argv[++$i]; }
    if ($arg === '--prefix' && isset($argv[$i+1])) { $prefix = rtrim($argv[++$i], '/') . '/'; }
    if ($arg === '--dest-bucket' && isset($argv[$i+1])) { $destBucket = $argv[++$i]; }
    if ($arg === '--dest-endpoint' && isset($argv[$i+1])) { $destEndpoint = $argv[++$i]; }
    if ($arg === '--dry') { $dry = true; }
    if ($arg === '--help' || $arg === '-h') { $help = true; }
}

if ($help) {
    echo "Usage: php scripts/aws_to_minio_copy.php [--bucket <bucket>] [--prefix <prefix>] [--dest-bucket <bucket>] [--dest-endpoint <endpoint>] [--dry] [--help]\n";
    exit(0);
}

// Validation helpers
function isValidS3Bucket(string $bucket): bool
{
    $len = strlen($bucket);
    if ($len < 3 || $len > 63) return false;
    // must be lowercase letters, numbers, dots, hyphens
    if (!preg_match('/^[a-z0-9][a-z0-9\.-]{1,61}[a-z0-9]$/', $bucket)) return false;
    if (strpos($bucket, '..') !== false) return false;
    // must not be an IPv4 address
    if (preg_match('/^\d+\.\d+\.\d+\.\d+$/', $bucket)) return false;
    return true;
}

function normalizePrefix(string $p): string
{
    $p = trim($p);
    // remove leading slash
    $p = ltrim($p, '/');
    if ($p === '') return '';
    if (substr($p, -1) !== '/') $p .= '/';
    return $p;
}

// Apply prefix normalization and validate bucket
$prefix = normalizePrefix($prefix);
if ($prefix === '') {
    fwrite(STDERR, "ERROR: prefix cannot be empty. Provide a valid S3 prefix (e.g. images/illustrations).\n");
    exit(1);
}

if (!isValidS3Bucket($sourceBucket)) {
    fwrite(STDERR, "ERROR: source bucket name '{$sourceBucket}' appears invalid. Must be 3-63 chars, lowercase, may contain dots and hyphens.\n");
    exit(1);
}

if (!isValidS3Bucket($destBucket)) {
    fwrite(STDERR, "ERROR: destination bucket name '{$destBucket}' appears invalid.\n");
    exit(1);
}

if ($destEndpoint !== null && !preg_match('#^https?://#', $destEndpoint)) {
    fwrite(STDERR, "ERROR: dest-endpoint must start with http:// or https://\n");
    exit(1);
}

$basePath = realpath(__DIR__ . DIRECTORY_SEPARATOR . '..');

// Source (AWS) client - prefer admin creds from .env (if present), fall back to normal AWS_* values.
// Use StorageConfigProvider to centralize env parsing and SDK config
$provider = new StorageConfigProvider($basePath);

$srcConfig = $provider->sdkConfig(true);
// Create source client (AWS)
$srcClient = new S3Client($srcConfig);

// Destination (MinIO) client configuration: prefer explicit AWS_ENDPOINT env or default to local
$dstConfig = $provider->sdkConfig(false);
// If no endpoint provided, default to local MinIO for this script
if (empty($dstConfig['endpoint'])) {
    $dstConfig['endpoint'] = 'http://127.0.0.1:9000';
    $dstConfig['region'] = $dstConfig['region'] ?? 'us-east-1';
    $dstConfig['use_path_style_endpoint'] = true;
    // Default local credentials
    $dstConfig['credentials'] = [
        'key' => 'minioadmin',
        'secret' => 'minioadmin',
    ];
}

$dstClient = new S3Client($dstConfig);

echo ($dry ? "DRY RUN: listing objects to copy\n" : "RUN: copying objects\n");

$paginator = $srcClient->getPaginator('ListObjectsV2', [
    'Bucket' => $sourceBucket,
    'Prefix' => $prefix,
]);

$toCopy = [];
foreach ($paginator as $page) {
    if (empty($page['Contents'])) continue;
    foreach ($page['Contents'] as $obj) {
        $key = $obj['Key'];
        // skip the prefix placeholder if present
        if ($key === $prefix) continue;
        $toCopy[] = $key;
    }
}

if (empty($toCopy)) {
    echo "No objects found under prefix: {$prefix}\n";
    exit(0);
}

echo "Found " . count($toCopy) . " objects to consider.\n";

$copied = 0;
$skipped = 0;
$failed = 0;

foreach ($toCopy as $key) {
    echo ($dry ? "Would copy: {$key}\n" : "Copying: {$key} ... ");
    if ($dry) continue;

    try {
        // Stream object from source
        $result = $srcClient->getObject([
            'Bucket' => $sourceBucket,
            'Key' => $key,
        ]);
        $body = $result['Body'];

        // Upload to destination (MinIO)
        $dstClient->putObject([
            'Bucket' => $destBucket,
            'Key' => $key,
            'Body' => $body,
            'ACL' => 'private',
        ]);

        echo "OK\n";
        $copied++;
    } catch (\Exception $e) {
        echo "FAILED: " . $e->getMessage() . "\n";
        $failed++;
    }
}

if (! $dry) {
    echo "Done. Copied: {$copied}, Failed: {$failed}\n";
} else {
    echo "Dry-run complete. Would copy: " . count($toCopy) . " objects.\n";
}

return 0;
