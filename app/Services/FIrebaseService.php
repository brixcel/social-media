<?php
namespace App\Services;

use Kreait\Firebase\Factory;

class FirebaseService
{
    protected $firebase;
    protected $database;
    
    public function __construct()
    {
        $credentialsPath = storage_path('firebase/firebase_credentials.json');
        
        if (!file_exists($credentialsPath)) {
            throw new \Exception('Firebase credentials file not found.');
        }
        
        $this->database = (new Factory)
            ->withServiceAccount($credentialsPath)
            ->withDatabaseUri(config('firebase.database_url'))
            ->createDatabase();
    }
    public function getDatabase()
    {
        return $this->database;
    }
    
    public function getReference($path)
    {
        return $this->database->getReference($path);
    }
    
    public function getData($path)
    {
        return $this->getReference($path)->getValue();
    }
    
    public function saveData($path, $data)
    {
        $this->getReference($path)->set($data);
        return $data;
    }
    
    public function pushData($path, $data)
    {
        $reference = $this->getReference($path)->push($data);
        return $reference->getKey();
    }
    
    public function updateData($path, $data)
    {
        $this->getReference($path)->update($data);
        return $data;
    }
    
    public function deleteData($path)
    {
        $this->getReference($path)->remove();
        return true;
    }
}
