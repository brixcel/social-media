<?php
// app/Http/Middleware/AdminMiddleware.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Kreait\Firebase\Auth;
use Kreait\Firebase\Exception\Auth\RevokedIdToken;
use Kreait\Firebase\Exception\Auth\ExpiredIdToken;
use Illuminate\Support\Facades\Session;

class AdminMiddleware
{
    protected $auth;

    public function __construct()
    {
        $this->auth = app('firebase.auth');
    }

    public function handle(Request $request, Closure $next)
    {
        // Check if user is logged in
        if (!Session::has('firebase_user_id') || !Session::has('firebase_id_token')) {
            return redirect()->route('login')->with('error', 'You must be logged in to access this page');
        }

        try {
            // Verify the token
            $verifiedIdToken = $this->auth->verifyIdToken(Session::get('firebase_id_token'), false);
            $uid = $verifiedIdToken->claims()->get('sub');

            // Check if token UID matches stored UID
            if ($uid !== Session::get('firebase_user_id')) {
                throw new \Exception('User authentication mismatch');
            }

            // Check if user has admin role (implement your admin check logic)
            $user = $this->auth->getUser($uid);
            $customClaims = $user->customClaims;
            
            if (!isset($customClaims['admin']) || $customClaims['admin'] !== true) {
                return redirect('/')->with('error', 'You do not have permission to access admin area');
            }

            return $next($request);
            
        } catch (ExpiredIdToken $e) {
            // Token is expired - we need to refresh it
            Session::forget('firebase_id_token');
            return redirect()->route('login')->with('error', 'Your session has expired. Please login again.');
            
        } catch (RevokedIdToken $e) {
            // Token has been revoked
            Session::forget('firebase_user_id');
            Session::forget('firebase_id_token');
            Session::forget('firebase_user');
            return redirect()->route('login')->with('error', 'Your session has been revoked. Please login again.');
            
        } catch (\Exception $e) {
            Session::forget('firebase_user_id');
            Session::forget('firebase_id_token');
            Session::forget('firebase_user');
            return redirect()->route('login')->with('error', 'Authentication error: ' . $e->getMessage());
        }
    }
}
