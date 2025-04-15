<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FirebaseTestController;
use App\Http\Controllers\FirebaseAuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PostController;
use App\Http\Controllers\Admin\PageController;

// Auth routes
Route::get('/register', [FirebaseAuthController::class, 'registerForm']);
Route::get('/login', [FirebaseAuthController::class, 'loginForm'])->name('login');

Route::get('/homepage', [FirebaseAuthController::class, 'homepage']);
Route::post('/logout', [FirebaseAuthController::class, 'logout'])->name('logout');
Route::get('/admin', [DashboardController::class, 'index'])->name('admin.dashboard');
Route::get('/admin/posts', [PostController::class, 'index'])->name('posts.index');
Route::get('/admin/pages', [PageController::class, 'index'])->name('pages.index');
// Admin routes
// Route::middleware(['auth'])->prefix('admin')->group(function () {
//     Route::get('/', [DashboardController::class, 'index'])->name('admin.dashboard');
//     Route::resource('posts', PostController::class);
//     Route::resource('pages', PageController::class);
//     // Add more resource routes as needed
//     // Route::middleware('admin')->group(function () {
//     //     Route::get('/admin', [DashboardController::class, 'index'])->name('admin.dashboard');
//     // });
//     // Route::middleware('admin')->group(function () {
//     //     Route::get('/admin', [DashboardController::class, 'index'])->name('admin.dashboard');
//     // });
// });
