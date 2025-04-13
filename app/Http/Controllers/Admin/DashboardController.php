<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Kreait\Firebase\Contract\Database;

class DashboardController extends Controller
{
    protected $database;

    /**
     * Create a new controller instance.
     *
     * @param Database $database
     * @return void
     */
    public function __construct(Database $database)
    {
        $this->database = $database;
    }

    /**
     * Display the admin dashboard.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return view('admin.dashboard');
    }
    public function posts()
    {
        return view('admin.posts.index');
    }
    //     try {
    //         // Get posts data
    //         $posts = $this->database->getReference('posts')->getValue() ?: [];
    //         $postsCount = count($posts);
            
    //         // Get pages data
    //         $pages = $this->database->getReference('pages')->getValue() ?: [];
    //         $pagesCount = count($pages);
            
    //         // Get users data
    //         $users = $this->database->getReference('users')->getValue() ?: [];
    //         $usersCount = count($users);
            
    //         // Get recent posts (last 5)
    //         $recentPosts = [];
    //         if (!empty($posts)) {
    //             // Sort posts by created_at timestamp (newest first)
    //             uasort($posts, function($a, $b) {
    //                 return $b['created_at'] <=> $a['created_at'];
    //             });
                
    //             // Get the first 5 posts
    //             $recentPosts = array_slice($posts, 0, 5, true);
    //         }
            
    //         // Get recent pages (last 5)
    //         $recentPages = [];
    //         if (!empty($pages)) {
    //             // Sort pages by created_at timestamp (newest first)
    //             uasort($pages, function($a, $b) {
    //                 return $b['created_at'] <=> $a['created_at'];
    //             });
                
    //             // Get the first 5 pages
    //             $recentPages = array_slice($pages, 0, 5, true);
    //         }
            
    //         return view('admin.dashboard', compact(
    //             'postsCount', 
    //             'pagesCount', 
    //             'usersCount', 
    //             'recentPosts', 
    //             'recentPages'
    //         ));
    //     } catch (\Exception $e) {
    //         // Log the error
    //         \Log::error('Dashboard error: ' . $e->getMessage());
            
    //         // Return the view with error message
    //         return view('admin.dashboard')->with('error', 'Error loading dashboard data: ' . $e->getMessage());
    //     }
}