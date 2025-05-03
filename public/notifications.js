document.addEventListener("DOMContentLoaded", function () {
  const notificationsFeed = document.getElementById("notifications-feed");
  const notificationBadge = document.querySelector(".notification-badge");
  let unreadNotifications = 0;
  
  firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
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

  function setupNotificationListener(userId) {
      if (!userId) return;

      const notificationsRef = firebase.database()
          .ref('notifications')
          .orderByChild('recipientId')
          .equalTo(userId);

      notificationsRef.on('value', function(snapshot) {
          let unreadCount = 0;
          
          if (snapshot.exists()) {
              snapshot.forEach(notifSnapshot => {
                  const notifData = notifSnapshot.val();
                  if (notifData.items) {
                      Object.values(notifData.items).forEach(item => {
                          if (!item.read) unreadCount++;
                      });
                  }
              });
          }
          
          updateNotificationBadge(unreadCount);
      });
  }

  function updateNotificationsUI(notifications) {
      if (!notificationsFeed) return;

      if (notifications.length > 0) {
          notificationsFeed.innerHTML = notifications.map(notif => {
              let notifContent = '';
              let categoryIcon = '';
              
              if (notif.type === 'comment') {
                  categoryIcon = '<i class="fas fa-comment"></i>';
                  notifContent = `
                      <strong>${notif.userFirstName} ${notif.userLastName}</strong> commented on your post:
                      <div class="ursac-notification-preview">"${notif.commentText.substring(0, 50)}${notif.commentText.length > 50 ? '...' : ''}"</div>
                  `;
              } else if (notif.type === 'like') {
                  categoryIcon = '<i class="fas fa-thumbs-up"></i>';
                  notifContent = `<strong>${notif.userFirstName} ${notif.userLastName}</strong> liked your post`;
              }

              return `
                  <div class="ursac-notification-item ${notif.read ? '' : 'unread'}" 
                       onclick="handleNotificationClick('${notif.id}', '${notif.postId}')">
                      <div class="ursac-notification-icon">
                          ${categoryIcon}
                      </div>
                      <div class="ursac-notification-content">
                          <div class="ursac-notification-text">
                              ${notifContent}
                          </div>
                          <div class="ursac-notification-meta">
                              <span class="ursac-notification-time">${formatTimestamp(notif.timestamp)}</span>
                          </div>
                      </div>
                      <div class="ursac-notification-actions">
                          <button class="ursac-view-button">View</button>
                      </div>
                  </div>
              `;
          }).join('');
      } else {
          notificationsFeed.innerHTML = `
              <div class="ursac-notifications-empty">
                  <i class="fas fa-bell"></i>
                  <p>No notifications yet</p>
              </div>
          `;
      }
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

  // Expose these functions globally
  window.handleNotificationClick = function(notificationId, postId) {
      if (!firebase.auth().currentUser) return;

      // Mark notification as read
      firebase.database()
          .ref(`notifications/${postId}/items/${notificationId}`)
          .update({ read: true })
          .then(() => {
              // Redirect to the post
              window.location.href = `/post/${postId}`;
          })
          .catch(error => {
              console.error("Error marking notification as read:", error);
          });
  };

  window.markAllNotificationsAsRead = function() {
      const user = firebase.auth().currentUser;
      if (!user) return;

      firebase.database()
          .ref('notifications')
          .orderByChild('recipientId')
          .equalTo(user.uid)
          .once('value')
          .then(snapshot => {
              const updates = {};
              snapshot.forEach(child => {
                  if (child.val().items) {
                      Object.keys(child.val().items).forEach(itemKey => {
                          updates[`${child.key}/items/${itemKey}/read`] = true;
                      });
                  }
              });
              if (Object.keys(updates).length > 0) {
                  return firebase.database().ref('notifications').update(updates);
              }
          })
          .then(() => {
              updateNotificationBadge(0);
          })
          .catch(error => {
              console.error("Error marking all notifications as read:", error);
          });
  };

  // Helper function to format timestamps
  function formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
      if (diff < 604800000) return `${Math.floor(diff/86400000)}d ago`;
      
      return date.toLocaleDateString();
  }
});