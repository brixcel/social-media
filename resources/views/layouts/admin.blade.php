<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin CMS - @yield('title')</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <div class="flex h-screen">
        <!-- Sidebar -->
        <div class="w-64 bg-gray-800 text-white">
            <div class="p-4 font-bold text-xl">Admin CMS</div>
            <nav class="mt-4">
                <a href="{{ route('admin.dashboard') }}" class="block py-2 px-4 hover:bg-gray-700">Dashboard</a>
                <a href="{{ route('posts.index') }}" class="block py-2 px-4 hover:bg-gray-700">Posts</a>
                <a href="{{ route('pages.index') }}" class="block py-2 px-4 hover:bg-gray-700">Pages</a>
                <a href="{{ url('/') }}" class="block py-2 px-4 hover:bg-gray-700">View Site</a>
                <form method="POST" action="{{ route('logout') }}" class="block py-2 px-4">
                    @csrf
                    <button type="submit" class="text-white hover:underline">Logout</button>
                </form>
            </nav>
        </div>
        
        <!-- Main Content -->
        <div class="flex-1 overflow-y-auto">
            <header class="bg-white shadow">
                <div class="py-4 px-6">
                    <h2 class="text-xl font-semibold text-gray-800">@yield('header')</h2>
                </div>
            </header>
            
            <main class="p-6">
                @if(session('success'))
                    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        {{ session('success') }}
                    </div>
                @endif
                
                @yield('content')
            </main>
        </div>
    </div>
</body>
</html>
