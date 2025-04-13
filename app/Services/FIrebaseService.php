<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Database;

class FirebaseService
{
    protected $database;

    public function __construct()
    {
        $factory = (new Factory)
            ->withServiceAccount(base_path('storage/firebase/firebase_credentials.json'))
            ->withDatabaseUri('https://social-media-8c5ba-default-rtdb.firebaseio.com/');

        $this->database = $factory->createDatabase();
    }

    public function getDatabase(): Database
    {
        return $this->database;
    }
    
    public function getPosts()
    {
        return $this->database->getReference('posts')->getValue();
    }

    public function createPost($data)
    {
        return $this->database->getReference('posts')->push($data);
    }

}
