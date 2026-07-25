<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use App\Models\User;

class FirebaseAuthController extends Controller
{
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
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
        ]);

        try {
            $role = ($request->email === 'admin@example.com') ? 'admin' : 'user';
            $name = trim($request->first_name . ' ' . $request->last_name);

            $user = User::create([
                'name' => $name,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'middlename' => $request->middlename,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $role,
                'status' => 'active',
            ]);

            Auth::login($user);

            Session::put('firebaseUserId', (string)$user->id);
            Session::put('firebaseUserEmail', $user->email);
            Session::put('firebaseUserRole', $user->role);

            return redirect($user->role === 'admin' ? '/admin' : '/homepage');
        } catch (\Exception $e) {
            return back()->withErrors(['email' => 'Registration failed: ' . $e->getMessage()]);
        }
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            $user = Auth::user();

            if ($user->status === 'banned') {
                Auth::logout();
                return back()->withErrors(['email' => 'Your account has been banned.']);
            }

            Session::put('firebaseUserId', (string)$user->id);
            Session::put('firebaseUserEmail', $user->email);
            Session::put('firebaseUserRole', $user->role);

            if ($user->role === 'admin') {
                return redirect('/admin');
            } else {
                return redirect('/homepage');
            }
        }

        return back()->withErrors(['email' => 'Invalid credentials']);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        Session::forget('firebaseUserId');
        Session::forget('firebaseUserEmail');
        Session::forget('firebaseUserRole');
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    public function notifications()
    {
        return view('Auth.notifications');
    }

    public function messages()
    {
        return view('Auth.messages');
    }

    public function join()
    {
        return view('Auth.join');
    }

    public function create()
    {
        return view('Auth.create');
    }

    public function view()
    {
        return view('Auth.view');
    }
}