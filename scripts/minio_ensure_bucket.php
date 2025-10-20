<?php
require __DIR__ . '/../vendor/autoload.php';
use Aws\S3\S3Client;

$client = new S3Client([
    'version' => 'latest',
    'region' => 'us-east-1',
    'endpoint' => 'http://127.0.0.1:9000',
    'use_path_style_endpoint' => true,
    'credentials' => [
        'key' => 'minioadmin',
        'secret' => 'minioadmin',
    ],
]);

$bucket = 'graveyardjokes-cdn';
try {
    $buckets = $client->listBuckets();
    $found = false;
    if (! empty($buckets['Buckets'])) {
        foreach ($buckets['Buckets'] as $b) {
            if (isset($b['Name']) && $b['Name'] === $bucket) { $found = true; break; }
        }
    }
    if (! $found) {
        $client->createBucket(['Bucket' => $bucket]);
        echo "Created bucket: {$bucket}\n";
    } else {
        echo "Bucket exists: {$bucket}\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
