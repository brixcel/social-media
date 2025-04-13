<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;

class FirebaseAuthentication
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Check if user is logged in via Firebase
        // This depends on how you're storing the Firebase auth state
        if (!Session::has('firebaseUserId')) {
            return redirect()->route('login');
        }

        return $next($request);
    }
}