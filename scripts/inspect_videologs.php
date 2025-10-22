<?php
// scripts/inspect_videologs.php
require __DIR__ . '/../vendor/autoload.php';

// Bootstrap the Laravel application so we can resolve services
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "CONFIG DIAGNOSTICS:\n";
echo "  filesystems.default = " . (config('filesystems.default') ?? 'null') . "\n";
echo "  AWS_BUCKET env = " . (env('AWS_BUCKET') ? env('AWS_BUCKET') : 'null') . "\n";
echo "  app env = " . app()->environment() . "\n\n";

/** @var \App\Services\VideoLogService $svc */
$svc = $app->make(\App\Services\VideoLogService::class);
$items = $svc->list();

foreach ($items as $i => $it) {
    echo "[" . ($i+1) . "] id=" . ($it->id ?? 'n/a') . "\n";
    echo "    title: " . ($it->title ?? '') . "\n";
    echo "    url: " . ($it->url ?? '') . "\n";
    echo "    thumbnail: " . ($it->thumbnail ?? '') . "\n";
    echo "\n";
}

exit(0);
