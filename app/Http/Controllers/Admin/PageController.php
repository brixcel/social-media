<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Page;

class PageController extends Controller
{
    public function index()
    {
        $pagesCollection = Page::all();
        $pages = [];
        foreach ($pagesCollection as $page) {
            $pages[$page->id] = [
                'title' => $page->title,
                'slug' => $page->slug,
                'content' => $page->content,
                'status' => $page->status,
                'created_at' => $page->created_at ? $page->created_at->timestamp : time(),
                'updated_at' => $page->updated_at ? $page->updated_at->timestamp : time(),
            ];
        }

        return view('admin.pages.index', compact('pages'));
    }

    public function create()
    {
        return view('admin.pages.create');
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255',
            'content' => 'required|string',
            'status' => 'required|in:draft,published',
        ]);

        Page::create([
            'title' => $validatedData['title'],
            'slug' => $validatedData['slug'],
            'content' => $validatedData['content'],
            'status' => $validatedData['status'],
        ]);

        return redirect()->route('admin.pages')->with('success', 'Page created successfully!');
    }

    public function edit($id)
    {
        $pageModel = Page::find($id);
        if (!$pageModel) {
            return redirect()->route('admin.pages')->with('error', 'Page not found');
        }

        $page = [
            'title' => $pageModel->title,
            'slug' => $pageModel->slug,
            'content' => $pageModel->content,
            'status' => $pageModel->status,
        ];

        return view('admin.pages.edit', compact('page', 'id'));
    }

    public function update(Request $request, $id)
    {
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255',
            'content' => 'required|string',
            'status' => 'required|in:draft,published',
        ]);

        $pageModel = Page::findOrFail($id);
        $pageModel->update($validatedData);

        return redirect()->route('admin.pages')->with('success', 'Page updated successfully!');
    }

    public function destroy($id)
    {
        Page::destroy($id);
        return redirect()->route('admin.pages')->with('success', 'Page deleted successfully!');
    }
}