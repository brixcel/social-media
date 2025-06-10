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
        setupProfileUpdateListener()
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
        return firebase
          .database()
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

          if (notif.type === "comment") {
            categoryIcon = '<i class="fas fa-comment"></i>'
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
          } else if (notif.type === "forum_created") {
            categoryIcon = '<i class="fas fa-comments"></i>'
            notifContent = `
          <strong>${userName}</strong> created a new forum: 
          <div class="ursac-notification-preview">"${(notif.message || "").substring(0, 50)}${(notif.message || "").length > 50 ? "..." : ""}"</div>
        `
          } else if (notif.type === "forum_joined") {
            categoryIcon = '<i class="fas fa-users"></i>'
            notifContent = `
          <strong>${userName}</strong> joined the forum: 
          <div class="ursac-notification-preview">"${(notif.message || "").substring(0, 50)}${(notif.message || "").length > 50 ? "..." : ""}"</div>
        `
          }

          return `
        <div class="ursac-notification-item ${notif.read ? "" : "unread"}" 
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
            <button class="ursac-view-button" onclick="event.preventDefault(); event.stopPropagation(); handleNotificationView('${notif.id}', '${notif.postId}', '${notif.type}', '${notif.commentId || ""}', '${notif.userId}');">View</button>
            ${!notif.read ? `<button class="ursac-mark-read-button" onclick="event.preventDefault(); event.stopPropagation(); markNotificationAsRead('${notif.id}', event);">Mark as read</button>` : ""}
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
      window.markAllNotificationsAsRead()
    })
  }

  // Function to handle notification view - redirects to homepage with modal
  window.handleNotificationView = async (notificationId, postId, notificationType, commentId, userId) => {
    console.log("Handling notification view:", { notificationId, postId, notificationType, commentId, userId })

    if (!currentUser) {
      console.error("No current user")
      return
    }

    try {
      // Mark notification as read first
      await firebase.database().ref(`notifications/${currentUser.uid}/${notificationId}`).update({ read: true })

      // Store notification data in sessionStorage for the homepage to use
      const notificationData = {
        notificationId,
        postId,
        notificationType,
        commentId,
        userId,
        timestamp: Date.now(),
      }

      sessionStorage.setItem("pendingNotificationModal", JSON.stringify(notificationData))

      // Redirect to homepage with parameters
      const params = new URLSearchParams({
        showPost: postId,
        notificationType: notificationType,
        notificationId: notificationId,
      })

      if (commentId) {
        params.append("commentId", commentId)
      }

      if (userId) {
        params.append("userId", userId)
      }

      // Navigate to homepage
      window.location.href = `/homepage?${params.toString()}`
    } catch (error) {
      console.error("Error handling notification view:", error)
    }
  }

  // Function to check if we're on homepage and should show modal
  window.checkForNotificationModal = () => {
    // Check if we're on the homepage
    if (window.location.pathname !== "/homepage" && window.location.pathname !== "/") {
      return
    }

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const showPostId = urlParams.get("showPost")
    const notificationType = urlParams.get("notificationType")
    const notificationId = urlParams.get("notificationId")
    const commentId = urlParams.get("commentId")
    const userId = urlParams.get("userId")

    // Check sessionStorage for notification data
    const pendingModalData = sessionStorage.getItem("pendingNotificationModal")

    if (showPostId && notificationType && (pendingModalData || notificationId)) {
      let modalData

      if (pendingModalData) {
        modalData = JSON.parse(pendingModalData)
        sessionStorage.removeItem("pendingNotificationModal")
      } else {
        modalData = {
          notificationId,
          postId: showPostId,
          notificationType,
          commentId,
          userId,
        }
      }

      // Small delay to ensure homepage is fully loaded
      setTimeout(() => {
        window.openPostModalOnHomepage(modalData)

        // Clean up URL parameters
        const newUrl = window.location.pathname
        window.history.replaceState({}, document.title, newUrl)
      }, 500)
    }
  }

  // Function to open post modal on homepage
  window.openPostModalOnHomepage = async (modalData) => {
    const { notificationId, postId, notificationType, commentId, userId } = modalData

    console.log("Opening post modal on homepage:", modalData)

    // Create modal if it doesn't exist
    createPostModal()

    const modal = document.getElementById("post-modal")
    if (!modal) {
      console.error("Modal not found after creation")
      return
    }

    const modalBody = modal.querySelector(".post-modal-body")
    const modalLoading = modal.querySelector(".post-modal-loading")
    const modalError = modal.querySelector(".post-modal-error")
    const contextIcon = modal.querySelector(".notification-context-icon")
    const contextText = modal.querySelector(".notification-context-text")

    // Show modal and loading state
    modal.style.display = "flex"
    modalLoading.style.display = "block"
    modalBody.style.display = "none"
    modalError.style.display = "none"

    try {
      // Fetch post data
      console.log("Fetching post data for:", postId)
      const postSnapshot = await firebase.database().ref(`posts/${postId}`).once("value")
      const postData = postSnapshot.val()

      if (!postData) {
        throw new Error("Post not found")
      }

      // Fetch post author data
      const authorSnapshot = await firebase.database().ref(`users/${postData.userId}`).once("value")
      const authorData = authorSnapshot.val() || { firstName: "Unknown", lastName: "User" }

      // Fetch notification user data for context
      let notificationUserData = { firstName: "Unknown", lastName: "User" }
      if (userId) {
        const userSnapshot = await firebase.database().ref(`users/${userId}`).once("value")
        notificationUserData = userSnapshot.val() || notificationUserData
      }

      // Set notification context
      const userName = `${notificationUserData.firstName || ""} ${notificationUserData.lastName || ""}`.trim()
      let contextHTML = ""
      let iconClass = ""

      switch (notificationType) {
        case "like":
          iconClass = "fas fa-thumbs-up"
          contextHTML = `${userName} liked this post`
          break
        case "comment":
          iconClass = "fas fa-comment"
          contextHTML = `${userName} commented on this post`
          break
        case "reply":
          iconClass = "fas fa-reply"
          contextHTML = `${userName} replied to your comment`
          break
        case "mention":
          iconClass = "fas fa-at"
          contextHTML = `${userName} mentioned you in a comment`
          break
        default:
          iconClass = "fas fa-bell"
          contextHTML = "Notification"
      }

      contextIcon.className = `notification-context-icon ${iconClass}`
      contextText.innerHTML = contextHTML

      // Fetch comments if they exist
      let commentsData = {}
      if (postData.comments) {
        const commentsSnapshot = await firebase.database().ref(`comments/${postId}`).once("value")
        commentsData = commentsSnapshot.val() || {}
      }

      // Hide loading, show content
      modalLoading.style.display = "none"
      modalBody.style.display = "block"

      // Render post content
      modalBody.innerHTML = await renderPostInModal(postData, authorData, commentsData, commentId, notificationType)

      // Scroll to highlighted comment if exists
      if (commentId) {
        setTimeout(() => {
          const highlightedComment = modal.querySelector(`[data-comment-id="${commentId}"]`)
          if (highlightedComment) {
            highlightedComment.scrollIntoView({ behavior: "smooth", block: "center" })
          }
        }, 100)
      }
    } catch (error) {
      console.error("Error loading post:", error)
      modalLoading.style.display = "none"
      modalError.style.display = "block"
    }
  }

  // Create and inject modal HTML
  function createPostModal() {
    // Remove existing modal if it exists
    const existingModal = document.getElementById("post-modal")
    if (existingModal) {
      existingModal.remove()
    }

    const modalHTML = `
    <div id="post-modal" class="post-modal-overlay" style="display: none;">
      <div class="post-modal-container">
        <div class="post-modal-header">
          <div class="notification-context">
            <i class="notification-context-icon"></i>
            <span class="notification-context-text"></span>
          </div>
          <button class="post-modal-close" onclick="closePostModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="post-modal-content">
          <div class="post-modal-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading post...</p>
          </div>
          <div class="post-modal-error" style="display: none;">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Failed to load post</p>
            <button onclick="closePostModal()" class="retry-button">Close</button>
          </div>
          <div class="post-modal-body" style="display: none;">
            <!-- Post content will be loaded here -->
          </div>
        </div>
      </div>
    </div>
  `

    // Insert modal into body
    document.body.insertAdjacentHTML("beforeend", modalHTML)
  }

  // Function to render post content in modal
  async function renderPostInModal(postData, authorData, commentsData, highlightCommentId, notificationType) {
    const authorName = `${authorData.firstName || ""} ${authorData.lastName || ""}`.trim()
    const postDate = new Date(postData.timestamp).toLocaleDateString()

    let postContent = `
    <div class="modal-post-card">
      <div class="modal-post-header">
        <div class="modal-post-author">
          <div class="modal-author-avatar">
            ${
              authorData.profilePicture
                ? `<img src="${authorData.profilePicture}" alt="${authorName}">`
                : `<div class="modal-avatar-placeholder">${authorName.charAt(0).toUpperCase()}</div>`
            }
          </div>
          <div class="modal-author-info">
            <h4>${authorName}</h4>
            <span class="modal-post-date">${postDate}</span>
          </div>
        </div>
      </div>
      <div class="modal-post-content">
        <p>${postData.content || ""}</p>
        ${postData.imageUrl ? `<img src="${postData.imageUrl}" alt="Post image" class="modal-post-image">` : ""}
      </div>
      <div class="modal-post-stats">
        <span><i class="fas fa-thumbs-up"></i> ${postData.likes || 0} likes</span>
        <span><i class="fas fa-comment"></i> ${Object.keys(commentsData).length} comments</span>
      </div>
    </div>
  `

    // Add comments section if there are comments
    if (Object.keys(commentsData).length > 0) {
      postContent += `<div class="modal-comments-section"><h5>Comments</h5>`

      for (const [commentId, comment] of Object.entries(commentsData)) {
        // Fetch commenter data
        try {
          const commenterSnapshot = await firebase.database().ref(`users/${comment.userId}`).once("value")
          const commenterData = commenterSnapshot.val() || { firstName: "Unknown", lastName: "User" }
          const commenterName = `${commenterData.firstName || ""} ${commenterData.lastName || ""}`.trim()

          const isHighlighted = commentId === highlightCommentId
          const commentDate = new Date(comment.timestamp).toLocaleDateString()

          postContent += `
          <div class="modal-comment ${isHighlighted ? "highlighted-comment" : ""}" data-comment-id="${commentId}">
            <div class="modal-comment-author">
              <div class="modal-commenter-avatar">
                ${
                  commenterData.profilePicture
                    ? `<img src="${commenterData.profilePicture}" alt="${commenterName}">`
                    : `<div class="modal-avatar-placeholder">${commenterName.charAt(0).toUpperCase()}</div>`
                }
              </div>
              <div class="modal-comment-info">
                <strong>${commenterName}</strong>
                <span class="modal-comment-date">${commentDate}</span>
              </div>
            </div>
            <div class="modal-comment-text">
              ${comment.text || ""}
            </div>
          </div>
        `
        } catch (error) {
          console.error("Error fetching commenter data:", error)
        }
      }

      postContent += `</div>`
    }

    return postContent
  }

  // Function to close modal
  window.closePostModal = () => {
    const modal = document.getElementById("post-modal")
    if (modal) {
      modal.style.display = "none"
    }
  }

  // Close modal when clicking outside
  document.addEventListener("click", (event) => {
    const modal = document.getElementById("post-modal")
    if (modal && event.target === modal) {
      window.closePostModal()
    }
  })

  // Close modal with Escape key
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      window.closePostModal()
    }
  })

  // Legacy functions for backward compatibility
  window.handleNotificationClick = (notificationId, postId) => {
    window.handleNotificationView(notificationId, postId, "general", "", "")
  }

  window.handlePostNotificationClick = (notificationId, postId, notificationType, commentId) => {
    window.handleNotificationView(notificationId, postId, notificationType, commentId, "")
  }

  window.handleMessageNotificationClick = (notificationId, conversationId, userId, messageId) => {
    if (!currentUser) return

    // Mark notification as read
    firebase
      .database()
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
        console.error("Error handling message notification:", error)
      })
  }

  window.markNotificationAsRead = (notificationId, event) => {
    if (!currentUser) return

    // Stop the click event from bubbling up to the parent
    if (event) {
      event.stopPropagation()
    }

    firebase
      .database()
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
        console.error("Error marking notification as read:", error)
      })
  }

  window.markAllNotificationsAsRead = () => {
    if (!currentUser) return

    const updates = {}
    allNotifications.forEach((notif) => {
      if (!notif.read) {
        updates[`${notif.id}/read`] = true
      }
    })

    if (Object.keys(updates).length === 0) {
      return // No unread notifications
    }

    firebase
      .database()
      .ref(`notifications/${currentUser.uid}`)
      .update(updates)
      .then(() => {
        // Update UI based on current filter
        filterNotifications(currentFilter)

        // Update notification badge
        updateNotificationBadge(0)
      })
      .catch((error) => {
        console.error("Error marking all notifications as read:", error)
      })
  }

  // Add CSS styles for modal and notifications
  const style = document.createElement("style")
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
    
    /* Modal Styles */
    .post-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .post-modal-container {
      background: white;
      border-radius: 12px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }
    
    .post-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #eee;
      background: #f8f9fa;
    }
    
    .notification-context {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      color: #333;
    }
    
    .notification-context-icon {
      font-size: 18px;
      color: #007bff;
    }
    
    .post-modal-close {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #666;
      padding: 5px;
      border-radius: 50%;
      transition: background-color 0.2s;
    }
    
    .post-modal-close:hover {
      background-color: #f0f0f0;
    }
    
    .post-modal-content {
      max-height: calc(80vh - 80px);
      overflow-y: auto;
    }
    
    .post-modal-loading,
    .post-modal-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #666;
    }
    
    .post-modal-loading i {
      font-size: 24px;
      margin-bottom: 10px;
    }
    
    .post-modal-error {
      color: #dc3545;
    }
    
    .modal-post-card {
      padding: 20px;
    }
    
    .modal-post-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .modal-post-author {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .modal-author-avatar,
    .modal-commenter-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
    }
    
    .modal-author-avatar img,
    .modal-commenter-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .modal-avatar-placeholder {
      width: 100%;
      height: 100%;
      background: #007bff;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16px;
    }
    
    .modal-author-info h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .modal-post-date,
    .modal-comment-date {
      font-size: 12px;
      color: #666;
    }
    
    .modal-post-content {
      margin-bottom: 15px;
    }
    
    .modal-post-content p {
      margin: 0 0 10px 0;
      line-height: 1.5;
    }
    
    .modal-post-image {
      width: 100%;
      max-height: 300px;
      object-fit: cover;
      border-radius: 8px;
      margin-top: 10px;
    }
    
    .modal-post-stats {
      display: flex;
      gap: 20px;
      padding: 15px 0;
      border-bottom: 1px solid #eee;
      color: #666;
      font-size: 14px;
    }
    
    .modal-post-stats i {
      margin-right: 5px;
    }
    
    .modal-comments-section {
      padding-top: 20px;
    }
    
    .modal-comments-section h5 {
      margin: 0 0 15px 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .modal-comment {
      padding: 15px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .modal-comment:last-child {
      border-bottom: none;
    }
    
    .modal-comment-author {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    
    .modal-commenter-avatar {
      width: 32px;
      height: 32px;
    }
    
    .modal-comment-info {
      display: flex;
      flex-direction: column;
    }
    
    .modal-comment-info strong {
      font-size: 14px;
    }
    
    .modal-comment-text {
      margin-left: 42px;
      line-height: 1.4;
    }
    
    .highlighted-comment {
      background-color: rgba(255, 236, 179, 0.3);
      border-radius: 8px;
      padding: 15px !important;
      margin: 10px 0;
      animation: highlight-comment 2s ease-out;
    }
    
    @keyframes highlight-comment {
      0% {
        background-color: rgba(255, 236, 179, 0.6);
      }
      100% {
        background-color: rgba(255, 236, 179, 0.3);
      }
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
      .post-modal-container {
        width: 95%;
        max-height: 90vh;
      }
      
      .post-modal-header {
        padding: 15px;
      }
      
      .modal-post-card {
        padding: 15px;
      }
    }

    .retry-button {
      background: #007bff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
    }

    .retry-button:hover {
      background: #0056b3;
    }

    .ursac-view-button {
      background: #007bff;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }

    .ursac-view-button:hover {
      background: #0056b3;
    }

    .ursac-mark-read-button {
      background: #6c757d;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-left: 5px;
    }

    .ursac-mark-read-button:hover {
      background: #545b62;
    }
  `
  document.head.appendChild(style)

  // Make sure all notification bell icons have the proper container
  document.querySelectorAll(".notification-bell").forEach((bell) => {
    // If bell is not already in a container with relative positioning
    if (!bell.parentElement.classList.contains("notification-bell-container")) {
      // Create container
      const container = document.createElement("div")
      container.className = "notification-bell-container"
      // Insert container before bell
      bell.parentNode.insertBefore(container, bell)
      // Move bell into container
      container.appendChild(bell)

      // Add badge if not exists
      if (!container.querySelector(".ursac-notification-badge")) {
        const badge = document.createElement("span")
        badge.className = "ursac-notification-badge"
        badge.style.display = "none"
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

    // Check for notification modal parameters
    window.checkForNotificationModal()
  }

  // Initialize
  loadNotifications()

  // Check URL parameters after a short delay to ensure everything is loaded
  setTimeout(checkUrlParameters, 1000)
})

// Add this function to the notifications.js file
function setupProfileUpdateListener() {
  // Listen for profile updates from other pages
  document.addEventListener("profileUpdated", (event) => {
    const userId = event.detail.userId

    // If this is the current user, update the UI
    if (userId === window.currentUser?.uid) {
      window.loadUserProfile(window.currentUser)
    }
  })

  // Listen for changes to the profileUpdates node in Firebase
  window.firebase
    .database()
    .ref("profileUpdates")
    .on("child_changed", (snapshot) => {
      const userId = snapshot.key
      const timestamp = snapshot.val()

      // Update notification items from this user
      const notificationItems = document.querySelectorAll(`.ursac-notification-item[data-user-id="${userId}"]`)
      if (notificationItems.length > 0) {
        window.getUserData(userId).then((userData) => {
          notificationItems.forEach((item) => {
            const notificationText = item.querySelector(".ursac-notification-text")
            if (notificationText) {
              // Update user name in notification text
              const userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
              const oldText = notificationText.innerHTML
              // Replace the name in the notification text
              // This is a simple approach - you might need more complex logic depending on your notification format
              const newText = oldText.replace(/<strong>.*?<\/strong>/, `<strong>${userName}</strong>`)
              notificationText.innerHTML = newText
            }
          })
        })
      }
    })
}

// Declare global functions
window.checkForPostHighlight = () => {
  // Implementation for checkForPostHighlight
}

window.loadUserProfile = (user) => {
  // Implementation for loadUserProfile
}

window.getUserData = (userId) => {
  // Implementation for getUserData
}
