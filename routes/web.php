<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FirebaseTestController;
use App\Http\Controllers\FirebaseAuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PostController;
use App\Http\Controllers\Admin\PageController;

// Auth routes
Route::get('/register', [FirebaseAuthController::class, 'registerForm']);
Route::get('/admin-register', [FirebaseAuthController::class, 'AdminRegistration']);
Route::get('/login', [FirebaseAuthController::class, 'loginForm'])->name('login');
Route::post('/login', [FirebaseAuthController::class, 'login'])->name('login.process');
Route::get('/homepage', [FirebaseAuthController::class, 'homepage']);
Route::post('/logout', [FirebaseAuthController::class, 'logout'])->name('logout');
Route::get('/admin', [DashboardController::class, 'index']);
Route::get('/admin/dashboard', [DashboardController::class, 'dashboard']);

// Admin routes with proper middleware
// Route::middleware(['admin'])->prefix('admin')->group(function () {
//     Route::get('/', [DashboardController::class, 'index'])->name('admin.dashboard');
//     Route::resource('posts', PostController::class);
//     Route::resource('pages', PageController::class);
// });
// post routes


Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/posts', [PostController::class, 'index'])->name('posts.index');
    Route::get('/posts/create', [PostController::class, 'create'])->name('posts.create');
    Route::post('/posts', [PostController::class, 'store'])->name('posts.store');
    Route::get('/posts/{id}/edit', [PostController::class, 'edit'])->name('posts.edit');
    Route::put('/posts/{id}', [PostController::class, 'update'])->name('posts.update');
    Route::delete('/posts/{id}', [PostController::class, 'destroy'])->name('posts.destroy');
});
// Public routes
Route::get('/', function() {
    return view('welcome');
});