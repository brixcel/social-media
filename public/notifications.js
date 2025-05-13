document.addEventListener("DOMContentLoaded", function () {
  // Assuming firebase is available globally or imported elsewhere.
  // If not, you'll need to import it:
  // import * as firebase from 'firebase/app';
  // import 'firebase/auth';
  // import 'firebase/database';

  const notificationsFeed = document.getElementById("notifications-feed");
  const markAllReadBtn = document.getElementById("mark-all-read");
  const filterOptions = document.querySelectorAll(".ursac-filter-option");
  let currentFilter = "all";
  let allNotifications = [];
  let currentUser = null;
  let userDataCache = {}; // Cache for user data to avoid repeated fetches
  
  // Function to load notifications
  function loadNotifications() {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        currentUser = user;
        setupNotificationListener(user.uid);
      } else {
        if (notificationsFeed) {
          notificationsFeed.innerHTML = `
            <div class="ursac-notification-item">
              <div class="ursac-notification-content">
                <div class="ursac-notification-text">
                  Please log in to view notifications.
                </div>
              </div>
            </div>
          `;
        }
      }
    });
  }

  function setupNotificationListener(userId) {
    if (!userId) return;

    const notificationsRef = firebase.database().ref(`notifications/${userId}`);

    notificationsRef.on('value', function(snapshot) {
      let unreadCount = 0;
      allNotifications = [];
      
      if (snapshot && snapshot.exists()) {
        snapshot.forEach(notifSnapshot => {
          const notification = notifSnapshot.val();
          if (!notification.read) unreadCount++;
          
          // Add to the notifications array for UI rendering
          allNotifications.push({
            id: notifSnapshot.key,
            ...notification
          });
        });
        
        // Sort notifications by timestamp (newest first)
        allNotifications.sort((a, b) => b.timestamp - a.timestamp);
        
        // Update UI based on current filter
        filterNotifications(currentFilter);
      } else {
        showEmptyState();
      }
      
      updateNotificationBadge(unreadCount);
    });
  }

  function filterNotifications(filter) {
    currentFilter = filter;
    
    if (allNotifications.length === 0) {
      showEmptyState();
      return;
    }
    
    let filteredNotifications;
    
    switch(filter) {
      case "unread":
        filteredNotifications = allNotifications.filter(notif => !notif.read);
        break;
      case "mentions":
        filteredNotifications = allNotifications.filter(notif => 
          notif.type === "comment" && notif.commentText && 
          notif.commentText.includes(`@${currentUser?.displayName || ''}`)
        );
        break;
      case "all":
      default:
        filteredNotifications = allNotifications;
        break;
    }
    
    if (filteredNotifications.length === 0) {
      showEmptyStateForFilter(filter);
    } else {
      updateNotificationsUI(filteredNotifications);
    }
  }
  
  function showEmptyState() {
    if (!notificationsFeed) return;
    
    notificationsFeed.innerHTML = `
      <div class="ursac-notifications-empty">
        <i class="fas fa-bell-slash"></i>
        <p>No notifications yet</p>
      </div>
    `;
  }
  
  function showEmptyStateForFilter(filter) {
    if (!notificationsFeed) return;
    
    let message = "";
    switch(filter) {
      case "unread":
        message = "No unread notifications";
        break;
      case "mentions":
        message = "No mentions yet";
        break;
      default:
        message = "No notifications yet";
    }
    
    notificationsFeed.innerHTML = `
      <div class="ursac-notifications-empty">
        <i class="fas fa-bell-slash"></i>
        <p>${message}</p>
      </div>
    `;
  }

  function updateNotificationsUI(notifications) {
  if (!notificationsFeed) return;

  // First, fetch all user data needed for these notifications
  const userIds = [...new Set(notifications.map(notif => notif.userId))];
  
  // Fetch user data for all users in the notifications
  Promise.all(
    userIds.map(userId => {
      // Check if we already have this user's data in cache
      if (userDataCache[userId]) {
        return Promise.resolve(userDataCache[userId]);
      }
      
      // Fetch user data from Firebase
      return firebase.database().ref(`users/${userId}`).once('value')
        .then(snapshot => {
          const userData = snapshot.val();
          if (userData) {
            // Store in cache for future use
            userDataCache[userId] = userData;
            return userData;
          }
          return null;
        });
    })
  ).then(() => {
    // Now render notifications with user data
    notificationsFeed.innerHTML = notifications.map(notif => {
      let notifContent = '';
      let categoryIcon = '';
      const userData = userDataCache[notif.userId] || { firstName: 'Unknown', lastName: 'User' };
      const userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
      
      if (notif.type === 'comment') {
        categoryIcon = '<i class="fas fa-comment"></i>';
        notifContent = `
          <strong>${userName}</strong> commented on your post:
          <div class="ursac-notification-preview">"${(notif.commentText || '').substring(0, 50)}${(notif.commentText || '').length > 50 ? '...' : ''}"</div>
        `;
      } else if (notif.type === 'like') {
        categoryIcon = '<i class="fas fa-thumbs-up"></i>';
        notifContent = `<strong>${userName}</strong> liked your post`;
      } else if (notif.type === 'mention') {
        categoryIcon = '<i class="fas fa-at"></i>';
        notifContent = `<strong>${userName}</strong> mentioned you in a comment`;
      } else if (notif.type === 'reply') {
        categoryIcon = '<i class="fas fa-reply"></i>';
        notifContent = `
          <strong>${userName}</strong> replied to your comment:
          <div class="ursac-notification-preview">"${(notif.commentText || '').substring(0, 50)}${(notif.commentText || '').length > 50 ? '...' : ''}"</div>
        `;
      } else if (notif.type === 'forum_created') {
        categoryIcon = '<i class="fas fa-comments"></i>';
        notifContent = `
          <strong>${userName}</strong> created a new forum: 
          <div class="ursac-notification-preview">"${(notif.message || '').substring(0, 50)}${(notif.message || '').length > 50 ? '...' : ''}"</div>
        `;
      } else if (notif.type === 'forum_joined') { // Handling 'forum_joined' notification
        categoryIcon = '<i class="fas fa-users"></i>';  // Icon for joining forum
        notifContent = `
          <strong>${userName}</strong> joined the forum: 
          <div class="ursac-notification-preview">"${(notif.message || '').substring(0, 50)}${(notif.message || '').length > 50 ? '...' : ''}"</div>
        `;
      }

      return `
        <div class="ursac-notification-item ${notif.read ? '' : 'unread'}" 
             data-notification-id="${notif.id}" 
             data-post-id="${notif.postId}">
          <div class="ursac-notification-icon">
            ${categoryIcon}
          </div>
          <div class="ursac-notification-content">
            <div class="ursac-notification-text">
              ${notifContent}
            </div>
            <div class="ursac-notification-meta">
              <span class="ursac-notification-time">${formatTimeAgo(notif.timestamp)}</span>
            </div>
          </div>
          <div class="ursac-notification-actions">
            <button class="ursac-view-button" onclick="handleNotificationClick('${notif.id}', '${notif.postId}')">View</button>
            ${!notif.read ? `<button class="ursac-mark-read-button" onclick="markNotificationAsRead('${notif.id}', event)">Mark as read</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  });
}



  function updateNotificationBadge(count) {
    document.querySelectorAll('.ursac-notification-badge').forEach(badge => {
      if (count > 0) {
        badge.style.display = 'flex';
        badge.textContent = count > 99 ? '99+' : count;
      } else {
        badge.style.display = 'none';
      }
    });
  }

  // Helper function to get user name (placeholder - should be replaced with actual user data)
  // function getUserName(userId) {
  //   // In a real implementation, you would fetch the user's name from the database
  //   // For now, we'll return a placeholder
  //   return "User";
  // }

  // Helper function to format timestamps
  function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  }

  // Set up filter option click handlers
  filterOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Remove active class from all options
      filterOptions.forEach(opt => opt.classList.remove('active'));
      // Add active class to clicked option
      this.classList.add('active');
      // Apply the filter
      filterNotifications(this.getAttribute('data-filter'));
    });
  });
  
  // Set up mark all as read button
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', function() {
      markAllNotificationsAsRead();
    });
  }

  // Expose these functions globally
  window.handleNotificationClick = function(notificationId, postId) {
    if (!currentUser) return;

    // Mark notification as read
    firebase.database()
      .ref(`notifications/${currentUser.uid}/${notificationId}`)
      .update({ read: true })
      .then(() => {
        // Navigate to the post page with the post highlighted
        window.location.href = `/homepage?highlight=${postId}`;
      })
      .catch(error => {
        console.error("Error marking notification as read:", error);
      });
  };
  
  window.markNotificationAsRead = function(notificationId, event) {
    if (!currentUser) return;
    
    // Stop the click event from bubbling up to the parent
    if (event) {
      event.stopPropagation();
    }

    firebase.database()
      .ref(`notifications/${currentUser.uid}/${notificationId}`)
      .update({ read: true })
      .then(() => {
        // Update UI
        const notifElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (notifElement) {
          notifElement.classList.remove('unread');
          const markReadBtn = notifElement.querySelector('.ursac-mark-read-button');
          if (markReadBtn) {
            markReadBtn.remove();
          }
        }
        
        // If we're on the unread filter, we might need to refresh the list
        if (currentFilter === 'unread') {
          filterNotifications('unread');
        }
      })
      .catch(error => {
        console.error("Error marking notification as read:", error);
      });
  };

  window.markAllNotificationsAsRead = function() {
    if (!currentUser) return;

    const updates = {};
    allNotifications.forEach(notif => {
      if (!notif.read) {
        updates[`${notif.id}/read`] = true;
      }
    });
    
    if (Object.keys(updates).length === 0) {
      return; // No unread notifications
    }
    
    firebase.database()
      .ref(`notifications/${currentUser.uid}`)
      .update(updates)
      .then(() => {
        // Update UI based on current filter
        filterNotifications(currentFilter);
        
        // Update notification badge
        updateNotificationBadge(0);
      })
      .catch(error => {
        console.error("Error marking all notifications as read:", error);
      });
  };

  // Add some CSS for notification badge positioning
  const style = document.createElement('style');
  style.textContent = `
    .ursac-notification-indicator {
      position: relative;
    }
    .ursac-notification-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background-color: #ff4444;
      color: white;
      border-radius: 50%;
      min-width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: bold;
      padding: 0 4px;
      z-index: 100;
    }
    .ursac-notification-item {
      display: flex;
      padding: 15px;
      border-bottom: 1px solid #eee;
      transition: background-color 0.2s;
    }
    .ursac-notification-item:hover {
      background-color: #f9f9f9;
    }
    .ursac-notification-item.unread {
      background-color: #f0f7ff;
    }
    .ursac-notification-icon {
      margin-right: 15px;
      color: #4a76a8;
      font-size: 20px;
      width: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ursac-notification-content {
      flex: 1;
    }
    .ursac-notification-text {
      margin-bottom: 5px;
    }
    .ursac-notification-preview {
      color: #666;
      font-style: italic;
      margin-top: 5px;
    }
    .ursac-notification-meta {
      font-size: 12px;
      color: #888;
    }
    .ursac-notification-actions {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .ursac-view-button, .ursac-mark-read-button {
      padding: 5px 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .ursac-view-button {
      background-color: #4a76a8;
      color: white;
    }
    .ursac-mark-read-button {
      background-color: #e0e0e0;
      color: #333;
    }
    .ursac-notifications-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 50px 0;
      color: #888;
    }
    .ursac-notifications-empty i {
      font-size: 40px;
      margin-bottom: 15px;
      color: #ccc;
    }
    .ursac-notifications-filters {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      border-bottom: 1px solid #eee;
    }
    .ursac-filter-options {
      display: flex;
      gap: 15px;
    }
    .ursac-filter-option {
      cursor: pointer;
      padding: 5px 10px;
      border-radius: 15px;
      transition: background-color 0.2s;
    }
    .ursac-filter-option:hover {
      background-color: #f0f0f0;
    }
    .ursac-filter-option.active {
      background-color: #4a76a8;
      color: white;
    }
    .ursac-mark-all-read {
      cursor: pointer;
      color: #4a76a8;
      font-weight: 500;
    }
    .ursac-mark-all-read:hover {
      text-decoration: underline;
    }
  `;
  document.head.appendChild(style);


  // Ensure Firebase and authentication are initialized
