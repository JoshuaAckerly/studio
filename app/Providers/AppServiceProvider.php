<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\VideoLogService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind concrete services so they can be type-hinted in controllers and swapped in tests
        $this->app->bind(VideoLogService::class, function ($app) {
            // Allow Laravel's container to resolve dependencies; provide the s3 disk by default
            return new VideoLogService();
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
