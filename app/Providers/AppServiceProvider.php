<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\VideoLogService;
use App\Services\StorageUrlGenerator;
use App\Contracts\StorageUrlGeneratorInterface;
use Illuminate\Support\Facades\Storage;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind concrete services so they can be type-hinted in controllers and swapped in tests
        // Bind a StorageUrlGenerator so services can request canonical URLs for storage paths
        // Bind StorageUrlGenerator lazily to avoid constructing the S3 client at container
        // registration time. Some CI/test runs intentionally do not set AWS envs or start
        // MinIO, and eagerly creating the S3 disk would cause runtime exceptions.
        $this->app->singleton(StorageUrlGenerator::class, function ($app) {
            return function () use ($app) {
                $disk = Storage::disk('s3');
                $cloudfront = config('media.cloudfront_domain') ?: null;
                $expires = (int) config('media.url_expires_minutes', 60);
                return new StorageUrlGenerator($disk, $cloudfront, $expires);
            };
        });

        // Bind the interface to the concrete implementation for easier substitution
        // Bind the interface to the concrete implementation. Because we bound the
        // StorageUrlGenerator as a lazy factory above (it returns a closure that
        // constructs the generator), we need to adapt the VideoLogService binding
        // to resolve the generator lazily as well.
        $this->app->bind(StorageUrlGeneratorInterface::class, function ($app) {
            $factory = $app->make(StorageUrlGenerator::class);
            // If the factory returns a closure, call it to get the actual instance
            if (is_callable($factory)) {
                return $factory();
            }
            return $factory;
        });

        $this->app->bind(VideoLogService::class, function ($app) {
            // Defer resolving the S3 disk until the service is actually instantiated
            $generator = $app->make(StorageUrlGeneratorInterface::class);
            return new VideoLogService(Storage::disk('s3'), $generator);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
