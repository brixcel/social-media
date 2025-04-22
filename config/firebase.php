<?php

return [
    'credentials' => env('FIREBASE_CREDENTIALS'),
    
    'database_url' => env('FIREBASE_DATABASE_URL', null),
    'project_id' => env('FIREBASE_PROJECT_ID', null),
    'storage_bucket' => env('FIREBASE_STORAGE_BUCKET', null),
];

