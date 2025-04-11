<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FirebaseTestController;
use App\Http\Controllers\FirebaseAuthController;
// Route::get('firebase', [FirebaseTestController::class, 'index']);

// Route::get('/', function () {
//     return view('welcome');
// });
Route::get('/register', [FirebaseAuthController::class, 'registerForm']);
Route::get('/login', [FirebaseAuthController::class, 'loginForm']);