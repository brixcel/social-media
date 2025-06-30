/**
 * Main Application Controller
 * Handles app initialization and event listeners
 */

/**
 * Setup main event listeners for the application
 */
function setupEventListeners() {
  const postForm = document.getElementById("postForm")
  const postButton = document.getElementById("post-button")
  const filePhoto = document.getElementById("file-photo")
  const fileAttachment = document.getElementById("file-attachment")
  const expandedPostArea = document.getElementById("expanded-post-area")
  const sidebarPostBtn = document.getElementById("open-post-modal")

  console.log("Setting up event listeners...")
  console.log("Post form found:", !!postForm)
  console.log("Post button found:", !!postButton)
  console.log("Sidebar post button found:", !!sidebarPostBtn)

  if (postForm) {
    postForm.onclick = () => {
      if (expandedPostArea) {
        expandedPostArea.classList.add("ursac-expanded")
      }
    }

    postForm.oninput = () => {
      window.updatePostButton()
    }
  }

  // Attach post button event listener
  if (postButton) {
    postButton.onclick = function (e) {
      e.preventDefault()
      console.log("Post button clicked!")
      if (!this.disabled) {
        window.submitPost()
      }
    }

    console.log("Post button event listener attached successfully")
  }

  // Setup sidebar post button functionality
  if (sidebarPostBtn) {
    sidebarPostBtn.onclick = (e) => {
      e.preventDefault()
      console.log("Sidebar post button clicked!")

      // Focus on the main post form and expand it
      if (postForm && expandedPostArea) {
        postForm.focus()
        expandedPostArea.classList.add("ursac-expanded")

        // Scroll to the post form smoothly
        postForm.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })

        // Add a subtle highlight effect
        postForm.style.transition = "box-shadow 0.3s ease"
        postForm.style.boxShadow = "0 0 10px rgba(74, 118, 168, 0.3)"

        // Remove highlight after 2 seconds
        setTimeout(() => {
          postForm.style.boxShadow = ""
        }, 2000)
      }
    }

    console.log("Sidebar post button event listener attached successfully")
  }

  if (filePhoto) {
    filePhoto.onchange = (e) => {
      window.handleFileSelect(e, "image")
    }
  }

  if (fileAttachment) {
    fileAttachment.onchange = (e) => {
      window.handleFileSelect(e, "file")
    }
  }

  document.onclick = (event) => {
    if (
      expandedPostArea &&
      expandedPostArea.classList.contains("ursac-expanded") &&
      !event.target.closest(".ursac-create-post") &&
      event.target !== postForm &&
      !event.target.closest(".ursac-sidebar-post-btn")
    ) {
      expandedPostArea.classList.remove("ursac-expanded")
    }
  }
}

/**
 * Setup modal post functionality (alternative approach)
 */
function setupModalPost() {
  const postModal = document.getElementById("post-modal")
  const modalPostContent = document.getElementById("modal-post-content")
  const modalPostButton = document.getElementById("modal-post-button")
  const closePostModal = document.getElementById("close-post-modal")
  const sidebarPostBtn = document.getElementById("open-post-modal")

  if (!postModal || !modalPostContent || !modalPostButton || !closePostModal) {
    console.log("Modal elements not found, using main post form approach")
    return
  }

  // Open modal when sidebar button is clicked
  if (sidebarPostBtn) {
    sidebarPostBtn.onclick = (e) => {
      e.preventDefault()
      console.log("Opening post modal...")
      postModal.style.display = "flex"
      modalPostContent.focus()
    }
  }

  // Close modal functionality
  const closeModal = () => {
    postModal.style.display = "none"
    modalPostContent.value = ""
    if (modalPostButton) {
      modalPostButton.disabled = true
    }
  }

  if (closePostModal) {
    closePostModal.onclick = closeModal
  }

  // Close modal when clicking outside
  postModal.onclick = (e) => {
    if (e.target === postModal) {
      closeModal()
    }
  }

  // Update modal post button state
  if (modalPostContent && modalPostButton) {
    modalPostContent.oninput = () => {
      const hasContent = modalPostContent.value.trim() !== ""
      modalPostButton.disabled = !hasContent
    }

    // Submit post from modal
    modalPostButton.onclick = function (e) {
      e.preventDefault()
      if (!this.disabled) {
        const content = modalPostContent.value.trim()
        if (content) {
          // Use the existing submitPost function but with modal content
          submitModalPost(content)
        }
      }
    }
  }
}

