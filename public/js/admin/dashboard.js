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
    const tableBody = document.querySelector('tbody'); // <-- Move here

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log('Authenticated as:', user.email || user.uid);
            loadPosts(); // <-- Now this function exists!
        } else {
            console.log('Not authenticated!');
            // Optionally redirect to login
        }
    });

    function loadPosts() {
        const database = firebase.database();

        database.ref('posts').on('value', snapshot => {
            const posts = snapshot.val();
            console.log('Fetched posts:', posts);
            tableBody.innerHTML = '';

            if (posts) {
                const postsArray = Object.entries(posts)
                    .map(([id, post]) => ({ id, ...post }))
                    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

                postsArray.forEach(({ id: postId, ...post }) => {
                    if (post.userId) {
                        database.ref(`users/${post.userId}`).once('value')
                            .then(userSnapshot => {
                                const userData = userSnapshot.val();
                                renderPostRow(postId, post, userData);
                            })
                            .catch(() => {
                                renderPostRow(postId, post);
                            });
                    } else {
                        renderPostRow(postId, post);
                    }
                });
            } else {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-6 py-4 text-center text-gray-500">No posts found</td>
                    </tr>
                `;
            }
        });
    }

    function renderPostRow(postId, post, userData = null) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4">
                <div class="text-sm text-gray-900">${truncateText(post.content || 'No content', 50)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${renderMediaCell(post)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${renderLikesCount(post.likes)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                ${formatTimestamp(post.timestamp)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${renderUserInfo(userData, post.userId)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <a href="/admin/posts/${postId}/edit" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-edit mr-1"></i>Edit
                </a>
                <button onclick="deletePost('${postId}')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash mr-1"></i>Delete
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    }

    function renderMediaCell(post) {
        if (!post.mediaURL) {
            return '<span class="text-gray-500">No media</span>';
        }

        switch (post.mediaType) {
            case 'image':
                return `<a href="${post.mediaURL}" target="_blank" class="text-blue-600 hover:underline">
                    <img src="${post.mediaURL}" alt="Post image" class="h-16 w-auto object-cover rounded">
                </a>`;
            case 'video':
                return `<a href="${post.mediaURL}" target="_blank" class="text-blue-600 hover:underline">
                    <i class="fas fa-video mr-1"></i>View Video
                </a>`;
            case 'file':
                return `<a href="${post.mediaURL}" target="_blank" class="text-blue-600 hover:underline">
                    <i class="fas fa-file mr-1"></i>${post.mediaName || 'File'}
                </a>`;
            default:
                return `<a href="${post.mediaURL}" target="_blank" class="text-blue-600 hover:underline">
                    <i class="fas fa-link mr-1"></i>View Media
                </a>`;
        }
    }

    function renderLikesCount(likes) {
        const likeCount = likes && typeof likes === 'object' ? Object.keys(likes).length : 0;
        const colorClass = likeCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
        return `<span class="${colorClass} text-xs font-semibold px-2.5 py-0.5 rounded">${likeCount}</span>`;
    }

    function renderUserInfo(userData, userId) {
        if (userData) {
            return `
                <div class="text-sm text-gray-900">
                    ${userData.firstName || ''} ${userData.lastName || ''}
                </div>
                <div class="text-xs text-gray-500">
                    ${userData.course || 'No course'}
                </div>`;
        }
        return `<div class="text-sm text-gray-500">${userId || 'Unknown'}</div>`;
    }

    function showEmptyMessage() {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">No posts found</td>
            </tr>`;
    }

    function truncateText(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    function formatTimestamp(timestamp) {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
});

// Global function for deleting posts
window.deletePost = function(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
        firebase.database().ref(`posts/${postId}`).remove()
            .then(() => {
                showNotification('Post deleted successfully', 'success');
            })
            .catch(error => {
                showNotification(error.message, 'error');
            });
    }
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