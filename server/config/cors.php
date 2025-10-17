<?php

return [
    'paths' => ['api/*', 'graphql'],
    'allowed_methods' => ['GET', 'POST', 'OPTIONS'],
    'allowed_origins' => [
        'https://assetwise.glue-si.com',
        'https://www.assetwise.glue-si.com',
        'https://9000-firebase-studio-1759465924960.cluster-osvg2nzmmzhzqqjio6oojllbg4.cloudworkstations.dev',
        'http://localhost:9002',
        'http://localhost:9000',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-CSRF-TOKEN',
        'Accept',
    ],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];