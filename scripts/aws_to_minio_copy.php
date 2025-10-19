<?php
// scripts/aws_to_minio_copy.php
// Copy objects from AWS S3 to local MinIO (same bucket name, different endpoints)
// Usage: php scripts/aws_to_minio_copy.php [--dry]

require __DIR__ . '/../vendor/autoload.php';

use Aws\S3\S3Client;
use Dotenv\Dotenv;

$dry = in_array('--dry', $argv, true);
$sourceBucket = 'graveyardjokes-cdn';
$prefix = rtrim('images/illustrations', '/') . '/';
$destBucket = 'graveyardjokes-cdn';

// Load .env if available so this script picks up the same AWS_* values as the app.
$basePath = realpath(__DIR__ . DIRECTORY_SEPARATOR . '..');
if ($basePath && file_exists($basePath . DIRECTORY_SEPARATOR . '.env')) {
    try {
        Dotenv::createImmutable($basePath)->safeLoad();
    } catch (Exception $e) {
        // ignore dotenv load errors, we'll fallback to env vars
    }
}
// Helper to fetch var from $_ENV, getenv, or parse .env file if necessary
function lookupEnvVar(string $name, string $basePath)
{
    // First, parse the repository .env file if present and prefer its value.
    $envPath = $basePath . DIRECTORY_SEPARATOR . '.env';
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') continue;
            if (strpos($line, '=') === false) continue;
            list($k, $v) = array_map('trim', explode('=', $line, 2));
            if ($k !== $name) continue;
            // strip surrounding quotes if present
            if ((strlen($v) >= 2) && (($v[0] === '"' && $v[strlen($v)-1] === '"') || ($v[0] === "'" && $v[strlen($v)-1] === "'"))) {
                $v = substr($v, 1, -1);
            }
            // Return value found in .env
            return $v;
        }
    }

    // Next check $_ENV and then getenv()
    if (isset($_ENV[$name]) && $_ENV[$name] !== '') {
        return $_ENV[$name];
    }

    $g = getenv($name);
    if ($g !== false && $g !== '') {
        return $g;
    }

    return null;
}

// Source (AWS) client - prefer admin creds from .env (if present), fall back to normal AWS_* values.
$awsRegion = lookupEnvVar('AWS_DEFAULT_REGION', $basePath) ?: 'us-east-1';

// Prefer admin creds if provided
$accessKey = lookupEnvVar('AWS_ACCESS_KEY_ID_ADMIN', $basePath) ?? lookupEnvVar('AWS_ACCESS_KEY_ID', $basePath);
$secretKey = lookupEnvVar('AWS_SECRET_ACCESS_KEY_ADMIN', $basePath) ?? lookupEnvVar('AWS_SECRET_ACCESS_KEY', $basePath);

$srcConfig = [
    'version' => 'latest',
    'region' => $awsRegion,
];

if (! empty($accessKey) && ! empty($secretKey)) {
    $srcConfig['credentials'] = [
        'key' => $accessKey,
        'secret' => $secretKey,
    ];
} else {
    echo "No explicit AWS credentials found in env/.env; SDK will use default provider chain.\n";
}

$srcClient = new S3Client($srcConfig);

// Debugging: print resolved region and whether credentials were provided (masked)
// (No debug prints)

// Destination (MinIO) client - local MinIO credentials
$dstClient = new S3Client([
    'version' => 'latest',
    'region' => 'us-east-1',
    'endpoint' => 'http://127.0.0.1:9000',
    'use_path_style_endpoint' => true,
    'credentials' => [
        'key' => 'minioadmin',
        'secret' => 'minioadmin',
    ],
]);

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
