<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google_analytics' => [
        'tracking_id' => env('GOOGLE_ANALYTICS_TRACKING_ID'),
    ],

    'google_adsense' => [
        'client_id' => env('GOOGLE_ADSENSE_CLIENT_ID'),
    ],

    'auth_system' => [
        'url' => env('AUTH_SYSTEM_URL', 'http://auth-system.local/api'),
    ],

    'authsystem' => [
        'track_url' => env('AUTHSYSTEM_TRACK_URL'),
        'track_token' => env('AUTHSYSTEM_TRACK_TOKEN'),
    ],

    'tiktok' => [
        'username' => env('TIKTOK_USERNAME', 'graveyardjokes'),
        'access_token' => env('TIKTOK_ACCESS_TOKEN'),
    ],

    'facebook' => [
        'app_access_token' => env('FACEBOOK_APP_ACCESS_TOKEN'),
        'user_access_token' => env('FACEBOOK_USER_ACCESS_TOKEN'),
        'page_id' => env('FACEBOOK_PAGE_ID'),
        'page_access_token' => env('FACEBOOK_PAGE_ACCESS_TOKEN'),
    ],

    'discord' => [
        'bot_token' => env('DISCORD_BOT_TOKEN'),
        'channel_id' => env('DISCORD_CHANNEL_ID'),
    ],

    'instagram' => [
        'user_id' => env('INSTAGRAM_USER_ID'),
        'access_token' => env('INSTAGRAM_ACCESS_TOKEN'),
    ],

];
