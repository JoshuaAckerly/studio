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
        $this->app->singleton(StorageUrlGenerator::class, function ($app) {
            $disk = Storage::disk('s3');
            $cloudfront = config('media.cloudfront_domain') ?: null;
            $expires = (int) config('media.url_expires_minutes', 60);
            return new StorageUrlGenerator($disk, $cloudfront, $expires);
        });

        $this->app->bind(StorageUrlGeneratorInterface::class, StorageUrlGenerator::class);

        $this->app->bind(VideoLogService::class, function ($app) {
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
