<?php
// scripts/print_env.php
// Diagnostic helper: loads .env the same way the aws_to_minio_copy script does
// and prints the raw bytes and JSON for AWS_DEFAULT_REGION and masked keys.

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

$basePath = realpath(__DIR__ . DIRECTORY_SEPARATOR . '..');
if ($basePath && file_exists($basePath . DIRECTORY_SEPARATOR . '.env')) {
    try {
        Dotenv::createImmutable($basePath)->safeLoad();
    } catch (Exception $e) {
        // ignore
    }
}

$region = getenv('AWS_DEFAULT_REGION');
$ak = getenv('AWS_ACCESS_KEY_ID');
$sk = getenv('AWS_SECRET_ACCESS_KEY');

echo "AWS_DEFAULT_REGION raw info:\n";
if ($region === false) {
    echo "(not set)\n";
} else {
    echo 'LEN=' . strlen($region) . PHP_EOL;
    echo 'JSON=' . json_encode($region) . PHP_EOL;
    echo 'BYTES=';
    for ($i = 0; $i < strlen($region); $i++) {
        echo ord($region[$i]) . ',';
    }
    echo PHP_EOL;
}

// Mask credentials for safety
function mask($s) {
    if ($s === false) return '(not set)';
    $len = strlen($s);
    if ($len <= 8) return str_repeat('*', $len);
    return substr($s, 0, 4) . str_repeat('*', max(0, $len - 8)) . substr($s, -4);
}

echo PHP_EOL;
echo "AWS_ACCESS_KEY_ID=" . mask($ak) . PHP_EOL;
echo "AWS_SECRET_ACCESS_KEY=" . mask($sk) . PHP_EOL;

return 0;
