<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Post;
use App\Models\Page;
use App\Models\User;

class DashboardController extends Controller
{
    public function index()
    {
        return view('layouts.admin');
    }

    public function dashboard()
    {
        try {
            $postsCount = Post::count();
            $pagesCount = Page::count();
            $usersCount = User::count();

            $recentPostsCollection = Post::orderBy('created_at', 'desc')->take(5)->get();
            $recentPosts = [];
            foreach ($recentPostsCollection as $p) {
                $recentPosts[$p->id] = [
                    'content' => $p->content,
                    'created_at' => $p->created_at ? $p->created_at->timestamp : time(),
                ];
            }

            $recentPagesCollection = Page::orderBy('created_at', 'desc')->take(5)->get();
            $recentPages = [];
            foreach ($recentPagesCollection as $p) {
                $recentPages[$p->id] = [
                    'title' => $p->title,
                    'created_at' => $p->created_at ? $p->created_at->timestamp : time(),
                ];
            }

            return view('admin.dashboard', compact(
                'postsCount', 
                'pagesCount', 
                'usersCount', 
                'recentPosts', 
                'recentPages'
            ));
        } catch (\Exception $e) {
            \Log::error('Dashboard error: ' . $e->getMessage());

            return view('admin.dashboard')->with('error', 'Error loading dashboard data: ' . $e->getMessage());
        }
    }
}