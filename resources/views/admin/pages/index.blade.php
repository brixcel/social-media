@extends('layouts.admin')

@section('title', 'Manage Pages')

@section('header', 'Manage Pages')

@section('content')
<div class="mb-4 flex justify-between items-center">
    <a href="{{ route('admin.pages') }}" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded font-medium text-sm">
        Manage Pages
    </a>
</div>

<div class="bg-white rounded-lg shadow overflow-hidden">
    <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            @forelse($pages as $id => $page)
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ is_array($page) ? $page['title'] : $page->title }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ is_array($page) ? $page['slug'] : $page->slug }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        @php $status = is_array($page) ? $page['status'] : $page->status; @endphp
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {{ $status == 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800' }}">
                            {{ ucfirst($status) }}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        @php $createdAt = is_array($page) ? $page['created_at'] : $page->created_at; @endphp
                        {{ is_numeric($createdAt) ? date('M d, Y', $createdAt) : ($createdAt ? $createdAt->format('M d, Y') : 'N/A') }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">No pages found</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</div>
@endsection
