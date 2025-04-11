<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Kreait\Firebase\Factory; // Correct the namespace for the Factory

class FirebaseAuthController extends Controller
{
    protected $auth;

    public function __construct()
    {
        $path = base_path('storage/firebase/firebase.json');

        if (!file_exists($path)) {
            die("This file path {$path} does not exist");
        }

        $this->auth = (new Factory)
            ->withServiceAccount($path)
            ->createAuth();
    }

    public function registerForm()
    {
        return view('Auth.registerform');
    }
    public function loginForm()
    {
        return view('Auth.loginform');
    }
}

