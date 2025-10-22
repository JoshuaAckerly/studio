<?php
// scripts/download_from_minio.php
// Usage: php scripts/download_from_minio.php <s3-key> <local-path>

require __DIR__ . '/../vendor/autoload.php';

use Aws\S3\S3Client;
use App\Services\StorageConfigProvider;

$argv0 = $argv[0] ?? 'download_from_minio.php';
if (!isset($argv[1]) || !isset($argv[2])) {
    echo "Usage: php {$argv0} <s3-key> <local-path>\n";
    exit(1);
}

$key = $argv[1];
$local = $argv[2];

$basePath = realpath(__DIR__ . DIRECTORY_SEPARATOR . '..');
$provider = new StorageConfigProvider($basePath);
$cfg = $provider->sdkConfig(false);

// If no endpoint (or it's pointing to AWS), assume MinIO local for destination
if (empty($cfg['endpoint'])) {
    $cfg['endpoint'] = 'http://127.0.0.1:9000';
    $cfg['region'] = $cfg['region'] ?? 'us-east-2';
    $cfg['use_path_style_endpoint'] = true;
    $cfg['credentials'] = [
        'key' => $provider->lookup('AWS_ACCESS_KEY_ID') ?: $provider->lookup('MINIO_ROOT_USER'),
        'secret' => $provider->lookup('AWS_SECRET_ACCESS_KEY') ?: $provider->lookup('MINIO_ROOT_PASSWORD'),
    ];
}

$s3 = new S3Client($cfg);

$bucket = $provider->lookup('AWS_BUCKET') ?: 'graveyardjokes-cdn';

try {
    $res = $s3->getObject(['Bucket' => $bucket, 'Key' => $key]);
    $body = $res['Body']->getContents();

    $dir = dirname($local);
    if (!is_dir($dir)) mkdir($dir, 0755, true);

    file_put_contents($local, $body);
    echo "Wrote {$local}\n";
    exit(0);
} catch (\Exception $e) {
    fwrite(STDERR, "Failed to download {$key}: " . $e->getMessage() . "\n");
    exit(2);
}
