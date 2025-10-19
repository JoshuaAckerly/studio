<?php
// Temporary diagnostic script — bootstraps Laravel and prints IllustrationService->list() and key config
require __DIR__ . '/vendor/autoload.php';

try {
    $app = require __DIR__ . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    $service = new App\Services\IllustrationService();
    $list = $service->list();

    $out = [
        'timestamp' => date('c'),
        'count' => count($list),
        'data' => $list,
        'filesystems_default' => config('filesystems.default'),
        'illustrations_prefix' => config('media.illustrations_prefix'),
        's3_config' => config('filesystems.disks.s3'),
    ];

    echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    echo "EXCEPTION: " . $e->getMessage() . PHP_EOL . $e;
}
