<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Email subscribers about any published post that hasn't been sent yet — catches
// posts added via migration/seeder/admin with no extra manual step required.
Schedule::command('app:send-pending-newsletters')->everyTenMinutes()->withoutOverlapping();

// Discover new posts from each platform's API (dedups by platform ID — safe to re-run)
// tiktok:sync-posts is intentionally NOT scheduled — TIKTOK_ACCESS_TOKEN isn't configured,
// new TikTok posts must be added manually via tiktok:fetch-thumbnails --import (see tiktok-post-urls.md)
Schedule::command('facebook:sync-posts')->weeklyOn(0, '00:00');
Schedule::command('instagram:sync-posts')->weeklyOn(0, '00:00');

// Re-fetch any thumbnails not yet cached to S3 (catches new videos or failed uploads)
Schedule::command('tiktok:fetch-thumbnails')->weeklyOn(0, '00:10');
Schedule::command('gallery:fetch-thumbnails')->weeklyOn(0, '00:10');
Schedule::command('instagram:cache-thumbnails')->weeklyOn(0, '00:10');

// Regenerate sitemap weekly so new blog posts are picked up automatically
Schedule::command('app:generate-sitemap')->weekly();
