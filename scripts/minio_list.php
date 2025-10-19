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
$prefix = 'images/illustrations/';

try {
    $res = $client->listObjectsV2(['Bucket' => $bucket, 'Prefix' => $prefix]);
    if (empty($res['Contents'])) {
        echo "No objects found\n";
    } else {
        foreach ($res['Contents'] as $o) {
            echo $o['Key'] . "\n";
        }
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
