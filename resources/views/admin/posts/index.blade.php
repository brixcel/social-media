@extends('layouts.admin')

@section('title', 'Manage Posts')
@section('header', 'Manage Posts')

@section('content')
<div class="mb-4">
    <a href="{{ route('admin.posts.create') }}" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
        Create New Post
    </a>
</div>

@if(session('success'))
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        {{ session('success') }}
    </div>
@endif

@if(session('error'))
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {{ session('error') }}
    </div>
@endif

<div class="bg-white rounded-lg shadow overflow-hidden">
    <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Info</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            <!-- Posts will be rendered by dashboard.js -->
        </tbody>
    </table>
</div>
@endsection

@section('scripts')
    <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-database.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-auth.js"></script> <!-- ADD THIS LINE -->
    <script src="{{ asset('js/admin/dashboard.js') }}"></script>
@endsection