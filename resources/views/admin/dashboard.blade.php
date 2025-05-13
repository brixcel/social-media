@extends('layouts.admin')

@section('title', 'Dashboard')

@section('header', 'Dashboard')

@section('content')
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-2">Total Posts</h3>
        <p class="text-3xl font-bold" data-stats="posts-count">0</p>
        <a href="{{ route('admin.posts') }}" class="text-blue-500 hover:underline mt-2 inline-block">Manage Posts</a>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-2">Total Users</h3>
        <p class="text-3xl font-bold" data-stats="users-count">0</p>
        <a href="{{ route('admin.users.index') }}" class="text-blue-500 hover:underline mt-2 inline-block">Manage Users</a>
    </div>
</div>

@if(session('error'))
    <div class="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {{ session('error') }}
    </div>
@endif
@endsection

@section('scripts')
<script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-database.js"></script>
<script src="{{ asset('js/admin/manager.js') }}"></script>
@endsection
