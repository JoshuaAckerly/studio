<?php

return [
    // Prefixes for media locations
    'video_prefix' => env('VIDEO_LOGS_PREFIX', 'video-logs'),
    'image_prefix' => env('VIDEO_IMAGES_PREFIX', 'images/vlogs'),

    // Illustrations
    'illustrations_prefix' => env('ILLUSTRATIONS_PREFIX', 'images/illustrations'),

    // Additional prefixes to try when the primary illustrations prefix yields no results.
    // Useful for buckets that store images at the root or alternate paths.
    'illustrations_fallback_prefixes' => env('ILLUSTRATIONS_FALLBACK_PREFIXES') ? explode(',', env('ILLUSTRATIONS_FALLBACK_PREFIXES')) : ['', 'images'],

    // CloudFront domain for URL rewrites
    'cloudfront_domain' => env('CLOUDFRONT_DOMAIN', null),

    // Default expires (minutes) for temporary URLs
    'url_expires_minutes' => env('VIDEO_URL_EXPIRES', 60),

    // Tolerance in seconds when asserting presigned URL expiry in integration tests
    'url_expiry_tolerance_seconds' => env('VIDEO_URL_EXPIRY_TOLERANCE_SECONDS', 20),
];
