<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class PostController extends Controller
{
    public function index()
    {
        try {
            $postsCollection = Post::with('user')->orderBy('created_at', 'desc')->get();
            $posts = [];

            foreach ($postsCollection as $postModel) {
                $posts[$postModel->id] = [
                    'id' => $postModel->id,
                    'content' => $postModel->content,
                    'mediaURL' => $postModel->mediaURL,
                    'mediaType' => $postModel->mediaType,
                    'mediaName' => $postModel->mediaName,
                    'mediaSize' => $postModel->mediaSize,
                    'timestamp' => $postModel->created_at ? $postModel->created_at->timestamp : time(),
                    'userId' => $postModel->user_id,
                    'likes' => $postModel->likes ?? [],
                    'userData' => $postModel->user ? [
                        'first_name' => $postModel->user->first_name ?? $postModel->user->name,
                        'last_name' => $postModel->user->last_name ?? '',
                        'email' => $postModel->user->email,
                    ] : null,
                ];
            }

            return view('admin.posts.index', compact('posts'));
        } catch (\Throwable $e) {
            \Log::error($e);
            return view('admin.posts.index', ['posts' => [], 'error' => $e->getMessage()]);
        }
    }

    public function create()
    {
        return view('admin.posts.create');
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'content' => 'required|string',
            'mediaURL' => 'nullable|url', 
            'mediaType' => 'nullable|string',
            'mediaName' => 'nullable|string',
            'mediaSize' => 'nullable|string',
            'userId' => 'nullable|string',
        ]);

        $userId = $validatedData['userId'] ?? Auth::id() ?? 1;

        Post::create([
            'content' => $validatedData['content'],
            'mediaURL' => $validatedData['mediaURL'] ?? null,
            'mediaType' => $validatedData['mediaType'] ?? null,
            'mediaName' => $validatedData['mediaName'] ?? null,
            'mediaSize' => $validatedData['mediaSize'] ?? null,
            'user_id' => is_numeric($userId) ? $userId : Auth::id(),
            'likes' => [],
        ]);

        return redirect()->route('admin.posts.index')->with('success', 'Post created successfully!');
    }

    public function storeFromHomepage(Request $request)
    {
        try {
            \Log::info('Post data received:', $request->all());

            $userId = $request->input('userId');
            if (!$userId || !is_numeric($userId)) {
                $userId = Auth::id() ?? 1;
            }

            $post = Post::create([
                'content' => $request->input('content', ''),
                'mediaURL' => $request->input('mediaURL'),
                'mediaType' => $request->input('mediaType'),
                'mediaName' => $request->input('mediaName'),
                'mediaSize' => $request->input('mediaSize'),
                'user_id' => $userId,
                'likes' => $request->input('likes', []),
            ]);

            \Log::info('Post created with ID: ' . $post->id);

            return response()->json([
                'success' => true,
                'message' => 'Post created successfully!',
                'postId' => $post->id
            ]);
        } catch (\Exception $e) {
            \Log::error('Error creating post: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Error creating post: ' . $e->getMessage()
            ], 500);
        }
    }

    public function edit($id)
    {
        try {
            $postModel = Post::find($id);

            if (!$postModel) {
                return redirect()->route('admin.posts')->with('error', 'Post not found');
            }

            $post = [
                'id' => $postModel->id,
                'content' => $postModel->content,
                'mediaURL' => $postModel->mediaURL,
                'mediaType' => $postModel->mediaType,
            ];

            return view('admin.posts.edit', compact('post'));
        } catch (\Exception $e) {
            return redirect()->route('admin.posts')->with('error', 'Error loading post: ' . $e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $validatedData = $request->validate([
                'content' => 'required|string',
                'mediaURL' => 'nullable|url',
                'mediaType' => 'nullable|string'
            ]);

            $postModel = Post::findOrFail($id);
            $updates = [
                'content' => $validatedData['content'],
            ];

            if (isset($validatedData['mediaURL'])) {
                $updates['mediaURL'] = $validatedData['mediaURL'];
                $updates['mediaType'] = $validatedData['mediaType'];
            }

            $postModel->update($updates);

            return redirect()->route('admin.posts.index')->with('success', 'Post updated successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error updating post: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        Post::destroy($id);
        return redirect()->route('admin.posts.index')->with('success', 'Post deleted successfully!');
    }
}