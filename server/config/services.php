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

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'credentials_path' => env('GOOGLE_WORKSPACE_CREDENTIALS_PATH'),
        'admin_email' => env('GOOGLE_WORKSPACE_ADMIN_EMAIL'),
        'domain' => env('GOOGLE_WORKSPACE_DOMAIN'),
        'app_name' => env('GOOGLE_WORKSPACE_APP_NAME', 'AssetWise'),
        'debug_logging' => env('GOOGLE_WORKSPACE_DEBUG_LOGGING', false),
        'app_debug' => env('APP_DEBUG', false),
        'webhook_secret' => env('GOOGLE_WORKSPACE_WEBHOOK_SECRET'),
    ],

];
