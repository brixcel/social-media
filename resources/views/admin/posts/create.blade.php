@extends('layouts.admin')

@section('title', 'Create Post')
@section('header', 'Create New Post')

@section('content')
<div class="mb-4">
    <a href="{{ route('admin.posts.index') }}" class="text-blue-500 hover:underline">
        &larr; Back to Posts
    </a>
</div>

@if($errors->any())
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <ul>
            @foreach($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

<div class="bg-white rounded-lg shadow p-6">
    <form action="{{ route('admin.posts.store') }}" method="POST">
        @csrf
        
        <div class="mb-4">
            <label for="content" class="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea name="content" id="content" rows="4" class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500">{{ old('content') }}</textarea>
        </div>
        
        <div class="mb-4">
            <label for="mediaURL" class="block text-sm font-medium text-gray-700 mb-1">Media URL</label>
            <input type="url" name="mediaURL" id="mediaURL" value="{{ old('mediaURL') }}" class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500">
        </div>
        
        <div class="mb-4">
            <label for="mediaType" class="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
            <select name="mediaType" id="mediaType" class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500">
                <option value="">None</option>
                <option value="image" {{ old('mediaType') === 'image' ? 'selected' : '' }}>Image</option>
                <option value="video" {{ old('mediaType') === 'video' ? 'selected' : '' }}>Video</option>
                <option value="file" {{ old('mediaType') === 'file' ? 'selected' : '' }}>File</option>
            </select>
        </div>
        
        <div class="mb-4">
            <label for="mediaName" class="block text-sm font-medium text-gray-700 mb-1">Media Name (optional)</label>
            <input type="text" name="mediaName" id="mediaName" value="{{ old('mediaName') }}" class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500">
        </div>
        
        <div class="mb-4">
            <label for="mediaSize" class="block text-sm font-medium text-gray-700 mb-1">Media Size (optional)</label>
            <input type="text" name="mediaSize" id="mediaSize" value="{{ old('mediaSize') }}" class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500">
        </div>
        
        <div class="flex justify-end">
            <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
                Create Post
            </button>
        </div>
    </form>
</div>
@endsection