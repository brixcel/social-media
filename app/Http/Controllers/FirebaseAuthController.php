<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Kreait\Firebase\Factory; // Correct the namespace for the Factory

use Illuminate\Support\Facades\Session;
class FirebaseAuthController extends Controller
{
    protected $auth;

    public function __construct()
    {
        $path = base_path('storage/firebase/firebase_credentials.json');

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
    public function AdminRegistration()
    {
        return view('Auth.AdminRegistration');
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

        $role = ($request->email === 'admin@example.com') ? 'admin' : 'user';

        if ($role === 'admin') {
            // Save to 'admins' node
            $this->saveAdminData($firebaseUser->uid, $request->email);
        }

        // Store user data in Firestore under 'users' collection
        $this->saveUserData($firebaseUser->uid, [
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'middlename' => $request->middlename,
            'email' => $request->email,
            'role' => $role, // Include the role here
        ]);
        Session::put('firebaseUserId', $firebaseUser->uid);
        Session::put('firebaseUserEmail', $firebaseUser->email);
        Session::put('firebaseUserRole', $role);

        // Redirect based on role
        return redirect($role === 'admin' ? '/admin' : '/homepage');

    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 400);
    }
}

protected function saveAdminData($uid, $email)
{
    $database = (new Factory)
        ->withServiceAccount(base_path('storage/firebase/firebase.json'))
        ->createDatabase();

    $adminsRef = $database->getReference('admins');
    $adminsRef->getChild($uid)->set([
        'email' => $email,
    ]);
}

protected function saveUserData($uid, $data)
{
    $database = (new Factory)
        ->withServiceAccount(base_path('storage/firebase/firebase.json'))
        ->createDatabase();

    $usersRef = $database->getReference('users');
    $usersRef->getChild($uid)->set($data);
}

public function notifications()
{
    // Just return the notifications Blade view.
    return view('Auth.notifications');
}
public function messages()
{
    // Just return the messages Blade view.
    return view('Auth.messages'); // Corrected the view name here
}

public function join()
{
    return view('Auth.join'); // Blade file: resources/views/forums/join.blade.php
}

public function create()
{
    return view('Auth.create'); // Blade file: resources/views/forums/join.blade.php
}

public function view()
{
    return view('Auth.view'); // Blade file: resources/views/forums/join.blade.php
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
    private function authenticateWithFirebase($email, $password)
    {
        try {
            $signInResult = $this->auth->signInWithEmailAndPassword($email, $password);
            $user = $signInResult->data();

            // Fetch additional user data from Firestore (including role)
            $database = (new Factory)
                ->withServiceAccount(base_path('storage/firebase/firebase.json'))
                ->createDatabase();

            $userRef = $database->getReference('users/' . $user['localId']);
            $snapshot = $userRef->getSnapshot();
            $userData = $snapshot->getValue();

            return [
                'uid' => $user['localId'],
                'email' => $email,
                'role' => $userData['role'] ?? 'user', // Default to 'user' if role is not found
            ];
        } catch (\Kreait\Firebase\Exception\Auth\InvalidUserCredentials $e) {
            return null;
        }
    }



}