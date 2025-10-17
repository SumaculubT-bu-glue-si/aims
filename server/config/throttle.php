<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting Configuration
    |--------------------------------------------------------------------------
    |
    | Configure rate limiting for different types of requests to prevent abuse
    | and ensure fair usage of your API resources.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | GraphQL Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Rate limiting for GraphQL endpoints to prevent expensive query abuse.
    | Format: 'throttle:max_attempts,decay_minutes'
    |
    */

    'graphql' => [
        // General GraphQL queries - 60 requests per minute
        'general' => env('GRAPHQL_THROTTLE_GENERAL', '60,1'),

        // Authenticated users - 120 requests per minute
        'authenticated' => env('GRAPHQL_THROTTLE_AUTHENTICATED', '120,1'),

        // Admin users - 300 requests per minute
        'admin' => env('GRAPHQL_THROTTLE_ADMIN', '300,1'),

        // Development - higher limits for testing
        'development' => env('GRAPHQL_THROTTLE_DEVELOPMENT', '1000,1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | API Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Rate limiting for REST API endpoints.
    |
    */

    'api' => [
        // General API requests - 100 requests per minute
        'general' => env('API_THROTTLE_GENERAL', '100,1'),

        // Authenticated API requests - 200 requests per minute
        'authenticated' => env('API_THROTTLE_AUTHENTICATED', '200,1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Special Endpoints
    |--------------------------------------------------------------------------
    |
    | Rate limiting for specific high-risk endpoints.
    |
    */

    'special' => [
        // Login attempts - 5 attempts per minute
        'login' => env('THROTTLE_LOGIN', '5,1'),

        // Password reset - 3 attempts per minute
        'password_reset' => env('THROTTLE_PASSWORD_RESET', '3,1'),

        // Email sending - 10 emails per minute
        'email' => env('THROTTLE_EMAIL', '10,1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Environment-Based Configuration
    |--------------------------------------------------------------------------
    |
    | Different rate limits for different environments.
    |
    */

    'environments' => [
        'local' => [
            'graphql' => '1000,1',  // 1000 requests per minute in local
            'api' => '2000,1',      // 2000 requests per minute in local
        ],
        'staging' => [
            'graphql' => '200,1',    // 200 requests per minute in staging
            'api' => '500,1',       // 500 requests per minute in staging
        ],
        'production' => [
            'graphql' => '60,1',     // 60 requests per minute in production
            'api' => '100,1',       // 100 requests per minute in production
        ],
    ],

];