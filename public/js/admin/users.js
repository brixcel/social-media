document.addEventListener('DOMContentLoaded', function() {
    const firebaseConfig = {
        apiKey: "AIzaSyAZ6EzZLpBIUlTjFm7ZUBfMMkmslIOeMFg",
        authDomain: "social-media-8c5ba.firebaseapp.com",
        databaseURL: "https://social-media-8c5ba-default-rtdb.firebaseio.com",
        projectId: "social-media-8c5ba",
        storageBucket: "social-media-8c5ba.appspot.com",
        messagingSenderId: "25174929156",
        appId: "1:25174929156:web:edd2093c4b96f710262a51"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const database = firebase.database();
    const usersRef = database.ref('users');
    const tableBody = document.getElementById('usersTableBody');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');

    // Load users
    function loadUsers() {
        loadingState.classList.remove('hidden');
        emptyState.classList.add('hidden');
        tableBody.innerHTML = '';

        usersRef.once('value')
            .then(snapshot => {
                loadingState.classList.add('hidden');
                const users = snapshot.val();
                
                if (!users) {
                    emptyState.classList.remove('hidden');
                    return;
                }

                Object.entries(users).forEach(([userId, userData]) => {
                    renderUserRow(userId, userData);
                });

                // Apply current filters
                applyFilters();
            })
            .catch(error => {
                console.error('Error loading users:', error);
                loadingState.classList.add('hidden');
                showNotification('Error loading users', 'error');
            });
    }

    function renderUserRow(userId, userData) {
        const row = document.createElement('tr');
        row.setAttribute('data-user-id', userId);
        row.setAttribute('data-status', userData.status || 'active');
        row.setAttribute('data-search', `${userData.firstName} ${userData.lastName} ${userData.email}`.toLowerCase());

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        ${getInitials(userData.firstName, userData.lastName)}
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">
                            ${userData.firstName} ${userData.lastName}
                        </div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${userData.email}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${userData.status === 'banned' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                    ${userData.status || 'active'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(userData.createdAt)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                ${userData.status === 'banned' 
                    ? `<button onclick="unbanUser('${userId}')" class="text-blue-600 hover:text-blue-900 mr-3">
                        Unban
                       </button>`
                    : `<button onclick="banUser('${userId}')" class="text-yellow-600 hover:text-yellow-900 mr-3">
                        Ban
                       </button>`
                }
                <button onclick="deleteUser('${userId}')" class="text-red-600 hover:text-red-900">
                    Delete
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    }

    // Filter and search functionality
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusValue = statusFilter.value;
        const rows = tableBody.querySelectorAll('tr');

        rows.forEach(row => {
            const searchText = row.getAttribute('data-search');
            const status = row.getAttribute('data-status');
            const matchesSearch = searchText.includes(searchTerm);
            const matchesStatus = statusValue === 'all' || status === statusValue;

            row.classList.toggle('hidden', !(matchesSearch && matchesStatus));
        });

        // Show/hide empty state
        const hasVisibleRows = Array.from(rows).some(row => !row.classList.contains('hidden'));
        emptyState.classList.toggle('hidden', hasVisibleRows);
    }

    // Event listeners for filters
    searchInput.addEventListener('input', applyFilters);
    statusFilter.addEventListener('change', applyFilters);

    // User actions
    window.banUser = function(userId) {
        showConfirmationModal(
            'Ban User',
            'Are you sure you want to ban this user?',
            () => {
                fetch(`/admin/users/${userId}/ban`, { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            loadUsers();
                            showNotification('User banned successfully', 'success');
                        } else {
                            showNotification(data.message, 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error banning user:', error);
                        showNotification('Failed to ban user', 'error');
                    });
            }
        );
    };

    window.unbanUser = function(userId) {
        showConfirmationModal(
            'Unban User',
            'Are you sure you want to unban this user?',
            () => {
                fetch(`/admin/users/${userId}/unban`, { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            loadUsers();
                            showNotification('User unbanned successfully', 'success');
                        } else {
                            showNotification(data.message, 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error unbanning user:', error);
                        showNotification('Failed to unban user', 'error');
                    });
            }
        );
    };

    window.deleteUser = function(userId) {
        showConfirmationModal(
            'Delete User',
            'Are you sure you want to delete this user? This action cannot be undone.',
            () => {
                fetch(`/admin/users/${userId}`, { method: 'DELETE' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            loadUsers();
                            showNotification('User deleted successfully', 'success');
                        } else {
                            showNotification(data.message, 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting user:', error);
                        showNotification('Failed to delete user', 'error');
                    });
            }
        );
    };

    // Helper functions
    function getInitials(firstName, lastName) {
        return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
    }

    function formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleDateString();
    }

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg ${
            type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // Modal functionality
    let currentModalCallback = null;

    function showConfirmationModal(title, message, callback) {
        const modal = document.getElementById('confirmationModal');
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').textContent = message;
        currentModalCallback = callback;
        modal.classList.remove('hidden');
    }

    window.closeModal = function() {
        const modal = document.getElementById('confirmationModal');
        modal.classList.add('hidden');
        currentModalCallback = null;
    };

    document.getElementById('confirmButton').addEventListener('click', () => {
        if (currentModalCallback) {
            currentModalCallback();
        }
        closeModal();
    });

    // Initial load
    loadUsers();
});