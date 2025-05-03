<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Kreait\Firebase\Contract\Database;
use App\Services\FirebaseService;

class PostController extends Controller
{
    protected $database;
    protected $tablename;
    protected $firebaseService;

    public function __construct(FirebaseService $firebaseService)
    {
        $this->database = $firebaseService->getDatabase();
        $this->tablename = 'posts'; 
    }

    public function index()
    {
        try {
            // Retrieve posts from Firebase
            $snapshot = $this->database->getReference($this->tablename)->orderByChild('timestamp')->getSnapshot();

            if (!$snapshot->exists()) {
                return view('admin.posts.index', ['posts' => []]);
            }

            $posts = $snapshot->getValue();

            // Convert to array and sort by timestamp (newest first)
            if (is_array($posts)) {
                uasort($posts, function ($a, $b) {
                    return $b['timestamp'] <=> $a['timestamp'];
                });
            }

            // Add user data to each post
            foreach ($posts as $key => &$post) {
                $post['id'] = $key; // Add post ID for reference
                if (isset($post['userId'])) {
                    $userSnapshot = $this->database->getReference('users/' . $post['userId'])->getSnapshot();
                    if ($userSnapshot->exists()) {
                        $post['userData'] = $userSnapshot->getValue();
                    }
                }
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
        // Validate the input first
        $validatedData = $request->validate([
            'content' => 'required|string',
            'mediaURL' => 'nullable|url', 
            'mediaType' => 'nullable|string',
            'mediaName' => 'nullable|string',
            'mediaSize' => 'nullable|string',
            'userId' => 'nullable|string',
        ]);
    
        // Prepare the data
        $postData = [
            'content' => $validatedData['content'],
            'mediaURL' => $validatedData['mediaURL'] ?? null,
            'mediaType' => $validatedData['mediaType'] ?? null,
            'mediaName' => $validatedData['mediaName'] ?? null,
            'mediaSize' => $validatedData['mediaSize'] ?? null,
            'timestamp' => time(), // Use server timestamp for consistency
            'userId' => $validatedData['userId'] ?? auth()->id() ?? 'admin-user',
            'likes' => [], // Initialize empty likes object
        ];
    
        // Filter out null values
        $postData = array_filter($postData, function($value) {
            return $value !== null;
        });
    
        // Insert into Firebase
        $this->database->getReference($this->tablename)->push($postData);
    
        return redirect()->route('admin.posts.index')->with('success', 'Post created successfully!');
    }
    public function storeFromHomepage(Request $request)
    {
        try {
            // Log the incoming request for debugging
            \Log::info('Post data received:', $request->all());
            
            // Prepare the data from the AJAX request
            $postData = [
                'content' => $request->input('content', ''),
                'mediaURL' => $request->input('mediaURL'),
                'mediaType' => $request->input('mediaType'),
                'mediaName' => $request->input('mediaName'),
                'mediaSize' => $request->input('mediaSize'),
                'timestamp' => $request->input('timestamp', time()), // Use client timestamp or current time
                'userId' => $request->input('userId', 'anonymous'),
                'likes' => $request->input('likes', []),
            ];
            
            // Filter out null values
            $postData = array_filter($postData, function($value) {
                return $value !== null;
            });
            
            \Log::info('Prepared post data:', $postData);
            
            // Insert into Firebase
            $newPost = $this->database->getReference($this->tablename)->push($postData);
            
            \Log::info('Post created with ID: ' . $newPost->getKey());
            
            return response()->json([
                'success' => true,
                'message' => 'Post created successfully!',
                'postId' => $newPost->getKey()
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
        $post = $this->database->getReference($this->tablename . '/' . $id)->getValue();
        
        if (!$post) {
            return redirect()->route('admin.posts.index')->with('error', 'Post not found');
        }
        
        return view('admin.posts.edit', compact('post', 'id'));
    }

    public function update(Request $request, $id)
    {
        $validatedData = $request->validate([
            'content' => 'required|string',
            'mediaURL' => 'nullable|url',
            'mediaType' => 'nullable|string',
        ]);

        $updatedPost = [
            'content' => $validatedData['content'],
        ];
        
        // Only update media fields if provided
        if (!empty($validatedData['mediaURL'])) {
            $updatedPost['mediaURL'] = $validatedData['mediaURL'];
        }
        
        if (!empty($validatedData['mediaType'])) {
            $updatedPost['mediaType'] = $validatedData['mediaType'];
        }

        $this->database->getReference($this->tablename . '/' . $id)->update($updatedPost);

        return redirect()->route('admin.posts.index')->with('success', 'Post updated successfully!');
    }

    public function destroy($id)
    {
        $this->database->getReference($this->tablename . '/' . $id)->remove();
        return redirect()->route('admin.posts.index')->with('success', 'Post deleted successfully!');
    }
}