window.handleForumNotificationClick = (notificationId, forumId) => {
  // Check if the user is logged in
  const currentUser = firebase.auth().currentUser;
  if (!currentUser) {
    console.log("User is not logged in.");
    return;
  }

  // Mark notification as read in Firebase
  firebase
    .database()
    .ref(`notifications/${currentUser.uid}/${notificationId}`)
    .update({ read: true })
    .then(() => {
      console.log("Notification marked as read.");

      // Navigate to the forum page
      window.location.href = `/forum/${forumId}`;
    })
    .catch((error) => {
      console.error("Error marking notification as read:", error);
    });
};

  // Make sure all notification bell icons have the proper container
  document.querySelectorAll('.notification-bell').forEach(bell => {
    // If bell is not already in a container with relative positioning
    if (!bell.parentElement.classList.contains('notification-bell-container')) {
      // Create container
      const container = document.createElement('div');
      container.className = 'notification-bell-container';
      // Insert container before bell
      bell.parentNode.insertBefore(container, bell);
      // Move bell into container
      container.appendChild(bell);
      
      // Add badge if not exists
      if (!container.querySelector('.ursac-notification-badge')) {
        const badge = document.createElement('span');
        badge.className = 'ursac-notification-badge';
        badge.style.display = 'none';
        container.appendChild(badge);
      }
    }
  });

  // Start loading notifications
  loadNotifications();
});