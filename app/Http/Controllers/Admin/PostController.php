<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Kreait\Firebase\Contract\Database;

class PostController extends Controller
{
    protected $database;

    public function __construct(Database $database)
    {
        $this->database = $database;
        
    }

    public function index()
    {
        $snapshot = $this->database->getReference('posts')->getSnapshot();
        $posts = [];

        foreach ($snapshot->getChildren() as $childSnapshot) {
            $posts[$childSnapshot->getKey()] = $childSnapshot->getValue();
        }

        return view('admin.posts.index', ['posts' => $posts]);
    }
    public function create()
    {
        return view('admin.posts.create');
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'status' => 'required|in:draft,published',
        ]);

        $newPost = [
            'title' => $validatedData['title'],
            'content' => $validatedData['content'],
            'status' => $validatedData['status'],
            'created_at' => time(),
            'updated_at' => time(),
        ];

        $postRef = $this->database->getReference('posts')->push($newPost);

        return redirect()->route('admin.posts.index')->with('success', 'Post created successfully!');
    }

    public function edit($id)
    {
        $post = $this->database->getReference('posts/' . $id)->getValue();
        return view('admin.posts.edit', compact('post', 'id'));
    }

    public function update(Request $request, $id)
    {
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'status' => 'required|in:draft,published',
        ]);

        $updatedPost = [
            'title' => $validatedData['title'],
            'content' => $validatedData['content'],
            'status' => $validatedData['status'],
            'updated_at' => time(),
        ];

        $this->database->getReference('posts/' . $id)->update($updatedPost);

        return redirect()->route('admin.posts.index')->with('success', 'Post updated successfully!');
    }

    public function destroy($id)
    {
        $this->database->getReference('posts/' . $id)->remove();
        return redirect()->route('admin.posts.index')->with('success', 'Post deleted successfully!');
    }
}