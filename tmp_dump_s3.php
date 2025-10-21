<?php
// tmp_dump_s3.php - dump the runtime filesystems.s3 config for debugging
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$config = config('filesystems.disks.s3');
file_put_contents(__DIR__ . '/s3config.json', json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo "WROTE s3config.json\n";
var_export($config);
echo "\n";
