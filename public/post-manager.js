/**
 * Post Management System with Enhanced Profile Integration
 * Handles post creation, loading, and display
 */

// Post management state
let postsListener = null
let newPostListener = null
let isSubmitting = false
let lastSubmissionTime = 0
const SUBMISSION_COOLDOWN = 2000 // 2 seconds between submissions

// Post tracking for duplicate prevention
const loadedPosts = new Map()
let isInitialLoad = true
let lastLoadTimestamp = 0

// Set to track users we've already logged warnings for
window.loggedMissingUsers = window.loggedMissingUsers || new Set()

/**
 * Validate if a post should be displayed based on user data availability
 * @param {Object} post - Post data
 * @returns {boolean} Whether the post should be displayed
 */
function shouldDisplayPost(post) {
  if (!post || !post.userId) {
    return false
  }

  // Allow posts from users even if their profile data is missing
  // We'll show them as "Deleted User" instead of hiding the post
  return true
}

// Fallback user data fetching function if the global one isn't available
async function fetchUserDataFallback(userId, maxRetries = 3) {
  if (!userId) {
    throw new Error("User ID is required")
  }

  const firebase = window.firebase
  if (!firebase || !firebase.database) {
    throw new Error("Firebase is not available")
  }

  const database = firebase.database()

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const snapshot = await database.ref(`users/${userId}`).once("value")

      if (snapshot.exists()) {
        return snapshot.val()
      } else {
        // Only log once per userId to prevent spam
        if (!window.loggedMissingUsers) {
          window.loggedMissingUsers = new Set()
        }
        if (!window.loggedMissingUsers.has(userId)) {
          console.warn(`No user data found for userId: ${userId}`)
          window.loggedMissingUsers.add(userId)
        }
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

/**
 * Enhanced user data fetching with fallback support
 * @param {string} userId - The user ID to fetch data for
 * @returns {Promise<Object>} User data object
 */
async function getUserDataEnhanced(userId) {
  if (!userId) {
    return {
      firstName: "Unknown",
      lastName: "User",
      profileImageUrl: null,
    }
  }

  try {
    // Use global function if available, otherwise use fallback
    const fetchFunction = window.fetchUserDataWithRetry || fetchUserDataFallback
    const userData = await fetchFunction(userId)

    if (userData) {
      return userData
    } else {
      // Only log once per userId to prevent spam
      if (!window.loggedMissingUsers) {
        window.loggedMissingUsers = new Set()
      }
      if (!window.loggedMissingUsers.has(userId)) {
        console.warn(`No user data found for userId: ${userId}`)
        window.loggedMissingUsers.add(userId)
      }
      return {
        firstName: "Deleted",
        lastName: "User",
        profileImageUrl: null,
      }
    }
  } catch (error) {
    console.error(`Error fetching user data for ${userId}:`, error)
    return {
      firstName: "Unknown",
      lastName: "User",
      profileImageUrl: null,
    }
  }
}

/**
 * Get user initials with fallback support (avoiding infinite recursion)
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @returns {string} User initials
 */
function getInitials(firstName, lastName) {
  // Check if global function exists and is different from this function
  if (window.getInitials && window.getInitials !== getInitials) {
    try {
      return window.getInitials(firstName, lastName)
    } catch (error) {
      console.warn("Error using global getInitials, falling back to local implementation:", error)
    }
  }

  // Use local fallback implementation
  return getInitialsFallback(firstName, lastName)
}

/**
 * Submit a new post to Firebase
 */
function submitPost() {
  const currentUser = window.getCurrentUser()
  if (!currentUser) {
    window.showModal("Authentication Required", "You must be logged in to post.")
    return
  }

  // Enhanced duplicate prevention
  if (isSubmitting) {
    console.log("Submission blocked: Already submitting a post")
    return
  }

  const now = Date.now()
  if (now - lastSubmissionTime < SUBMISSION_COOLDOWN) {
    const remainingTime = Math.ceil((SUBMISSION_COOLDOWN - (now - lastSubmissionTime)) / 1000)
    window.showModal("Please Wait", `Please wait ${remainingTime} more seconds before posting again.`)
    return
  }

  const postForm = document.getElementById("postForm")
  if (!postForm) {
    console.error("Post form element not found")
    return
  }

  const content = postForm.value.trim()
  const selectedMedia = window.getSelectedMedia()

  if (!content && !selectedMedia) {
    window.showModal("Empty Post", "Please enter some content or add media to your post.")
    return
  }

  // Check for profanity before posting
  if (content) {
    const profanityResult = window.checkForProfanity(content)
    if (profanityResult.isProfane) {
      window.showProfanityWarning(profanityResult.matches)
      return
    }
  }

  // Set submission state
  isSubmitting = true
  lastSubmissionTime = now

  const postButton = document.getElementById("post-button")
  if (postButton) {
    postButton.disabled = true
    postButton.textContent = "Posting..."
  }

  const resetSubmissionState = () => {
    isSubmitting = false
    if (postButton) {
      postButton.disabled = false
      postButton.textContent = "Post"
      window.updatePostButton()
    }
  }

  // Clear the form immediately
  postForm.value = ""
  window.clearMediaPreview()

  const expandedPostArea = document.getElementById("expanded-post-area")
  if (expandedPostArea) {
    expandedPostArea.classList.remove("ursac-expanded")
  }

  // Handle media upload if needed, then submit to Firebase
  const submitToFirebase = (mediaData = null) => {
    const newPostRef = window.firebaseDatabase.ref("posts").push()

    const postData = {
      userId: currentUser.uid,
      content: content,
      timestamp: window.firebase.database.ServerValue.TIMESTAMP,
    }

    if (mediaData) {
      postData.mediaURL = mediaData.url
      postData.mediaType = mediaData.type
      postData.mediaName = mediaData.name
      postData.mediaSize = mediaData.size
    }

    return newPostRef
      .set(postData)
      .then(() => {
        console.log("Post created successfully with ID:", newPostRef.key)
        resetSubmissionState()
      })
      .catch((error) => {
        console.error("Error creating post:", error)
        window.showModal("Post Creation Failed", "Failed to create post: " + error.message)
        resetSubmissionState()
      })
  }

  // Upload media if needed, otherwise submit directly
  if (selectedMedia) {
    window
      .uploadMedia(selectedMedia.file, selectedMedia.type)
      .then((mediaData) => {
        return submitToFirebase(mediaData)
      })
      .catch((error) => {
        console.error("Error uploading media:", error)
        window.showModal("Post Creation Failed", "Failed to upload media: " + error.message)
        resetSubmissionState()
      })
  } else {
    submitToFirebase()
  }
}

/**
 * Setup posts listener with hybrid approach (initial load + real-time updates)
 */
function setupPostsListener() {
  const postsContainer = document.getElementById("postsContainer")
  if (!postsContainer) {
    console.error("Posts container element not found")
    return
  }

  // Clear existing listeners
  if (postsListener) {
    window.firebaseDatabase.ref("posts").off("value", postsListener)
  }
  if (newPostListener) {
    window.firebaseDatabase.ref("posts").off("child_added", newPostListener)
  }

  // Reset tracking
  loadedPosts.clear()
  isInitialLoad = true
  lastLoadTimestamp = Date.now()

  console.log("Setting up hybrid posts listener (initial load + real-time updates)...")

  // Initial load with proper sorting
  postsListener = window.firebaseDatabase
    .ref("posts")
    .once("value")
    .then(async (snapshot) => {
      const postsData = snapshot.val()

      if (!postsData) {
        postsContainer.innerHTML = `
          <div class="ursac-post-card">
            <div class="ursac-post-content" style="text-align: center;">
              No posts yet. Be the first to post something!
            </div>
          </div>
        `
        isInitialLoad = false
        setupRealTimeListener()
        return
      }

      try {
        // Convert to array and sort by timestamp (newest first)
        const postsArray = Object.entries(postsData)
          .map(([id, post]) => ({
            id,
            ...post,
            timestamp: typeof post.timestamp === "number" ? post.timestamp : Date.now(),
          }))
          .filter((post) => {
            if (!post.id || !post.userId) {
              console.warn(`Invalid post detected:`, post)
              return false
            }
            return true
          })
          .sort((a, b) => b.timestamp - a.timestamp) // Newest first

        console.log(`Initial load: Processing ${postsArray.length} posts, sorted by timestamp (newest first)`)

        // Clear container
        postsContainer.innerHTML = ""
        loadedPosts.clear()

        // Create document fragment for better performance
        const fragment = document.createDocumentFragment()

        for (const post of postsArray) {
          try {
            // Use enhanced user data fetching instead of direct Firebase call
            const userData = await getUserDataEnhanced(post.userId)

            const postElement = await createPostElement(post, userData)
            fragment.appendChild(postElement)
            loadedPosts.set(post.id, post.timestamp)
          } catch (error) {
            console.error(`Error processing post ${post.id}:`, error)

            // Create post element with fallback user data
            const fallbackUserData = {
              firstName: "Unknown",
              lastName: "User",
              profileImageUrl: null,
            }
            const postElement = await createPostElement(post, fallbackUserData)
            fragment.appendChild(postElement)
            loadedPosts.set(post.id, post.timestamp)
          }
        }

        postsContainer.appendChild(fragment)
        console.log(`Initial load complete: ${loadedPosts.size} posts loaded`)

        // Mark initial load as complete and setup real-time listener
        isInitialLoad = false
        setupRealTimeListener()
      } catch (error) {
        console.error("Error in initial posts load:", error)
        postsContainer.innerHTML = `
          <div class="ursac-post-card">
            <div class="ursac-post-content" style="text-align: center;">
              Error loading posts. Please refresh the page.
            </div>
          </div>
        `
        isInitialLoad = false
        setupRealTimeListener()
      }
    })
    .catch((error) => {
      console.error("Firebase initial load error:", error)
      isInitialLoad = false
      setupRealTimeListener()
    })
}

/**
 * Setup real-time listener for new posts (after initial load)
 */
function setupRealTimeListener() {
  if (isInitialLoad) {
    console.log("Skipping real-time listener setup - initial load not complete")
    return
  }

  console.log("Setting up real-time listener for new posts...")

  // Real-time listener for new posts only
  newPostListener = window.firebaseDatabase
    .ref("posts")
    .orderByChild("timestamp")
    .startAt(lastLoadTimestamp)
    .on(
      "child_added",
      async (snapshot) => {
        const postId = snapshot.key
        const postData = snapshot.val()

        // Skip if this post was already loaded in initial load
        if (loadedPosts.has(postId)) {
          console.log(`Skipping already loaded post: ${postId}`)
          return
        }

        // Skip if post is older than our last load
        if (postData.timestamp <= lastLoadTimestamp) {
          console.log(`Skipping old post: ${postId}`)
          return
        }

        console.log(`New post detected: ${postId}`)

        try {
          // Use enhanced user data fetching instead of direct Firebase call
          const userData = await getUserDataEnhanced(postData.userId)

          const post = { id: postId, ...postData }
          const postElement = await createPostElement(post, userData)

          // Add new post at the top (newest first)
          const postsContainer = document.getElementById("postsContainer")
          if (postsContainer) {
            // Check if container has the "no posts" message and remove it
            const noPostsMessage = postsContainer.querySelector(".ursac-post-card .ursac-post-content")
            if (noPostsMessage && noPostsMessage.textContent.includes("No posts yet")) {
              postsContainer.innerHTML = ""
            }

            postsContainer.insertBefore(postElement, postsContainer.firstChild)
            loadedPosts.set(postId, postData.timestamp)

            console.log(`New post added to UI: ${postId}`)
          }
        } catch (error) {
          console.error(`Error processing new post ${postId}:`, error)

          // Create post element with fallback user data
          try {
            const fallbackUserData = {
              firstName: "Unknown",
              lastName: "User",
              profileImageUrl: null,
            }
            const post = { id: postId, ...postData }
            const postElement = await createPostElement(post, fallbackUserData)

            const postsContainer = document.getElementById("postsContainer")
            if (postsContainer) {
              postsContainer.insertBefore(postElement, postsContainer.firstChild)
              loadedPosts.set(postId, postData.timestamp)
              console.log(`New post added to UI with fallback data: ${postId}`)
            }
          } catch (fallbackError) {
            console.error(`Error creating post element with fallback data: ${fallbackError}`)
          }
        }
      },
      (error) => {
        console.error("Firebase real-time listener error:", error)
      },
    )
}

/**
 * Create post element from post data with enhanced user data handling
 * @param {Object} post - Post data
 * @param {Object} userData - User data
 * @returns {Element} - Post DOM element
 */
async function createPostElement(post, userData) {
  const currentUser = window.getCurrentUser()
  const postId = post.id
  const postTimestamp = new Date(post.timestamp)
  const timeAgo = window.formatTimeAgo(postTimestamp)
  const hasLiked = post.likes && post.likes[currentUser?.uid] === true
  const likesCount = window.countLikes(post.likes)
  const commentsCount = window.countComments(post.comments)

  const postCard = document.createElement("div")
  postCard.className = "ursac-post-card"
  postCard.setAttribute("data-post-id", postId)
  postCard.setAttribute("data-user-id", post.userId)
  postCard.setAttribute("data-timestamp", post.timestamp.toString())

  // Use enhanced initials function
  const userInitials = getInitials(userData?.firstName, userData?.lastName)
  const userName = userData
    ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Unknown User"
    : "Unknown User"

  // Get current user data for comment avatar
  let currentUserAvatar = "<span>?</span>"
  if (currentUser) {
    try {
      const currentUserData = await getUserDataEnhanced(currentUser.uid)
      if (currentUserData) {
        const currentUserInitials = getInitials(currentUserData.firstName, currentUserData.lastName)
        if (currentUserData.profileImageUrl) {
          currentUserAvatar = `<img src="${currentUserData.profileImageUrl}" alt="Your Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
        } else {
          currentUserAvatar = `<span>${currentUserInitials}</span>`
        }
      }
    } catch (error) {
      console.error("Error fetching current user data for comment avatar:", error)
    }
  }

  let postHTML = `
    <div class="ursac-post-header">
      <div class="ursac-profile-avatar">
        ${
          userData?.profileImageUrl
            ? `<img src="${userData.profileImageUrl}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
            : `<span>${userInitials}</span>`
        }
      </div>
      <div class="ursac-post-meta">
        <div class="ursac-post-author">${userName}</div>
        <div class="ursac-post-time">${timeAgo}</div>
      </div>
    </div>
    
    <div class="ursac-post-content">
      ${post.content ? `<p>${window.linkifyText(post.content)}</p>` : ""}
  `

  // Add media content if available (NO VIDEO)
  if (post.mediaURL) {
    if (post.mediaType === "image") {
      postHTML += `
        <div class="ursac-post-media">
          <img src="${post.mediaURL}" alt="Post image" loading="lazy" style="max-width: 100%; border-radius: 8px;">
        </div>
      `
    } else if (post.mediaType === "file") {
      postHTML += `
        <div class="ursac-post-attachment">
          <a href="${post.mediaURL}" target="_blank" class="ursac-attachment-link" style="display: flex; align-items: center; gap: 8px; padding: 10px; background: #f0f2f5; border-radius: 8px; text-decoration: none; color: #4a76a8;">
            <i class="fas fa-paperclip"></i>
            <span>${post.mediaName || "Attachment"}</span>
            ${post.mediaSize ? `<small>(${post.mediaSize})</small>` : ""}
          </a>
        </div>
      `
    }
  }

  // Add post actions and comment section
  postHTML += `
    </div>
    <div class="ursac-post-footer">
      <div class="ursac-post-stat" onclick="window.likePost('${postId}')" style="cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 8px;">
        <i class="${hasLiked ? "fas" : "far"} fa-thumbs-up"></i>
        <span class="like-count">${likesCount}</span>
      </div>
      <div class="ursac-post-stat" onclick="window.toggleComments(this)" style="cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 8px;">
        <i class="far fa-comment"></i>
        <span class="comment-count">${commentsCount}</span>
      </div>
      <div class="ursac-post-stat" onclick="window.sharePost('${postId}')" style="cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 8px;">
        <i class="far fa-share-square"></i>
      </div>
    </div>
    <div class="ursac-post-comments" style="display: none;">
      <div class="ursac-comment-input-wrapper">
        <div class="ursac-comment-avatar current-user-avatar" id="comment-avatar-${postId}">
          ${currentUserAvatar}
        </div>
        <div class="ursac-comment-input-container">
          <input type="text" class="ursac-comment-input" placeholder="Write a comment...">
          <button class="ursac-comment-submit" onclick="window.commentSystem && window.commentSystem.submitComment('${postId}')" disabled>
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
      <div class="ursac-comments-list">
        <!-- Comments will be loaded dynamically by comments.js -->
      </div>
    </div>
  `

  postCard.innerHTML = postHTML
  return postCard
}

/**
 * Update post elements when user profile data changes
 * @param {string} userId - The user ID whose profile was updated
 */
async function updatePostsForUser(userId) {
  if (!userId) return

  try {
    // Get updated user data
    const userData = await getUserDataEnhanced(userId)

    // Find all posts by this user
    const userPosts = document.querySelectorAll(`[data-user-id="${userId}"]`)

    userPosts.forEach((postElement) => {
      // Update avatar
      const avatarElement = postElement.querySelector(".ursac-profile-avatar")
      if (avatarElement) {
        const userInitials = getInitials(userData?.firstName, userData?.lastName)

        if (userData?.profileImageUrl) {
          avatarElement.innerHTML = `<img src="${userData.profileImageUrl}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
        } else {
          avatarElement.innerHTML = `<span>${userInitials}</span>`
        }
      }

      // Update author name
      const authorElement = postElement.querySelector(".ursac-post-author")
      if (authorElement) {
        const userName = userData
          ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Unknown User"
          : "Unknown User"
        authorElement.textContent = userName
      }
    })

    console.log(`Updated ${userPosts.length} posts for user ${userId}`)
  } catch (error) {
    console.error(`Error updating posts for user ${userId}:`, error)
  }
}

/**
 * Setup profile update listener for posts
 */
function setupProfileUpdateListener() {
  // Listen for profile updates from other components
  document.addEventListener("profileUpdated", (event) => {
    const userId = event.detail.userId
    console.log("Profile updated in post-manager:", userId)
    updatePostsForUser(userId)
  })

  // Listen for Firebase profile updates
  const currentUser = window.getCurrentUser()
  if (currentUser && window.firebase && window.firebase.database) {
    window.firebase
      .database()
      .ref("profileUpdates")
      .on("child_changed", (snapshot) => {
        const userId = snapshot.key
        const timestamp = snapshot.val()
        console.log("Firebase profile update detected:", userId)
        updatePostsForUser(userId)
      })
  }
}

// Initialize profile update listener when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  setupProfileUpdateListener()
})

// Export functions to global scope (without getInitials to prevent circular reference)
window.submitPost = submitPost
window.setupPostsListener = setupPostsListener
window.createPostElement = createPostElement
window.getUserDataEnhanced = getUserDataEnhanced
window.updatePostsForUser = updatePostsForUser

console.log("Enhanced post-manager with comprehensive profile integration loaded successfully")
