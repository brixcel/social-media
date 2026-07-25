<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Post;

class ProfileController extends Controller
{
    public function index()
    {
        $userModel = Auth::user();
        $userId = $userModel ? $userModel->id : Session::get('firebaseUserId');

        if ($userId && !$userModel) {
            $userModel = User::find($userId);
        }

        $userData = [];
        $posts = [];

        if ($userModel) {
            $userData = [
                'firstName' => $userModel->first_name ?? $userModel->name,
                'lastName' => $userModel->last_name ?? '',
                'email' => $userModel->email,
                'bio' => '',
                'profileImageUrl' => null,
            ];

            $postsCollection = Post::where('user_id', $userModel->id)->orderBy('created_at', 'desc')->get();
            foreach ($postsCollection as $p) {
                $posts[$p->id] = [
                    'id' => $p->id,
                    'content' => $p->content,
                    'mediaURL' => $p->mediaURL,
                    'timestamp' => $p->created_at ? $p->created_at->timestamp : time(),
                ];
            }
        }

        return view('Auth.profile', [
            'user' => $userData,
            'userId' => $userId,
            'posts' => $posts
        ]);
    }

    public function update(Request $request)
    {
        try {
            $validated = $request->validate([
                'firstName' => 'required|string|max:255',
                'lastName' => 'required|string|max:255',
                'bio' => 'nullable|string|max:1000',
            ]);

            $user = Auth::user();
            if ($user) {
                $user->update([
                    'first_name' => $validated['firstName'],
                    'last_name' => $validated['lastName'],
                    'name' => trim($validated['firstName'] . ' ' . $validated['lastName']),
                ]);
            }

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
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        $request->validate([
            'image' => 'required|image|max:2048',
        ]);

        try {
            $image = $request->file('image');
            $filename = time() . '_' . $user->id . '.' . $image->getClientOriginalExtension();
            $path = $image->storeAs('profile_images', $filename, 'public');
            $imageUrl = asset('storage/' . $path);

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