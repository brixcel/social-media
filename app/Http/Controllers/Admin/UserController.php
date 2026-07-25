<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class UserController extends Controller
{
    public function index()
    {
        $users = User::all();
        return view('admin.users.index', compact('users'));
    }

    public function banUser($userId)
    {
        try {
            $user = User::findOrFail($userId);
            $user->update([
                'status' => 'banned',
                'banned_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'User banned successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to ban user: ' . $e->getMessage()
            ], 500);
        }
    }

    public function unbanUser($userId)
    {
        try {
            $user = User::findOrFail($userId);
            $user->update([
                'status' => 'active',
                'banned_at' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'User unbanned successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to unban user: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteUser($userId)
    {
        try {
            $user = User::findOrFail($userId);
            $user->posts()->delete();
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user: ' . $e->getMessage()
            ], 500);
        }
    }
}