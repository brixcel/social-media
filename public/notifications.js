/**
 * Updated Notifications System with Enhanced Profile Integration
 */

document.addEventListener("DOMContentLoaded", () => {
  // Firebase references
  const firebase = window.firebase
  const database = firebase.database()

  // Fallback user data fetching function if the global one isn't available
  async function fetchUserDataFallback(userId, maxRetries = 3) {
    if (!userId) {
      throw new Error("User ID is required")
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const snapshot = await database.ref(`users/${userId}`).once("value")

        if (snapshot.exists()) {
          return snapshot.val()
        } else {
          return null
        }
      } catch (error) {
        console.error(`Attempt ${attempt} failed for userId ${userId}:`, error)

        if (attempt === maxRetries) {
          throw error
        }

        // Wait before retrying
        const delay = Math.pow(2, attempt) * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  // Helper function to get initials if global function isn't available
  function getInitialsFallback(firstName, lastName) {
    if (!firstName && !lastName) return "?"

    let initials = ""
    if (firstName) initials += firstName.charAt(0).toUpperCase()
    if (lastName) initials += lastName.charAt(0).toUpperCase()
    return initials || "?"
  }

  // Profile management variables (same as comments.js)
  let currentUser = null
  let currentUserData = null

  // DOM Elements
  const notificationsFeed = document.getElementById("notifications-feed")
  const markAllReadBtn = document.getElementById("mark-all-read")
  const filterOptions = document.querySelectorAll(".ursac-filter-option")
  const notificationBadge = document.querySelector(".ursac-notification-badge")
  const notificationIndicator = document.querySelector(".ursac-notification-indicator")

  // Variables
  let currentFilter = "all"
  let allNotifications = []

  /**
   * Load current user's profile data with retry logic (same as comments.js)
   * @param {Object} user - Firebase user object
   */
  async function loadCurrentUserData(user) {
    if (!user) return

    try {
      // Use global function if available, otherwise use fallback
      const fetchFunction = window.fetchUserDataWithRetry || fetchUserDataFallback
      const userData = await fetchFunction(user.uid)

      if (userData) {
        currentUserData = userData
        console.log("Current user data loaded for notifications:", currentUserData)
        updateNotificationAvatars()
      } else {
        console.warn("Could not load full user data, using fallback")
        currentUserData = {
          firstName: user.displayName?.split(" ")[0] || "User",
          lastName: user.displayName?.split(" ")[1] || "",
          profileImageUrl: user.photoURL || null,
        }
        updateNotificationAvatars()
      }
    } catch (error) {
      console.error("Error loading current user data for notifications:", error)
      currentUserData = {
        firstName: "User",
        lastName: "",
        profileImageUrl: null,
      }
      updateNotificationAvatars()
    }
  }

  /**
   * Update notification avatars with current user data (same pattern as comments.js)
   */
  function updateNotificationAvatars() {
    const currentUserAvatars = document.querySelectorAll(".current-user-avatar")

    currentUserAvatars.forEach((avatar) => {
      updateAvatarElement(avatar)
    })
  }

  /**
   * Update avatar element with current user data (same as comments.js)
   * @param {Element} avatarElement - Avatar DOM element
   */
  function updateAvatarElement(avatarElement) {
    if (!avatarElement) return

    const userData = currentUserData || {
      firstName: "User",
      lastName: "",
      profileImageUrl: null,
    }

    // Use global function if available, otherwise use fallback
    const getInitialsFunction = window.getInitials || getInitialsFallback
    const initials = getInitialsFunction(userData.firstName, userData.lastName)

    if (userData.profileImageUrl) {
      avatarElement.innerHTML = `<img src="${userData.profileImageUrl}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
    } else {
      avatarElement.innerHTML = `<span style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #4a76a8; color: white; border-radius: 50%; font-weight: bold; font-size: 14px;">${initials}</span>`
    }
  }

  // Function to load notifications with enhanced ProfileManager integration
  function loadNotifications() {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        currentUser = user

        // Load current user's profile data (same as comments.js)
        loadCurrentUserData(user)

        // Initialize ProfileManager if not already done
        if (window.profileManager && !window.profileManager.getCurrentUserProfile()) {
          window.profileManager.initialize(user)
        }

        setupProfileUpdateListener()
        setupNotificationListener(user.uid)
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

          allNotifications.push({
            id: notifSnapshot.key,
            ...notification,
          })
        })

        // Sort notifications by timestamp (newest first)
        allNotifications.sort((a, b) => b.timestamp - a.timestamp)
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

  // Enhanced user avatar fetching with better fallback (same as comments.js)
  const getUserAvatar = async (userId, firstName, lastName) => {
    try {
      // Use global function if available, otherwise use fallback
      const fetchFunction = window.fetchUserDataWithRetry || fetchUserDataFallback
      const userData = await fetchFunction(userId)

      if (userData && userData.profileImageUrl) {
        return `<img src="${userData.profileImageUrl}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
      } else {
        const userFirstName = userData?.firstName || firstName || "Unknown"
        const userLastName = userData?.lastName || lastName || "User"
        const getInitialsFunction = window.getInitials || getInitialsFallback
        const initials = getInitialsFunction(userFirstName, userLastName)
        return `<span style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #4a76a8; color: white; border-radius: 50%; font-weight: bold; font-size: 14px;">${initials}</span>`
      }
    } catch (error) {
      console.error("Error fetching user avatar:", error)
      const getInitialsFunction = window.getInitials || getInitialsFallback
      const initials = getInitialsFunction(firstName, lastName)
      return `<span style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #4a76a8; color: white; border-radius: 50%; font-weight: bold; font-size: 14px;">${initials}</span>`
    }
  }

  async function updateNotificationsUI(notifications) {
    if (!notificationsFeed) return

    // Fetch all user data needed for these notifications using enhanced method
    const userIds = [...new Set(notifications.map((notif) => notif.userId))]

    const userDataPromises = userIds.map(async (userId) => {
      try {
        // Use the same enhanced method as comments.js
        const userData = await window.fetchUserDataWithRetry(userId)
        return { userId, userData }
      } catch (error) {
        console.error("Error fetching user data:", error)
        return { userId, userData: null }
      }
    })

    const userDataResults = await Promise.all(userDataPromises)
    const userDataMap = new Map()
    userDataResults.forEach(({ userId, userData }) => {
      userDataMap.set(userId, userData)
    })

    notificationsFeed.innerHTML = notifications
      .map((notif) => {
        let notifContent = ""
        let categoryIcon = ""
        const userData = userDataMap.get(notif.userId) || { firstName: "Unknown", lastName: "User" }

        // Use consistent name formatting
        const userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Unknown User"

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
               data-post-id="${notif.postId}"
               data-user-id="${notif.userId}">
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
              <button class="ursac-view-button" onclick="handleNotificationView('${notif.id}', '${notif.postId}', '${notif.type}', '${notif.commentId || ""}', '${notif.userId}');">View</button>
              ${!notif.read ? `<button class="ursac-mark-read-button" onclick="markNotificationAsRead('${notif.id}', event);">Mark as read</button>` : ""}
            </div>
          </div>
        `
      })
      .join("")
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
        filterOptions.forEach((opt) => opt.classList.remove("active"))
        this.classList.add("active")
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

  // MAIN FUNCTION: Handle notification view - fetch post and show in modal with enhanced profile integration
  window.handleNotificationView = async (notificationId, postId, notificationType, commentId, userId) => {
    console.log("Handling notification view:", { notificationId, postId, notificationType, commentId, userId })

    if (!currentUser) {
      console.error("No current user")
      return
    }

    try {
      // Mark notification as read first
      await firebase.database().ref(`notifications/${currentUser.uid}/${notificationId}`).update({ read: true })

      // Show loading modal
      showLoadingModal()

      // Fetch the post data
      const postSnapshot = await firebase.database().ref(`posts/${postId}`).once("value")
      const postData = postSnapshot.val()

      if (!postData) {
        showErrorModal("Post not found or has been deleted.")
        return
      }

      // Fetch post author data using enhanced method
      let authorData = { firstName: "Unknown", lastName: "User" }
      try {
        const userData = await window.fetchUserDataWithRetry(postData.userId)
        if (userData) {
          authorData = userData
        }
      } catch (error) {
        console.error("Error fetching author data:", error)
      }

      // Fetch notification user data for context using enhanced method
      let notificationUserData = { firstName: "Unknown", lastName: "User" }
      if (userId) {
        try {
          const userData = await window.fetchUserDataWithRetry(userId)
          if (userData) {
            notificationUserData = userData
          }
        } catch (error) {
          console.error("Error fetching notification user data:", error)
        }
      }

      // Fetch comments if they exist
      let commentsData = {}
      if (postData.comments) {
        const commentsSnapshot = await firebase.database().ref(`posts/${postId}/comments`).once("value")
        commentsData = commentsSnapshot.val() || {}
      }

      // Show the post in modal
      showPostModal(postData, authorData, notificationUserData, commentsData, notificationType, commentId)
    } catch (error) {
      console.error("Error handling notification view:", error)
      showErrorModal("Failed to load post. Please try again.")
    }
  }

  // Function to show loading modal
  function showLoadingModal() {
    createPostModal()
    const modal = document.getElementById("post-modal")
    const modalLoading = modal.querySelector(".post-modal-loading")
    const modalBody = modal.querySelector(".post-modal-body")
    const modalError = modal.querySelector(".post-modal-error")

    modal.style.display = "flex"
    modalLoading.style.display = "block"
    modalBody.style.display = "none"
    modalError.style.display = "none"
  }

  // Function to show error modal
  function showErrorModal(message) {
    const modal = document.getElementById("post-modal")
    const modalLoading = modal.querySelector(".post-modal-loading")
    const modalBody = modal.querySelector(".post-modal-body")
    const modalError = modal.querySelector(".post-modal-error")
    const errorMessage = modal.querySelector(".error-message")

    modalLoading.style.display = "none"
    modalBody.style.display = "none"
    modalError.style.display = "block"

    if (errorMessage) {
      errorMessage.textContent = message
    }
  }

  // Function to show post modal with data using enhanced profile integration
  async function showPostModal(
    postData,
    authorData,
    notificationUserData,
    commentsData,
    notificationType,
    highlightCommentId,
  ) {
    const modal = document.getElementById("post-modal")
    const modalLoading = modal.querySelector(".post-modal-loading")
    const modalBody = modal.querySelector(".post-modal-body")
    const modalError = modal.querySelector(".post-modal-error")
    const contextIcon = modal.querySelector(".notification-context-icon")
    const contextText = modal.querySelector(".notification-context-text")

    // Set notification context using consistent name formatting
    const userName =
      `${notificationUserData.firstName || ""} ${notificationUserData.lastName || ""}`.trim() || "Unknown User"

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

    // Hide loading, show content
    modalLoading.style.display = "none"
    modalError.style.display = "none"
    modalBody.style.display = "block"

    // Render post content
    modalBody.innerHTML = await renderPostContent(postData, authorData, commentsData, highlightCommentId)

    // Scroll to highlighted comment if exists
    if (highlightCommentId) {
      setTimeout(() => {
        const highlightedComment = modal.querySelector(`[data-comment-id="${highlightCommentId}"]`)
        if (highlightedComment) {
          highlightedComment.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 100)
    }
  }

  // Function to render post content with enhanced profile integration
  async function renderPostContent(postData, authorData, commentsData, highlightCommentId) {
    // Use consistent name formatting
    const authorName = `${authorData.firstName || ""} ${authorData.lastName || ""}`.trim() || "Unknown User"

    const postDate = new Date(postData.timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    // Count likes and comments
    const likesCount = Object.keys(postData.likes || {}).length
    const commentsCount = Object.keys(commentsData).length

    let postContent = `
      <div class="modal-post-card">
        <div class="modal-post-header">
          <div class="modal-post-author">
            <div class="modal-author-avatar">
              ${
                authorData.profileImageUrl
                  ? `<img src="${authorData.profileImageUrl}" alt="${authorName}">`
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
          ${postData.content ? `<p>${postData.content}</p>` : ""}
          
          ${
            postData.mediaURL && postData.mediaType === "image"
              ? `<div class="modal-post-media">
              <img src="${postData.mediaURL}" alt="Post image" class="modal-post-image">
            </div>`
              : ""
          }
          
          ${
            postData.mediaURL && postData.mediaType === "file"
              ? `<div class="modal-post-attachment">
              <a href="${postData.mediaURL}" target="_blank" class="modal-attachment-link">
                <i class="fas fa-paperclip"></i>
                <span>${postData.mediaName || "Attachment"}</span>
                ${postData.mediaSize ? `<small>(${postData.mediaSize})</small>` : ""}
              </a>
            </div>`
              : ""
          }
        </div>
        
        <div class="modal-post-stats">
          <span><i class="fas fa-thumbs-up"></i> ${likesCount} ${likesCount === 1 ? "like" : "likes"}</span>
          <span><i class="fas fa-comment"></i> ${commentsCount} ${commentsCount === 1 ? "comment" : "comments"}</span>
        </div>
      </div>
    `

    // Add comments section if there are comments
    if (commentsCount > 0) {
      postContent += `<div class="modal-comments-section">
        <h5>Comments (${commentsCount})</h5>
        <div class="modal-comments-list">`

      // Sort comments by timestamp
      const sortedComments = Object.entries(commentsData).sort((a, b) => a[1].timestamp - b[1].timestamp)

      for (const [commentId, comment] of sortedComments) {
        try {
          let commenterData = { firstName: "Unknown", lastName: "User" }

          // Use enhanced method for commenter data
          try {
            const userData = await window.fetchUserDataWithRetry(comment.userId)
            if (userData) {
              commenterData = userData
            }
          } catch (error) {
            console.error("Error fetching commenter data:", error)
          }

          // Use consistent name formatting
          const commenterName =
            `${commenterData.firstName || ""} ${commenterData.lastName || ""}`.trim() || "Unknown User"

          const isHighlighted = commentId === highlightCommentId
          const commentDate = new Date(comment.timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })

          postContent += `
            <div class="modal-comment ${isHighlighted ? "highlighted-comment" : ""}" data-comment-id="${commentId}">
              <div class="modal-comment-header">
                <div class="modal-commenter-avatar">
                  ${
                    commenterData.profileImageUrl
                      ? `<img src="${commenterData.profileImageUrl}" alt="${commenterName}">`
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

      postContent += `</div></div>`
    }

    return postContent
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
              <p class="error-message">Failed to load post</p>
              <button onclick="closePostModal()" class="retry-button">Close</button>
            </div>
            <div class="post-modal-body" style="display: none;">
              <!-- Post content will be loaded here -->
            </div>
          </div>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML("beforeend", modalHTML)
  }

  // Function to close modal
  window.closePostModal = () => {
    const modal = document.getElementById("post-modal")
    if (modal) {
      modal.style.display = "none"
      modal.remove() // Remove from DOM to clean up
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

  // Mark notification as read function
  window.markNotificationAsRead = (notificationId, event) => {
    if (!currentUser) return

    if (event) {
      event.stopPropagation()
    }

    firebase
      .database()
      .ref(`notifications/${currentUser.uid}/${notificationId}`)
      .update({ read: true })
      .then(() => {
        const notifElement = document.querySelector(`[data-notification-id="${notificationId}"]`)
        if (notifElement) {
          notifElement.classList.remove("unread")
          const markReadBtn = notifElement.querySelector(".ursac-mark-read-button")
          if (markReadBtn) {
            markReadBtn.remove()
          }
        }

        if (currentFilter === "unread") {
          filterNotifications("unread")
        }
      })
      .catch((error) => {
        console.error("Error marking notification as read:", error)
      })
  }

  // Mark all notifications as read function
  window.markAllNotificationsAsRead = () => {
    if (!currentUser) return

    const updates = {}
    allNotifications.forEach((notif) => {
      if (!notif.read) {
        updates[`${notif.id}/read`] = true
      }
    })

    if (Object.keys(updates).length === 0) {
      return
    }

    firebase
      .database()
      .ref(`notifications/${currentUser.uid}`)
      .update(updates)
      .then(() => {
        filterNotifications(currentFilter)
        updateNotificationBadge(0)
      })
      .catch((error) => {
        console.error("Error marking all notifications as read:", error)
      })
  }

  // Add CSS styles for modal and notifications
  const style = document.createElement("style")
  style.textContent = `
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
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(2px);
    }
    
    .post-modal-container {
      background: white;
      border-radius: 12px;
      max-width: 700px;
      width: 90%;
      max-height: 85vh;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
      animation: modalSlideIn 0.3s ease-out;
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    .post-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 25px;
      border-bottom: 1px solid #e1e5e9;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .notification-context {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      font-size: 16px;
    }
    
    .notification-context-icon {
      font-size: 20px;
      color: #fff;
    }
    
    .post-modal-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: white;
      padding: 8px;
      border-radius: 50%;
      transition: background-color 0.2s;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .post-modal-close:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    
    .post-modal-content {
      max-height: calc(85vh - 80px);
      overflow-y: auto;
    }
    
    .post-modal-loading,
    .post-modal-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 40px;
      color: #666;
      text-align: center;
    }
    
    .post-modal-loading i {
      font-size: 32px;
      margin-bottom: 15px;
      color: #667eea;
    }

    .post-modal-loading p {
      font-size: 16px;
      margin: 0;
    }
    
    .post-modal-error {
      color: #dc3545;
    }

    .post-modal-error i {
      font-size: 32px;
      margin-bottom: 15px;
    }
    
    .modal-post-card {
      padding: 25px;
    }
    
    .modal-post-header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #f0f2f5;
    }
    
    .modal-post-author {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .modal-author-avatar,
    .modal-commenter-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid #e1e5e9;
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
      background: linear-gradient(135deg,rgba(102, 192, 234, 0.99) 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 18px;
    }
    
    .modal-author-info h4 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .modal-post-date,
    .modal-comment-date {
      font-size: 13px;
      color: #8a8a8a;
      margin-top: 2px;
    }
    
    .modal-post-content {
      margin-bottom: 20px;
    }
    
    .modal-post-content p {
      margin: 0 0 15px 0;
      line-height: 1.6;
      font-size: 16px;
      color: #333;
    }
    
    .modal-post-media {
      margin: 15px 0;
    }

    .modal-post-image {
      width: 100%;
      max-height: 400px;
      object-fit: cover;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .modal-post-attachment {
      margin: 15px 0;
    }

    .modal-attachment-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 10px;
      text-decoration: none;
      color: #495057;
      border: 1px solid #e9ecef;
      transition: all 0.2s;
    }

    .modal-attachment-link:hover {
      background: #e9ecef;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .modal-attachment-link i {
      font-size: 20px;
      color: #667eea;
    }
    
    .modal-post-stats {
      display: flex;
      gap: 30px;
      padding: 20px 0;
      border-top: 1px solid #f0f2f5;
      border-bottom: 1px solid #f0f2f5;
      color: #666;
      font-size: 15px;
      font-weight: 500;
    }
    
    .modal-post-stats i {
      margin-right: 8px;
      color: #667eea;
    }
    
    .modal-comments-section {
      padding-top: 25px;
    }
    
    .modal-comments-section h5 {
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .modal-comments-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .modal-comment {
      padding: 20px 0;
      border-bottom: 1px solid #f5f5f5;
    }
    
    .modal-comment:last-child {
      border-bottom: none;
    }
    
    .modal-comment-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }
    
    .modal-commenter-avatar {
      width: 36px;
      height: 36px;
    }
    
    .modal-comment-info {
      display: flex;
      flex-direction: column;
    }
    
    .modal-comment-info strong {
      font-size: 15px;
      color: #1a1a1a;
    }
    
    .modal-comment-text {
      margin-left: 48px;
      line-height: 1.5;
      font-size: 15px;
      color: #333;
    }
    
    .highlighted-comment {
      background: linear-gradient(135deg, rgba(255, 236, 179, 0.4) 0%, rgba(255, 193, 7, 0.2) 100%);
      border-radius: 12px;
      padding: 20px !important;
      margin: 15px 0;
      border-left: 4px solid #ffc107;
      animation: highlight-pulse 2s ease-out;
    }
    
    @keyframes highlight-pulse {
      0% {
        background: linear-gradient(135deg, rgba(255, 236, 179, 0.6) 0%, rgba(255, 193, 7, 0.3) 100%);
        transform: scale(1.02);
      }
      100% {
        background: linear-gradient(135deg, rgba(255, 236, 179, 0.4) 0%, rgba(255, 193, 7, 0.2) 100%);
        transform: scale(1);
      }
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
      .post-modal-container {
        width: 95%;
        max-height: 90vh;
      }
      
      .post-modal-header {
        padding: 15px 20px;
      }
      
      .modal-post-card {
        padding: 20px;
      }

      .modal-author-avatar,
      .modal-commenter-avatar {
        width: 40px;
        height: 40px;
      }

      .modal-commenter-avatar {
        width: 32px;
        height: 32px;
      }
    }

    .retry-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 15px;
      font-weight: 500;
      transition: transform 0.2s;
    }

    .retry-button:hover {
      transform: translateY(-1px);
    }

    .ursac-view-button {
      background: #667eea;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .ursac-view-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .ursac-mark-read-button {
      background: #6c757d;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      margin-left: 8px;
      transition: all 0.2s;
    }

    .ursac-mark-read-button:hover {
      background: #545b62;
      transform: translateY(-1px);
    }

    .ursac-notification-item.unread {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
      border-left: 3px solid #667eea;
    }

    .current-user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #4a76a8;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      flex-shrink: 0;
      font-size: 14px;
      overflow: hidden;
    }
  `
  document.head.appendChild(style)

  // Setup profile update listener with enhanced integration
  function setupProfileUpdateListener() {
    // Listen for profile updates
    document.addEventListener("profileUpdated", (event) => {
      const userId = event.detail.userId
      console.log("Profile updated in notifications:", userId)

      // If current user profile updated, reload current user data
      if (userId === currentUser?.uid) {
        loadCurrentUserData(currentUser)
      }

      // Refresh notifications display if needed
      if (allNotifications.length > 0) {
        updateNotificationsUI(
          allNotifications.filter((notif) => {
            switch (currentFilter) {
              case "unread":
                return !notif.read
              case "mentions":
                return (
                  notif.type === "comment" &&
                  notif.commentText &&
                  notif.commentText.includes(`@${currentUser?.displayName || ""}`)
                )
              default:
                return true
            }
          }),
        )
      }
    })

    // Listen for Firebase profile updates
    if (currentUser) {
      firebase
        .database()
        .ref("profileUpdates")
        .on("child_changed", (snapshot) => {
          const userId = snapshot.key
          const timestamp = snapshot.val()

          // If current user profile updated, reload current user data
          if (userId === currentUser?.uid) {
            loadCurrentUserData(currentUser)
          }

          // Refresh display if notifications contain this user
          if (allNotifications.some((notif) => notif.userId === userId)) {
            filterNotifications(currentFilter)
          }
        })
    }
  }

  // Initialize
  loadNotifications()
})

console.log("Enhanced notifications system with comprehensive profile integration loaded successfully")
