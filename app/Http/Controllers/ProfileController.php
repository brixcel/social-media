<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Kreait\Firebase\Factory;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Http;

class ProfileController extends Controller
{
    protected $auth;
    protected $database;

    public function __construct()
    {
        $path = base_path('storage/firebase/firebase_credentials.json');

        if (!file_exists($path)) {
            die("This file path {$path} does not exist");
        }

        $factory = (new Factory)->withServiceAccount($path);
        $this->auth = $factory->createAuth();
        $this->database = $factory->createDatabase();
    }

    public function index()
    {
        // Get user ID from session if available
        $userId = Session::get('firebaseUserId');
        $userData = [];
        $posts = [];
        
        // If we have a userId, fetch the data
        if ($userId) {
            // Get user data from Firebase
            $userRef = $this->database->getReference('users/' . $userId);
            $userData = $userRef->getValue() ?: [];

            // Get user's posts
            $postsRef = $this->database->getReference('posts');
            $postsSnapshot = $postsRef->orderByChild('userId')->equalTo($userId)->getSnapshot();
            $posts = $postsSnapshot->getValue() ?: [];

            // Sort posts by timestamp (newest first)
            if (!empty($posts)) {
                uasort($posts, function($a, $b) {
                    return $b['timestamp'] <=> $a['timestamp'];
                });
            }
        }

        // Always return the view - let JavaScript handle authentication
        return view('Auth.profile', [
            'user' => $userData,
            'userId' => $userId,
            'posts' => $posts
        ]);
    }

    public function update(Request $request)
    {
        try {
            // Validate the request
            $validated = $request->validate([
                'firstName' => 'required|string|max:255',
                'lastName' => 'required|string|max:255',
                'bio' => 'nullable|string|max:1000',
                'userId' => 'required|string'
            ]);

            // Update user data in Firebase
            $userRef = $this->database->getReference('users/' . $validated['userId']);
            
            $updates = [
                'firstName' => $validated['firstName'],
                'lastName' => $validated['lastName'],
                'bio' => $validated['bio'] ?? '',
                'updatedAt' => ['.sv' => 'timestamp'] // Server timestamp
            ];

            $userRef->update($updates);

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error('Profile update error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating your profile: ' . $e->getMessage()
            ], 500);
        }
    }

    public function uploadImage(Request $request)
    {
        $userId = Session::get('firebaseUserId');
        if (!$userId) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        $request->validate([
            'image' => 'required|image|max:2048',
        ]);

        try {
            // Get the image file
            $image = $request->file('image');
            
            // Generate a unique filename
            $filename = time() . '_' . $userId . '.' . $image->getClientOriginalExtension();
            
            // Store the image in the public storage
            $path = $image->storeAs('profile_images', $filename, 'public');
            
            // Generate the URL for the stored image
            $imageUrl = asset('storage/' . $path);
            
            // Update profile image URL in Firebase
            $userRef = $this->database->getReference('users/' . $userId);
            $userRef->update([
                'profileImageUrl' => $imageUrl
            ]);

            return response()->json([
                'success' => true, 
                'message' => 'Profile image updated successfully',
                'imageUrl' => $imageUrl
            ]);
        } catch (\Exception $e) {
            \Log::error('Profile image upload error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while uploading your profile image: ' . $e->getMessage()
            ], 500);
        }
    }
}