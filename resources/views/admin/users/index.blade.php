@extends('layouts.admin')

@section('title', 'Manage Users')
@section('header', 'Manage Users')

@section('content')
<div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="p-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
            <input type="text" id="searchInput" placeholder="Search users..." 
                class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <div class="flex space-x-2">
                <select id="statusFilter" class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                </select>
            </div>
        </div>
    </div>

    <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200" id="usersTableBody">
            <!-- Users will be loaded here dynamically -->
        </tbody>
    </table>

    <!-- Loading State -->
    <div id="loadingState" class="hidden">
        <div class="flex justify-center items-center p-8">
            <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    </div>

    <!-- Empty State -->
    <div id="emptyState" class="hidden">
        <div class="text-center p-8 text-gray-500">
            No users found
        </div>
    </div>
</div>

<!-- Confirmation Modal -->
<div id="confirmationModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div class="bg-white rounded-lg p-8 max-w-md mx-4">
        <h3 class="text-lg font-bold mb-4" id="modalTitle">Confirm Action</h3>
        <p class="text-gray-600 mb-6" id="modalMessage">Are you sure you want to proceed?</p>
        <div class="flex justify-end space-x-4">
            <button onclick="closeModal()" class="px-4 py-2 text-gray-600 hover:text-gray-800">
                Cancel
            </button>
            <button id="confirmButton" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                Confirm
            </button>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-database.js"></script>
<script src="{{ asset('js/admin/users.js') }}"></script>
@endsection