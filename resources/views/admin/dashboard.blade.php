@extends('layouts.admin')

@section('title', 'Dashboard')

@section('header', 'Dashboard')

@section('content')
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-2">Posts</h3>
        <p class="text-3xl font-bold">{{ $postsCount ?? 0 }}</p>
        <a href="{{ route('posts.index') }}" class="text-blue-500 hover:underline mt-2 inline-block">Manage Posts</a>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-2">Pages</h3>
        <p class="text-3xl font-bold">{{ $pagesCount ?? 0 }}</p>
        <a href="{{ route('pages.index') }}" class="text-blue-500 hover:underline mt-2 inline-block">Manage Pages</a>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-2">Users</h3>
        <p class="text-3xl font-bold">{{ $usersCount ?? 0 }}</p>
        <a href="#" class="text-blue-500 hover:underline mt-2 inline-block">Manage Users</a>
    </div>
</div>
@endsection
