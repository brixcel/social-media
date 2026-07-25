@extends('layouts.admin')

@section('title', 'Manage Posts')
@section('header', 'Manage Posts')

@section('content')
<div class="mb-4 flex justify-between items-center">
    <a href="{{ route('admin.posts.create') }}" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded font-medium text-sm">
        + Create New Post
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
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            @forelse($posts as $p)
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{{ $p['id'] }}</td>
                    <td class="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{{ $p['content'] }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        @if(!empty($p['mediaURL']))
                            <a href="{{ $p['mediaURL'] }}" target="_blank" class="text-blue-500 underline text-xs">View Media</a>
                        @else
                            <span class="text-gray-400 text-xs">None</span>
                        @endif
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {{ $p['userData']['first_name'] ?? 'User #' . $p['userId'] }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {{ date('M d, Y H:i', $p['timestamp']) }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">No posts found.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</div>
@endsection