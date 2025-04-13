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
    public function homepage()
    {
        return view('Auth.homepage');
    }
    public function register(Request $request)
{
    $request->validate([
        'first_name' => 'required|string|max:255',
        'last_name' => 'required|string|max:255',
        'middlename' => 'required|string|max:255',
        'email' => 'required|email',
        'password' => 'required|min:6',
    ]);

    try {
        $user = $this->auth->createUserWithEmailAndPassword($request->email, $request->password);

        // Get Firebase user data
        $firebaseUser = $this->auth->getUserByEmail($request->email);

        // Hardcoded role check
        $role = ($request->email === 'admin@example.com') ? 'admin' : 'user';

        // Store session
        Session::put('firebaseUserId', $firebaseUser->uid);
        Session::put('firebaseUserEmail', $firebaseUser->email);
        Session::put('firebaseUserRole', $role);

        // Redirect based on role
        return redirect($role === 'admin' ? '/admin' : '/homepage');

    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 400);
    }
}

    public function login(Request $request)
    {
        $email = $request->input('email');
        $password = $request->input('password');
    
        // Authenticate with Firebase
        $firebaseUser = $this->authenticateWithFirebase($email, $password);
    
        if ($firebaseUser) {
            // Store Firebase data in session
            Session::put('firebaseUserId', $firebaseUser['uid']);
            Session::put('firebaseUserEmail', $firebaseUser['email']);
            Session::put('firebaseUserRole', $firebaseUser['role']); // Add this
    
            // Role-based redirect
            if ($firebaseUser['role'] === 'admin') {
                return redirect('/admin');
            } else {
                return redirect('/homepage');
            }
        }
    
        return back()->withErrors(['email' => 'Invalid credentials']);
    }
    

    public function logout(Request $request)
    {
        Session::forget('firebaseUserId');
        Session::forget('firebaseUserEmail');
        
        return redirect()->route('login');
    }
}

