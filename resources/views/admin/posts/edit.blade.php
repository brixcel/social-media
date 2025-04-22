@extends('layouts.admin')

@section('title', 'Edit Post')

@section('header', 'Edit Post')

@section('content')
<div class="bg-white rounded-lg shadow p-6">
    <form action="{{ route('posts.update', $id) }}" method="POST">
        @csrf
        @method('PUT')
        
        <div class="mb-4">
            <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" name="title" id="title" 
                class="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" 
                value="{{ old('title', $post['title'] ?? '') }}" required>
            @error('title')
                <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
            @enderror
        </div>
        
        <div class="mb-4">
            <label for="content" class="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea name="content" id="content" rows="10" 
                class="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" required>{{ old('content', $post['content'] ?? '') }}</textarea>
            @error('content')
                <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
            @enderror
        </div>
        
        <div class="mb-4">
            <label for="status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" id="status" 
                class="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                <option value="draft" {{ old('status', $post['status'] ?? '') == 'draft' ? 'selected' : '' }}>Draft</option>
                <option value="published" {{ old('status', $post['status'] ?? '') == 'published' ? 'selected' : '' }}>Published</option>
            </select>
            @error('status')
                <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
            @enderror
        </div>
        
        <div class="flex items-center justify-end">
            <a href="{{ route('posts.index') }}" class="text-gray-600 hover:text-gray-900 mr-4">Cancel</a>
            <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
                Update Post
            </button>
        </div>
    </form>
</div>

<script>
    // Optionally integrate TinyMCE or CKEditor here
</script>
@endsection
