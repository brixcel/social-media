<?php


namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\FirebaseService;

class UserController extends Controller
{
    protected $firebase;

    public function __construct(FirebaseService $firebase)
    {
        $this->firebase = $firebase;
    }

    public function index()
    {
        return view('admin.users.index');
    }

    public function banUser($userId)
    {
        try {
            $this->firebase->updateData("users/{$userId}", [
                'status' => 'banned',
                'bannedAt' => time(),
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
            $this->firebase->updateData("users/{$userId}", [
                'status' => 'active',
                'bannedAt' => null,
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
            // Delete user data from Firebase
            $this->firebase->deleteData("users/{$userId}");
            
            // Delete user's posts
            $this->firebase->deleteData("posts/{$userId}");
            
            // Delete user's comments
            $this->firebase->deleteData("comments/{$userId}");

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