@extends('layouts.admin')

@section('title', 'Edit Post')
@section('header', 'Edit Post')

@section('content')
<div class="bg-white rounded-lg shadow-md p-6">
    <form id="editPostForm" class="space-y-6">
        @csrf
        
        <div>
            <label for="content" class="block text-sm font-medium text-gray-700">Content</label>
            <textarea id="content" name="content" rows="4" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></textarea>
        </div>

        <div id="currentMedia" class="hidden">
            <label class="block text-sm font-medium text-gray-700">Current Media</label>
            <div class="mt-2"></div>
        </div>

        <div>
            <label for="mediaURL" class="block text-sm font-medium text-gray-700">Media URL (optional)</label>
            <input type="url" id="mediaURL" name="mediaURL" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
        </div>

        <div>
            <label for="mediaType" class="block text-sm font-medium text-gray-700">Media Type</label>
            <select id="mediaType" name="mediaType" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <option value="">None</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="file">File</option>
            </select>
        </div>

        <div class="flex justify-end space-x-3">
            <a href="{{ route('admin.posts') }}" 
                class="bg-gray-100 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
            </a>
            <button type="submit"
                class="bg-indigo-600 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700">
                Save Changes
            </button>
        </div>
    </form>
</div>
@endsection

@section('scripts')
<script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-database.js"></script>
<script src="{{ asset('js/admin/edit.js') }}"></script>
@endsection