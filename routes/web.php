<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FirebaseTestController;
use App\Http\Controllers\FirebaseAuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PostController;
use App\Http\Controllers\Admin\PageController;
use App\Http\Controllers\VerificationController;
use App\Http\Controllers\Admin\UserController;


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
Route::get('/forums', [FirebaseAuthController::class, 'forums'])->name('forums');
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
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users/{id}/ban', [UserController::class, 'banUser'])->name('users.ban');
    Route::post('/users/{id}/unban', [UserController::class, 'unbanUser'])->name('users.unban');
    Route::delete('/users/{id}', [UserController::class, 'deleteUser'])->name('users.delete');
});
// Public routes
Route::get('/', function() {
    return view('welcome');
});



// Add this route for handling post creation from homepage
Route::post('/create-post', [PostController::class, 'storeFromHomepage'])->name('posts.storeFromHomepage');