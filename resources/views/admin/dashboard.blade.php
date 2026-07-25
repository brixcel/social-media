@extends('layouts.admin')

@section('title', 'Dashboard')

@section('header', 'Dashboard')

@section('content')
<div class="mb-4 bg-amber-100 border-l-4 border-amber-500 text-amber-900 p-4 rounded">
    <strong>⚠️ DEMO ENVIRONMENT:</strong> This admin dashboard displays local SQLite data seeded for demonstration.
</div>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-2">Total Posts</h3>
        <p class="text-3xl font-bold text-blue-600">{{ $postsCount ?? 0 }}</p>
        <a href="{{ route('admin.posts') }}" class="text-blue-500 hover:underline mt-2 inline-block">Manage Posts</a>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-2">Total Pages</h3>
        <p class="text-3xl font-bold text-green-600">{{ $pagesCount ?? 0 }}</p>
        <a href="{{ route('admin.pages') }}" class="text-blue-500 hover:underline mt-2 inline-block">Manage Pages</a>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-2">Total Users</h3>
        <p class="text-3xl font-bold text-purple-600">{{ $usersCount ?? 0 }}</p>
        <a href="{{ route('admin.users.index') }}" class="text-blue-500 hover:underline mt-2 inline-block">Manage Users</a>
    </div>
</div>

@if(session('error'))
    <div class="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {{ session('error') }}
    </div>
@endif
@endsection
