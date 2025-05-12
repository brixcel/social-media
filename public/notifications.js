document.addEventListener("DOMContentLoaded", () => {
  // Firebase references
  const firebase = window.firebase
  const database = firebase.database()

  // DOM Elements
  const notificationsFeed = document.getElementById("notifications-feed")
  const markAllReadBtn = document.getElementById("mark-all-read")
  const filterOptions = document.querySelectorAll(".ursac-filter-option")
  const notificationBadge = document.querySelector(".ursac-notification-badge")
  const notificationIndicator = document.querySelector(".ursac-notification-indicator")

  // Variables
  let currentFilter = "all"
  let allNotifications = []
  let currentUser = null
  const userDataCache = {} // Cache for user data to avoid repeated fetches

  // Function to load notifications
  function loadNotifications() {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        currentUser = user
        setupNotificationListener(user.uid)
      } else {
        // For testing purposes only (remove in production):
        currentUser = {
          uid: "mockuser123",
          email: "test@example.com",
          displayName: "Test User",
        }

        if (notificationsFeed) {
          notificationsFeed.innerHTML = `
            <div class="ursac-notification-item">
              <div class="ursac-notification-content">
                <div class="ursac-notification-text">
                  Please log in to view notifications.
                </div>
              </div>
            </div>
          `
        }
      }
    })
  }

  function setupNotificationListener(userId) {
    if (!userId) return

    const notificationsRef = database.ref(`notifications/${userId}`)

    notificationsRef.on("value", (snapshot) => {
      let unreadCount = 0
      allNotifications = []

      if (snapshot && snapshot.exists()) {
        snapshot.forEach((notifSnapshot) => {
          const notification = notifSnapshot.val()
          if (!notification.read) unreadCount++

          // Add to the notifications array for UI rendering
          allNotifications.push({
            id: notifSnapshot.key,
            ...notification,
          })
        })

        // Sort notifications by timestamp (newest first)
        allNotifications.sort((a, b) => b.timestamp - a.timestamp)

        // Update UI based on current filter
        filterNotifications(currentFilter)
      } else {
        showEmptyState()
      }

      updateNotificationBadge(unreadCount)
    })
  }

  function filterNotifications(filter) {
    currentFilter = filter

    if (allNotifications.length === 0) {
      showEmptyState()
      return
    }

    let filteredNotifications

    switch (filter) {
      case "unread":
        filteredNotifications = allNotifications.filter((notif) => !notif.read)
        break
      case "mentions":
        filteredNotifications = allNotifications.filter(
          (notif) =>
            notif.type === "comment" &&
            notif.commentText &&
            notif.commentText.includes(`@${currentUser?.displayName || ""}`),
        )
        break
      case "all":
      default:
        filteredNotifications = allNotifications
        break
    }

    if (filteredNotifications.length === 0) {
      showEmptyStateForFilter(filter)
    } else {
      updateNotificationsUI(filteredNotifications)
    }
  }

  function showEmptyState() {
    if (!notificationsFeed) return

    notificationsFeed.innerHTML = `
      <div class="ursac-notifications-empty">
        <i class="fas fa-bell-slash"></i>
        <p>No notifications yet</p>
      </div>
    `
  }

  function showEmptyStateForFilter(filter) {
    if (!notificationsFeed) return

    let message = ""
    switch (filter) {
      case "unread":
        message = "No unread notifications"
        break
      case "mentions":
        message = "No mentions yet"
        break
      default:
        message = "No notifications yet"
    }

    notificationsFeed.innerHTML = `
      <div class="ursac-notifications-empty">
        <i class="fas fa-bell-slash"></i>
        <p>${message}</p>
      </div>
    `
  }

  function updateNotificationsUI(notifications) {
    if (!notificationsFeed) return

    // First, fetch all user data needed for these notifications
    const userIds = [...new Set(notifications.map((notif) => notif.userId))]

    // Fetch user data for all users in the notifications
    Promise.all(
      userIds.map((userId) => {
        // Check if we already have this user's data in cache
        if (userDataCache[userId]) {
          return Promise.resolve(userDataCache[userId])
        }

        // Fetch user data from Firebase
        return database
          .ref(`users/${userId}`)
          .once("value")
          .then((snapshot) => {
            const userData = snapshot.val()
            if (userData) {
              // Store in cache for future use
              userDataCache[userId] = userData
              return userData
            }
            return null
          })
      }),
    ).then(() => {
      // Now render notifications with user data
      notificationsFeed.innerHTML = notifications
        .map((notif) => {
          let notifContent = ""
          let categoryIcon = ""
          const userData = userDataCache[notif.userId] || { firstName: "Unknown", lastName: "User" }
          const userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()

          if (notif.type === "message") {
            categoryIcon = '<i class="fas fa-comment"></i>'
            notifContent = `
            <strong>${userName}</strong> sent you a message:
            <div class="ursac-notification-preview">"${(notif.commentText || "").substring(0, 50)}${(notif.commentText || "").length > 50 ? "..." : ""}"</div>
          `
          } else if (notif.type === "comment") {
            categoryIcon = '<i class="fas fa-comment-dots"></i>'
            notifContent = `
            <strong>${userName}</strong> commented on your post:
            <div class="ursac-notification-preview">"${(notif.commentText || "").substring(0, 50)}${(notif.commentText || "").length > 50 ? "..." : ""}"</div>
          `
          } else if (notif.type === "like") {
            categoryIcon = '<i class="fas fa-thumbs-up"></i>'
            notifContent = `<strong>${userName}</strong> liked your post`
          } else if (notif.type === "mention") {
            categoryIcon = '<i class="fas fa-at"></i>'
            notifContent = `<strong>${userName}</strong> mentioned you in a comment`
          } else if (notif.type === "reply") {
            categoryIcon = '<i class="fas fa-reply"></i>'
            notifContent = `
            <strong>${userName}</strong> replied to your comment:
            <div class="ursac-notification-preview">"${(notif.commentText || "").substring(0, 50)}${(notif.commentText || "").length > 50 ? "..." : ""}"</div>
          `
          }

          // Create action buttons based on notification type
          let actionButtons = ""

          if (notif.type === "message") {
            actionButtons = `
            <button class="ursac-view-button" onclick="handleMessageNotificationClick('${notif.id}', '${notif.conversationId}', '${notif.userId}', '${notif.messageId || ""}')">View</button>
          `
          } else if (notif.type === "like" || notif.type === "comment" || notif.type === "reply" || notif.type === "mention") {
            actionButtons = `
            <button class="ursac-view-button" onclick="handlePostNotificationClick('${notif.id}', '${notif.postId}', '${notif.type}', '${notif.commentId || ""}')">View</button>
          `
          } else {
            actionButtons = `
            <button class="ursac-view-button" onclick="handleNotificationClick('${notif.id}', '${notif.postId}')">View</button>
          `
          }

          if (!notif.read) {
            actionButtons += `<button class="ursac-mark-read-button" onclick="markNotificationAsRead('${notif.id}', event)">Mark as read</button>`
          }

          return `
          <div class="ursac-notification-item ${notif.read ? "" : "unread"}" 
               data-notification-id="${notif.id}" 
               data-post-id="${notif.postId || ""}"
               data-conversation-id="${notif.conversationId || ""}"
               data-message-id="${notif.messageId || ""}"
               data-comment-id="${notif.commentId || ""}">
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
              ${actionButtons}
            </div>
          </div>
        `
        })
        .join("")
    })
  }

  function updateNotificationBadge(count) {
    document.querySelectorAll(".ursac-notification-badge").forEach((badge) => {
      if (count > 0) {
        badge.style.display = "flex"
        badge.textContent = count > 99 ? "99+" : count
      } else {
        badge.style.display = "none"
      }
    })
  }

  // Helper function to format timestamps
  function formatTimeAgo(timestamp) {
    if (!timestamp) return "Unknown"

    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return "Just now"

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    const options = { year: "numeric", month: "short", day: "numeric" }
    return date.toLocaleDateString(undefined, options)
  }

  // Set up filter option click handlers
  if (filterOptions) {
    filterOptions.forEach((option) => {
      option.addEventListener("click", function () {
        // Remove active class from all options
        filterOptions.forEach((opt) => opt.classList.remove("active"))
        // Add active class to clicked option
        this.classList.add("active")
        // Apply the filter
        filterNotifications(this.getAttribute("data-filter"))
      })
    })
  }

  // Set up mark all as read button
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", () => {
      markAllNotificationsAsRead()
    })
  }

  // Check if we're on the homepage and need to highlight a post
  function checkForPostHighlight() {
    const urlParams = new URLSearchParams(window.location.search)
    const highlightPostId = urlParams.get("highlight")
    const highlightCommentId = urlParams.get("comment")
    
    if (highlightPostId) {
      // Find the post element
      const postElement = document.querySelector(`.ursac-post-card[data-post-id="${highlightPostId}"]`)
      
      if (postElement) {
        // Scroll to the post
        postElement.scrollIntoView({ behavior: "smooth", block: "center" })
        
        // Highlight the post
        postElement.classList.add("ursac-post-highlight")
        
        // Remove highlight after animation completes
        setTimeout(() => {
          postElement.classList.remove("ursac-post-highlight")
        }, 2000)
        
        // If there's a specific comment to highlight
        if (highlightCommentId) {
          setTimeout(() => {
            const commentElement = document.querySelector(`.ursac-comment[data-comment-id="${highlightCommentId}"]`)
            if (commentElement) {
              // Expand comments section if it's collapsed
              const commentsSection = postElement.querySelector('.ursac-post-comments')
              if (commentsSection && commentsSection.style.display === 'none') {
                const commentToggle = postElement.querySelector('.ursac-post-stat[data-action="comment"]')
                if (commentToggle) {
                  commentToggle.click()
                }
              }
              
              // Scroll to the comment
              commentElement.scrollIntoView({ behavior: "smooth", block: "center" })
              
              // Highlight the comment
              commentElement.classList.add("ursac-comment-highlight")
              
              // Remove highlight after animation completes
              setTimeout(() => {
                commentElement.classList.remove("ursac-comment-highlight")
              }, 2000)
            }
          }, 500) // Small delay to ensure comments are loaded
        }
        
        // Clean up the URL
        const newUrl = window.location.pathname
        window.history.replaceState({}, document.title, newUrl)
      }
    }
  }

  // Expose these functions globally
  window.handleNotificationClick = function(notificationId, postId) {
    if (!currentUser) return

    // Mark notification as read
    firebase.database()
      .ref(`notifications/${currentUser.uid}/${notificationId}`)
      .update({ read: true })
      .then(() => {
        // Navigate to the post page with the post highlighted
        window.location.href = `/homepage?highlight=${postId}`
      })
      .catch((error) => {
        // Error handling
      })
  }

  window.handlePostNotificationClick = function(notificationId, postId, notificationType, commentId) {
    if (!currentUser) return

    // Mark notification as read
    firebase.database()
      .ref(`notifications/${currentUser.uid}/${notificationId}`)
      .update({ read: true })
      .then(() => {
        // If we're already on the homepage
        if (window.location.pathname === '/homepage' || window.location.pathname === '/') {
          // Find the post element
          const postElement = document.querySelector(`.ursac-post-card[data-post-id="${postId}"]`)
          
          if (postElement) {
            // Scroll to the post
            postElement.scrollIntoView({ behavior: "smooth", block: "center" })
            
            // Highlight the post
            postElement.classList.add("ursac-post-highlight")
            
            // Remove highlight after animation completes
            setTimeout(() => {
              postElement.classList.remove("ursac-post-highlight")
            }, 2000)
            
            // If it's a comment notification and we have a comment ID
            if ((notificationType === 'comment' || notificationType === 'reply') && commentId) {
              setTimeout(() => {
                // Expand comments section if it's collapsed
                const commentsSection = postElement.querySelector('.ursac-post-comments')
                if (commentsSection && commentsSection.style.display === 'none') {
                  const commentToggle = postElement.querySelector('.ursac-post-stat[data-action="comment"]')
                  if (commentToggle) {
                    commentToggle.click()
                  }
                }
                
                // Find and highlight the specific comment
                const commentElement = document.querySelector(`.ursac-comment[data-comment-id="${commentId}"]`)
                if (commentElement) {
                  commentElement.scrollIntoView({ behavior: "smooth", block: "center" })
                  commentElement.classList.add("ursac-comment-highlight")
                  
                  setTimeout(() => {
                    commentElement.classList.remove("ursac-comment-highlight")
                  }, 2000)
                }
              }, 500) // Small delay to ensure comments are loaded
            }
          } else {
            // If post not found on current page, navigate to homepage with parameters
            window.location.href = commentId 
              ? `/homepage?highlight=${postId}&comment=${commentId}` 
              : `/homepage?highlight=${postId}`
          }
        } else {
          // Navigate to the homepage with parameters
          window.location.href = commentId 
            ? `/homepage?highlight=${postId}&comment=${commentId}` 
            : `/homepage?highlight=${postId}`
        }
      })
      .catch((error) => {
        // Error handling
      })
  }

  window.handleMessageNotificationClick = function(notificationId, conversationId, userId, messageId) {
    if (!currentUser) return

    // Mark notification as read
    firebase.database()
      .ref(`notifications/${currentUser.uid}/${notificationId}`)
      .update({ read: true })
      .then(() => {
        // If we're already on the messages page, just open the conversation
        if (window.location.href.includes("/messages")) {
          if (window.openConversationFromNotification) {
            window.openConversationFromNotification(conversationId, userId, messageId)
          }
        } else {
          // Navigate to the messages page with parameters to open this conversation
          window.location.href = `/messages?conversation=${conversationId}&user=${userId}&message=${messageId}`
        }
      })
      .catch((error) => {
        // Error handling
      })
  }

  window.markNotificationAsRead = function(notificationId, event) {
    if (!currentUser) return
    
    // Stop the click event from bubbling up to the parent
    if (event) {
      event.stopPropagation()
    }

    firebase.database()
      .ref(`notifications/${currentUser.uid}/${notificationId}`)
      .update({ read: true })
      .then(() => {
        // Update UI
        const notifElement = document.querySelector(`[data-notification-id="${notificationId}"]`)
        if (notifElement) {
          notifElement.classList.remove("unread")
          const markReadBtn = notifElement.querySelector(".ursac-mark-read-button")
          if (markReadBtn) {
            markReadBtn.remove()
          }
        }
        
        // If we're on the unread filter, we might need to refresh the list
        if (currentFilter === "unread") {
          filterNotifications("unread")
        }
      })
      .catch((error) => {
        // Error handling
      })
  }

  window.markAllNotificationsAsRead = function() {
    if (!currentUser) return

    const updates = {}
    allNotifications.forEach(notif => {
      if (!notif.read) {
        updates[`${notif.id}/read`] = true
      }
    })
    
    if (Object.keys(updates).length === 0) {
      return // No unread notifications
    }
    
    firebase.database()
      .ref(`notifications/${currentUser.uid}`)
      .update(updates)
      .then(() => {
        // Update UI based on current filter
        filterNotifications(currentFilter)
        
        // Update notification badge
        updateNotificationBadge(0)
      })
      .catch((error) => {
        // Error handling
      })
  }

  // Add some CSS for notification badge positioning
  const style = document.createElement('style')
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
    .ursac-post-highlight {
      animation: highlight-post 2s ease-out;
    }
    .ursac-comment-highlight {
      animation: highlight-comment 2s ease-out;
    }
    @keyframes highlight-post {
      0% {
        background-color: rgba(255, 236, 179, 0.3);
        transform: scale(1.01);
        box-shadow: 0 0 15px rgba(255, 193, 7, 0.5);
      }
      100% {
        background-color: white;
        transform: scale(1);
        box-shadow: var(--box-shadow);
      }
    }
    @keyframes highlight-comment {
      0% {
        background-color: rgba(255, 236, 179, 0.3);
      }
      100% {
        background-color: transparent;
      }
    }
  `
  document.head.appendChild(style)

  // Make sure all notification bell icons have the proper container
  document.querySelectorAll('.notification-bell').forEach(bell => {
    // If bell is not already in a container with relative positioning
    if (!bell.parentElement.classList.contains('notification-bell-container')) {
      // Create container
      const container = document.createElement('div')
      container.className = 'notification-bell-container'
      // Insert container before bell
      bell.parentNode.insertBefore(container, bell)
      // Move bell into container
      container.appendChild(bell)
      
      // Add badge if not exists
      if (!container.querySelector('.ursac-notification-badge')) {
        const badge = document.createElement('span')
        badge.className = 'ursac-notification-badge'
        badge.style.display = 'none'
        container.appendChild(badge)
      }
    }
  })

  // Check URL parameters for direct navigation from notifications
  function checkUrlParameters() {
    // Check for message parameters
    const urlParams = new URLSearchParams(window.location.search)
    const conversationId = urlParams.get("conversation")
    const userId = urlParams.get("user")
    const messageId = urlParams.get("message")

    if (conversationId && userId) {
      // If we have conversation parameters, open that conversation
      if (window.openConversationFromNotification) {
        window.openConversationFromNotification(conversationId, userId, messageId)

        // Clean up the URL
        const newUrl = window.location.pathname
        window.history.replaceState({}, document.title, newUrl)
      }
    }
    
    // Check for post highlight parameters
    if (window.location.pathname === '/homepage' || window.location.pathname === '/') {
      checkForPostHighlight()
    }
  }

  // Initialize
  loadNotifications()

  // Check URL parameters after a short delay to ensure everything is loaded
  setTimeout(checkUrlParameters, 1000)
})