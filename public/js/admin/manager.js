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

    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const database = firebase.database();

    // Function to load and display dashboard stats
    function loadDashboardStats() {
        // Get posts count
        database.ref('posts').once('value')
            .then(snapshot => {
                const posts = snapshot.val() || {};
                const postsCount = Object.keys(posts).length;
                updateStatsDisplay('posts-count', postsCount);
            })
            .catch(error => {
                console.error('Error fetching posts:', error);
                updateStatsDisplay('posts-count', 0);
            });

        // Get users count
        database.ref('users').once('value')
            .then(snapshot => {
                const users = snapshot.val() || {};
                const usersCount = Object.keys(users).length;
                updateStatsDisplay('users-count', usersCount);
            })
            .catch(error => {
                console.error('Error fetching users:', error);
                updateStatsDisplay('users-count', 0);
            });
    }

    // Function to update stats display
    function updateStatsDisplay(elementId, count) {
        const element = document.querySelector(`[data-stats="${elementId}"]`);
        if (element) {
            element.textContent = count;
        }
    }

    // Add click event listener for "Manage Posts" link
    const managePostsLink = document.querySelector('a[href*="posts"]');
    if (managePostsLink) {
        managePostsLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/admin/posts';
        });
    }

    // Load initial stats
    loadDashboardStats();

    // Set up real-time listeners for updates
    database.ref('posts').on('value', snapshot => {
        const posts = snapshot.val() || {};
        const postsCount = Object.keys(posts).length;
        updateStatsDisplay('posts-count', postsCount);
    });

    database.ref('users').on('value', snapshot => {
        const users = snapshot.val() || {};
        const usersCount = Object.keys(users).length;
        updateStatsDisplay('users-count', usersCount);
    });
});