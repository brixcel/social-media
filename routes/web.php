<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FirebaseTestController;
use App\Http\Controllers\FirebaseAuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PostController;
use App\Http\Controllers\Admin\PageController;
use App\Http\Controllers\VerificationController;


// Auth routes
Route::get('/register', [FirebaseAuthController::class, 'registerForm']);
Route::get('/admin-register', [FirebaseAuthController::class, 'AdminRegistration']);
Route::get('/login', [FirebaseAuthController::class, 'loginForm'])->name('login');
Route::post('/login', [FirebaseAuthController::class, 'login'])->name('login.process');
Route::get('/homepage', [FirebaseAuthController::class, 'homepage']);
Route::post('/logout', [FirebaseAuthController::class, 'logout'])->name('logout');
Route::get('/admin', [DashboardController::class, 'index']);
Route::get('/admin/dashboard', [DashboardController::class, 'dashboard'])->name('admin.dashboard');
Route::get('/notifications', [FirebaseAuthController::class, 'notifications'])->name('notifications');
Route::get('/messages', [FirebaseAuthController::class, 'messages'])->name('messages');
Route::get('/join', [FirebaseAuthController::class, 'join'])->name('join');
Route::get('/create', [FirebaseAuthController::class, 'create'])->name('create');
Route::get('/view', [FirebaseAuthController::class, 'view'])->name('view');
Route::get('/homepage', [FirebaseAuthController::class, 'homepage'])->name('homepage');

// Admin routes with proper middleware
// Route::middleware(['admin'])->prefix('admin')->group(function () {
//     Route::get('/', [DashboardController::class, 'index'])->name('admin.dashboard');
//     Route::resource('posts', PostController::class);
//     Route::resource('pages', PageController::class);
// });
// post routes


Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/posts', [PostController::class, 'index'])->name('posts');
    Route::get('/pages', [PageController::class, 'index'])->name('pages');
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



// Add this route for handling post creation from homepage
Route::post('/create-post', [PostController::class, 'storeFromHomepage'])->name('posts.storeFromHomepage');