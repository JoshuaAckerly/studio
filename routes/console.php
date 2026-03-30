<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Re-fetch any thumbnails not yet cached to S3 (catches new videos or failed uploads)
Schedule::command('tiktok:fetch-thumbnails')->weekly();
