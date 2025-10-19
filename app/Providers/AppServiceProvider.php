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
        $this->app->singleton(StorageUrlGenerator::class, function ($app) {
            $disk = Storage::disk('s3');
            $cloudfront = config('media.cloudfront_domain') ?: null;
            $expires = (int) config('media.url_expires_minutes', 60);
            return new StorageUrlGenerator($disk, $cloudfront, $expires);
        });

        // Bind the interface to the concrete implementation for easier substitution
        $this->app->bind(StorageUrlGeneratorInterface::class, StorageUrlGenerator::class);

        $this->app->bind(VideoLogService::class, function ($app) {
            // Resolve the URL generator from the container to inject into the service
            $generator = $app->make(StorageUrlGenerator::class);
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
