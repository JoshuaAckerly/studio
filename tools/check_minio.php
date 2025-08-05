<?php
require __DIR__ . '/../vendor/autoload.php';

use Aws\S3\S3Client;

$endpoint = getenv('AWS_ENDPOINT') ?: 'http://127.0.0.1:9000';
$key = getenv('AWS_ACCESS_KEY_ID') ?: 'minioadmin';
$secret = getenv('AWS_SECRET_ACCESS_KEY') ?: 'minioadmin';
$bucket = getenv('AWS_BUCKET') ?: 'graveyardjokes-cdn';

echo "Endpoint: $endpoint\n";
echo "Key: $key\n";
echo "Bucket: $bucket\n";

try {
    $s3 = new S3Client([
        'version' => 'latest',
        'region' => 'us-east-1',
        'endpoint' => $endpoint,
        'use_path_style_endpoint' => true,
        'credentials' => [
            'key' => $key,
            'secret' => $secret,
        ],
        'http' => ['verify' => false],
    ]);

    $result = $s3->listObjectsV2(['Bucket' => $bucket, 'MaxKeys' => 5]);
    echo "ListObjectsV2 succeeded. Count: " . count($result['Contents'] ?? []) . "\n";
    foreach ($result['Contents'] ?? [] as $obj) {
        echo $obj['Key'] . "\n";
    }
} catch (Throwable $e) {
    echo "Error: " . get_class($e) . " - " . $e->getMessage() . "\n";
    if ($e instanceof Aws\Exception\AwsException) {
        $resp = $e->getResponse();
        if ($resp) {
            echo "Response: " . $resp->getStatusCode() . "\n";
            echo (string)$resp->getBody() . "\n";
        }
    }
    exit(1);
}

exit(0);
