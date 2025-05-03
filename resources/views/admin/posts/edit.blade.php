@extends('layouts.admin')

@section('title', 'Edit Post')
@section('header', 'Edit Post')

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
    <form action="{{ route('admin.posts.update', $id) }}" method="POST">
        @csrf
        @method('PUT')
        
        <div class="mb-4">
            <label for="content" class="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea name="content" id="content" rows="4" class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500">{{ $post['content'] ?? '' }}</textarea>
        </div>
        
        <div class="mb-4">
            <label for="mediaURL" class="block text-sm font-medium text-gray-700 mb-1">Media URL</label>
            <input type="url" name="mediaURL" id="mediaURL" value="{{ $post['mediaURL'] ?? '' }}" class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500">
            
            @if(isset($post['mediaURL']))
                <div class="mt-2">
                    <span class="text-sm text-gray-600">Current Media Type: {{ $post['mediaType'] ?? 'Not specified' }}</span>
                    
                    @if(isset($post['mediaType']) && $post['mediaType'] === 'image')
                        <div class="mt-2">
                            <img src="{{ $post['mediaURL'] }}" alt="Post Image" class="max-w-md rounded">
                        </div>
                    @elseif(isset($post['mediaType']) && $post['mediaType'] === 'video')
                        <div class="mt-2">
                            <video controls class="max-w-md rounded">
                                <source src="{{ $post['mediaURL'] }}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    @endif
                </div>
            @endif
        </div>
        
        <div class="mb-4">
            <label for="mediaType" class="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
            <select name="mediaType" id="mediaType" class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500">
                <option value="">None</option>
                <option value="image" {{ (isset($post['mediaType']) && $post['mediaType'] === 'image') ? 'selected' : '' }}>Image</option>
                <option value="video" {{ (isset($post['mediaType']) && $post['mediaType'] === 'video') ? 'selected' : '' }}>Video</option>
                <option value="file" {{ (isset($post['mediaType']) && $post['mediaType'] === 'file') ? 'selected' : '' }}>File</option>
            </select>
        </div>
        
        <div class="flex justify-end">
            <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
                Update Post
            </button>
        </div>
    </form>
</div>
@endsection