<?php
// Top-level PHPUnit bootstrap: autoload + minio checks
require __DIR__ . '/../../vendor/autoload.php';

// Load Laravel and run minio-check if present
if (file_exists(__DIR__ . '/minio-check.php')) {
    require __DIR__ . '/minio-check.php';
}

// Capture the initial global error/exception handlers that PHPUnit (or the
// runtime) installed before tests run. We'll use these as the canonical handlers
// to reinstall if tests or framework code clear handlers during execution.
$prev = set_error_handler(function () {});
restore_error_handler();
$GLOBALS['__phpunit_initial_error_handler'] = $prev;

$prevEx = set_exception_handler(function () {});
restore_exception_handler();
$GLOBALS['__phpunit_initial_exception_handler'] = $prevEx;

// Keep going: vendor/autoload will be available for tests
return;
