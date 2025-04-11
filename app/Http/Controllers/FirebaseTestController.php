<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\FirebaseService;
use Kreait\Firebase\Factory;
class FirebaseTestController extends Controller
{
    public function index(){
        $path = base_path('storage/firebase/firebase.json');

        if (!file_exists($path)) {
            die("This file path {$path} does not exist");
        }
        try {
            $factory = (new Factory)
                ->withServiceAccount($path)
                ->withDatabaseUri('https://social-media-8c5ba-default-rtdb.firebaseio.com/');
            $database = $factory->createDatabase();
            $reference = $database->getReference('contacts');
            $reference->set(['connection' => true]);
            $snapshot = $reference->getSnapshot();
            $value = $snapshot->getValue();
            return response([
                'message' => true,
                'value' => $value,   
            ]);
        }catch(Exception $e){
            return response([
                'message' => $e->getMessage(),
                'status' => 'false',   
            ]);
    }
}
}