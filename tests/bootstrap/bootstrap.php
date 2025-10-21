<?php
// Top-level PHPUnit bootstrap: autoload + minio checks
require __DIR__ . '/../../vendor/autoload.php';

// Load Laravel and run minio-check if present
if (file_exists(__DIR__ . '/minio-check.php')) {
    require __DIR__ . '/minio-check.php';
}

// Keep going: vendor/autoload will be available for tests
return;
