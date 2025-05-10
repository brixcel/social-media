<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Kreait\Firebase\Contract\Database;

class PageController extends Controller
{
    protected $database;

    public function __construct(Database $database)
    {
        $this->database = $database;
    }

    /**
     * Display a listing of the pages.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $pages = $this->database->getReference('pages')->getValue();
        return view('admin.pages.index', compact('pages'));
    }

    /**
     * Show the form for creating a new page.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        return view('admin.pages.create');
    }

    /**
     * Store a newly created page in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255',
            'content' => 'required|string',
            'status' => 'required|in:draft,published',
        ]);

        $newPage = [
            'title' => $validatedData['title'],
            'slug' => $validatedData['slug'],
            'content' => $validatedData['content'],
            'status' => $validatedData['status'],
            'created_at' => time(),
            'updated_at' => time(),
        ];

        $pageRef = $this->database->getReference('pages')->push($newPage);

        return redirect()->route('pages.index')->with('success', 'Page created successfully!');
    }

    /**
     * Show the form for editing the specified page.
     *
     * @param  string  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        $page = $this->database->getReference('pages/' . $id)->getValue();
        return view('admin.pages.edit', compact('page', 'id'));
    }

    /**
     * Update the specified page in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  string  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255',
            'content' => 'required|string',
            'status' => 'required|in:draft,published',
        ]);

        $updatedPage = [
            'title' => $validatedData['title'],
            'slug' => $validatedData['slug'],
            'content' => $validatedData['content'],
            'status' => $validatedData['status'],
            'updated_at' => time(),
        ];

        $this->database->getReference('pages/' . $id)->update($updatedPage);

        return redirect()->route('pages.index')->with('success', 'Page updated successfully!');
    }

    /**
     * Remove the specified page from storage.
     *
     * @param  string  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $this->database->getReference('pages/' . $id)->remove();
        return redirect()->route('pages.index')->with('success', 'Page deleted successfully!');
    }
}