/**
 * Submit post from modal
 * @param {string} content - Post content from modal
 */
function submitModalPost(content) {
  const currentUser = window.getCurrentUser()
  if (!currentUser) {
    window.showModal("Authentication Required", "You must be logged in to post.")
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

  const modalPostButton = document.getElementById("modal-post-button")
  const modalPostContent = document.getElementById("modal-post-content")

  if (modalPostButton) {
    modalPostButton.disabled = true
    modalPostButton.textContent = "Posting..."
  }

  const resetModalState = () => {
    if (modalPostButton) {
      modalPostButton.disabled = false
      modalPostButton.textContent = "Post"
    }
  }

  // Submit to Firebase
  const newPostRef = window.firebaseDatabase.ref("posts").push()
  const postData = {
    userId: currentUser.uid,
    content: content,
    timestamp: window.firebase.database.ServerValue.TIMESTAMP,
  }

  newPostRef
    .set(postData)
    .then(() => {
      console.log("Modal post created successfully with ID:", newPostRef.key)

      // Close modal and reset
      const postModal = document.getElementById("post-modal")
      if (postModal) {
        postModal.style.display = "none"
      }
      if (modalPostContent) {
        modalPostContent.value = ""
      }
      resetModalState()
    })
    .catch((error) => {
      console.error("Error creating modal post:", error)
      window.showModal("Post Creation Failed", "Failed to create post: " + error.message)
      resetModalState()
    })
}

/**
 * Initialize the application
 */
function initializeApp() {
  console.log("DOM Content Loaded - Initializing with hybrid post loading approach...")

  window.firebaseAuth.onAuthStateChanged((user) => {
    if (user) {
      // Set currentUser in global scope so comments.js can access it
      window.currentUser = user
      console.log("User authenticated:", user.email)

      setTimeout(() => {
        // Ensure all functions are available before calling them
        if (typeof window.initializeProfileElements === "function") {
          window.initializeProfileElements()
        }
        if (typeof window.loadUserProfile === "function") {
          window.loadUserProfile(user)
        }
        if (typeof window.setupPostsListener === "function") {
          window.setupPostsListener()
        } else {
          console.error("setupPostsListener function not found")
        }
        if (typeof window.loadNotifications === "function") {
          window.loadNotifications()
        }
        if (typeof window.setupProfileUpdateListener === "function") {
          window.setupProfileUpdateListener()
        }

        setupEventListeners()
        setupModalPost() // Setup modal post functionality

        if (typeof window.updatePostButton === "function") {
          window.updatePostButton()
        }

        // Initialize comment system if available
        if (window.commentSystem) {
          window.commentSystem.initialize(user)
        }

        // Update comment input avatars after a short delay to ensure posts are loaded
        setTimeout(() => {
          if (window.commentSystem && window.commentSystem.updateAllAvatars) {
            window.commentSystem.updateAllAvatars()
          }
        }, 1000)

        setInterval(() => {
          if (typeof window.loadNotifications === "function") {
            window.loadNotifications()
          }
        }, 30000)
      }, 500) // Increased timeout to ensure all scripts are loaded
    } else {
      window.location.href = "/login"
    }
  })

  const searchInput = document.getElementById("search-input")
  if (searchInput) {
    searchInput.oninput = () => {
      const query = searchInput.value.trim()
      if (query) {
        // searchPosts(query) // Implement if needed
      } else {
        if (typeof window.setupPostsListener === "function") {
          window.setupPostsListener() // Reload posts
        }
      }
    }
  }
}

// Export functions to global scope
window.submitModalPost = submitModalPost

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", initializeApp)
