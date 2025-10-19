<?php
require __DIR__ . '/vendor/autoload.php';

try {
    $app = require __DIR__ . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    $prefix = config('media.illustrations_prefix');
    $disk = Storage::disk('s3');

    echo "filesystems.default=" . config('filesystems.default') . PHP_EOL;
    echo "s3.bucket=" . (config('filesystems.disks.s3.bucket') ?: '');
    echo PHP_EOL;

    try {
        // Existence check for bucket via headObject-like operation: attempt to list one object
        $files = $disk->files($prefix);
        echo "FILES_CALL_SUCCESS\n";
        echo json_encode(['count' => count($files), 'sample' => array_slice($files, 0, 10)], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
    } catch (Throwable $e) {
        echo "FILES_CALL_EXCEPTION: " . get_class($e) . " - " . $e->getMessage() . PHP_EOL;
        echo $e->getTraceAsString() . PHP_EOL;
    }

    // Try a low-level AWS check if available via aws sdk
    try {
        if (class_exists('Aws\\S3\\S3Client')) {
            $s3conf = config('filesystems.disks.s3');
            $client = new Aws\S3\S3Client([
                'version' => '2006-03-01',
                'region' => $s3conf['region'] ?: 'us-east-1',
                'credentials' => [
                    'key' => $s3conf['key'] ?? null,
                    'secret' => $s3conf['secret'] ?? null,
                ],
                'endpoint' => $s3conf['endpoint'] ?: null,
                'use_path_style_endpoint' => $s3conf['use_path_style_endpoint'] ?? false,
            ]);

            try {
                $res = $client->listObjectsV2([ 'Bucket' => $s3conf['bucket'], 'Prefix' => $prefix, 'MaxKeys' => 1 ]);
                echo "LOWLEVEL_LIST succeeded, KeyCount=" . ($res['KeyCount'] ?? 0) . PHP_EOL;
            } catch (Throwable $e) {
                echo "LOWLEVEL_LIST_EXCEPTION: " . get_class($e) . " - " . $e->getMessage() . PHP_EOL;
            }
        } else {
            echo "AWS SDK not available via composer autoload.\n";
        }
    } catch (Throwable $e) {
        echo "AWS SDK CHECK EXCEPTION: " . $e->getMessage() . PHP_EOL;
    }

} catch (Throwable $e) {
    echo "BOOTSTRAP_EXCEPTION: " . $e->getMessage() . PHP_EOL . $e->getTraceAsString() . PHP_EOL;
}
