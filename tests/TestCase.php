<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    /**
     * Backup of the previous error/exception handlers to restore after each test.
     * @var callable|null
     */
    private $prevErrorHandler = null;
    private $prevExceptionHandler = null;
    // Diagnostic capture fields
    private $diagPrevError = null;
    private $diagPrevException = null;

    protected function setUp(): void
    {
        // First run the framework/test harness setup so any framework handlers are
        // installed. Then capture the current handlers so we can restore to the
        // same runtime state after the test.
        parent::setUp();

        // Use set_*/restore_* pair to capture the active handler without leaving
        // our temporary handler installed.
        $prev = set_error_handler(function () {});
        restore_error_handler();
        $this->prevErrorHandler = $prev;

        $prevEx = set_exception_handler(function () {});
        restore_exception_handler();
        $this->prevExceptionHandler = $prevEx;

        // Prevent Laravel from aggressively flushing global handlers during
        // the application teardown: register a callback that clears the
        // internal HandleExceptions::$app so flushHandlersState() returns
        // early (see HandleExceptions::flushState()). This is localized to
        // tests and avoids modifying vendor files.
        if (method_exists($this, 'beforeApplicationDestroyed')) {
            $this->beforeApplicationDestroyed(function () {
                try {
                    \Illuminate\Foundation\Bootstrap\HandleExceptions::forgetApp();
                } catch (\Throwable $e) {
                    // ignore
                }
            });
        }

        // If diagnostics enabled, capture pre-test handlers for logging
        if (getenv('HANDLER_DIAG')) {
            $this->diagPrevError = set_error_handler(function () {});
            restore_error_handler();
            $this->diagPrevException = set_exception_handler(function () {});
            restore_exception_handler();
        }
    }

    protected function tearDown(): void
    {
        // Capture post-test handlers for diagnostics BEFORE we restore them so we can
        // log what changed, but don't call parent::tearDown until we've restored
        // the original handlers — PHPUnit performs its own checks in parent::tearDown
        // and will mark tests risky if handlers are changed when it runs.
        $postError = null;
        $postEx = null;
        if (getenv('HANDLER_DIAG')) {
            $postError = set_error_handler(function () {});
            restore_error_handler();
            $postEx = set_exception_handler(function () {});
            restore_exception_handler();
        }

        // Restore previous error handler BEFORE calling parent::tearDown so PHPUnit
        // sees the pre-test handlers and does not mark the test risky.
        try {
            if ($this->prevErrorHandler === null) {
                // No previous handler -> remove any current handler
                restore_error_handler();
            } else {
                set_error_handler($this->prevErrorHandler);
            }
        } catch (\Throwable $e) {
            // ignore
        }

        // Restore previous exception handler
        try {
            if ($this->prevExceptionHandler === null) {
                restore_exception_handler();
            } else {
                set_exception_handler($this->prevExceptionHandler);
            }
        } catch (\Throwable $e) {
            // ignore
        }

        // Defensive check: if the runtime currently has no handlers (NULL), and
        // we previously captured handlers, re-install them so PHPUnit's internal
        // checks will observe the expected handlers.
        try {
            $curError = set_error_handler(function () {});
            restore_error_handler();
            if ($curError === null && $this->prevErrorHandler !== null) {
                set_error_handler($this->prevErrorHandler);
            }
        } catch (\Throwable $e) {
            // ignore
        }

        try {
            $curEx = set_exception_handler(function () {});
            restore_exception_handler();
            if ($curEx === null && $this->prevExceptionHandler !== null) {
                set_exception_handler($this->prevExceptionHandler);
            }
        } catch (\Throwable $e) {
            // ignore
        }

        // Now call parent::tearDown which will run PHPUnit's internal checks.
        // Defensive reinstall: ensure handlers are present *right before* PHPUnit's
        // internal checks in parent::tearDown(). If a handler was cleared later in
        // the test lifecycle this makes sure PHPUnit observes the expected state.
        try {
            $curError = set_error_handler(function () {});
            restore_error_handler();
            if ($curError === null && $this->prevErrorHandler !== null) {
                set_error_handler($this->prevErrorHandler);
                if (getenv('HANDLER_DIAG')) {
                    $bt = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 50);
                    @file_put_contents(base_path('artifacts/handler-reinstall.log'), "Reinstalled error handler for " . static::class . "\nBacktrace:\n" . print_r($bt, true) . "\n", FILE_APPEND);
                }
            }

            $curEx = set_exception_handler(function () {});
            restore_exception_handler();
            if ($curEx === null && $this->prevExceptionHandler !== null) {
                set_exception_handler($this->prevExceptionHandler);
                if (getenv('HANDLER_DIAG')) {
                    $bt = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 50);
                    @file_put_contents(base_path('artifacts/handler-reinstall.log'), "Reinstalled exception handler for " . static::class . "\nBacktrace:\n" . print_r($bt, true) . "\n", FILE_APPEND);
                }
            }
        } catch (\Throwable $e) {
            // ignore any issues with diagnostic logging
        }

        // If the above per-test reinstall didn't catch the cleared handlers,
        // fall back to the handlers captured at bootstrap time (PHPUnit's
        // initial handlers). This helps if some framework code clears the
        // handler stack after our per-test capture.
        try {
            $initialError = $GLOBALS['__phpunit_initial_error_handler'] ?? null;
            $initialEx = $GLOBALS['__phpunit_initial_exception_handler'] ?? null;

            $curError = set_error_handler(function () {});
            restore_error_handler();
            if ($curError === null && $initialError !== null) {
                set_error_handler($initialError);
                if (getenv('HANDLER_DIAG')) {
                    @file_put_contents(base_path('artifacts/handler-reinstall.log'), "Reinstalled initial error handler for " . static::class . "\n", FILE_APPEND);
                }
            }

            $curEx = set_exception_handler(function () {});
            restore_exception_handler();
            if ($curEx === null && $initialEx !== null) {
                set_exception_handler($initialEx);
                if (getenv('HANDLER_DIAG')) {
                    @file_put_contents(base_path('artifacts/handler-reinstall.log'), "Reinstalled initial exception handler for " . static::class . "\n", FILE_APPEND);
                }
            }
        } catch (\Throwable $e) {
            // ignore
        }

        parent::tearDown();

        // If diagnostics enabled, compare and log any differences we observed.
        if (getenv('HANDLER_DIAG')) {
            $changed = false;
            $testMethod = '(unknown)';
            $bt = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 10);
            foreach ($bt as $frame) {
                if (isset($frame['class']) && $frame['class'] === static::class && isset($frame['function'])) {
                    $testMethod = $frame['function'];
                    break;
                }
            }
            $msg = "Test: " . static::class . '::' . $testMethod . "\n";
            if ($this->diagPrevError !== $postError) {
                $changed = true;
                $msg .= "  Error handler changed:\n    before: " . var_export($this->diagPrevError, true) . "\n    after:  " . var_export($postError, true) . "\n";
            }
            if ($this->diagPrevException !== $postEx) {
                $changed = true;
                $msg .= "  Exception handler changed:\n    before: " . var_export($this->diagPrevException, true) . "\n    after:  " . var_export($postEx, true) . "\n";
            }

            if ($changed) {
                @mkdir(base_path('artifacts'), 0777, true);
                @file_put_contents(base_path('artifacts/handler-diag.log'), $msg . "\n", FILE_APPEND);
            }
        }
    }
}
