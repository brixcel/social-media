/**
 * Post Management System
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

// Declare firebase variable
// const firebase = window.firebase

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
            const userSnapshot = await window.firebaseDatabase.ref(`users/${post.userId}`).once("value")
            const userData = userSnapshot.val()

            if (!userData) {
              console.warn(`User data not found for post ${post.id}, user ${post.userId}`)
              continue
            }

            const postElement = createPostElement(post, userData)
            fragment.appendChild(postElement)
            loadedPosts.set(post.id, post.timestamp)
          } catch (error) {
            console.error(`Error processing post ${post.id}:`, error)
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
          const userSnapshot = await window.firebaseDatabase.ref(`users/${postData.userId}`).once("value")
          const userData = userSnapshot.val()

          if (!userData) {
            console.warn(`User data not found for new post ${postId}`)
            return
          }

          const post = { id: postId, ...postData }
          const postElement = createPostElement(post, userData)

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
        }
      },
      (error) => {
        console.error("Firebase real-time listener error:", error)
      },
    )
}

/**
 * Create post element from post data
 * @param {Object} post - Post data
 * @param {Object} userData - User data
 * @returns {Element} - Post DOM element
 */
function createPostElement(post, userData) {
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

  const userInitials = window.getInitials(userData?.firstName, userData?.lastName)
  const userName = userData ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim() : "Unknown User"

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
          <span>?</span>
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

// Export functions to global scope
window.submitPost = submitPost
window.setupPostsListener = setupPostsListener
window.createPostElement = createPostElement
