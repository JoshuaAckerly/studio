<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "ENV VARS:\n";
echo "AWS_BUCKET=" . (getenv('AWS_BUCKET') ?: '(none)') . "\n";
echo "AWS_ENDPOINT=" . (getenv('AWS_ENDPOINT') ?: '(none)') . "\n";
echo "AWS_ACCESS_KEY_ID=" . (getenv('AWS_ACCESS_KEY_ID') ?: '(none)') . "\n";
echo "AWS_SECRET_ACCESS_KEY=" . (getenv('AWS_SECRET_ACCESS_KEY') ?: '(none)') . "\n";
echo "FILESYSTEM_DISK=" . (getenv('FILESYSTEM_DISK') ?: '(none)') . "\n";

echo "\nCONFIG filesystems.disks.s3:\n";
$cfg = config('filesystems.disks.s3');
var_export($cfg);
echo "\n";
