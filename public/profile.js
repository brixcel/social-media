// Initialize Firebase (replace with your actual Firebase config)
// For example:
// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_AUTH_DOMAIN",
//   databaseURL: "YOUR_DATABASE_URL",
//   projectId: "YOUR_PROJECT_ID",
//   storageBucket: "YOUR_STORAGE_BUCKET",
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//   appId: "YOUR_APP_ID"
// };
// firebase.initializeApp(firebaseConfig);

document.addEventListener("DOMContentLoaded", () => {
  // Check if user is authenticated
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // User is signed in
      // Get the token and set it in a cookie for server requests
      user
        .getIdToken()
        .then((idToken) => {
          document.cookie = "firebaseToken=" + idToken + "; path=/"

          // Initialize profile page
          initProfilePage()

          // Load user data from Firebase to ensure we have the latest
          loadUserData(user.uid)

          // Load user posts
          loadUserPosts()
        })
        .catch((error) => {
          console.error("Error getting token:", error)
          // Still initialize the page even if token retrieval fails
          initProfilePage()
          loadUserPosts()
        })
    } else {
      // User is not signed in, redirect to login
      window.location.href = "/login"
    }
  })
})

// Function to load user data from Firebase
function loadUserData(userId) {
  firebase
    .database()
    .ref(`users/${userId}`)
    .once("value")
    .then((snapshot) => {
      const userData = snapshot.val()
      if (userData) {
        // Update the profile UI with the latest data
        updateProfileUI(userData)

        // Initialize form with current user data
        initializeProfileForm(userData)
      }
    })
    .catch((error) => {
      console.error("Error loading user data:", error)
    })
}

// Function to update the profile UI with user data
function updateProfileUI(userData) {
  // Update profile name
  const profileName = document.querySelector(".ursac-profile-name")
  if (profileName) {
    profileName.textContent = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
  }

  // Update profile bio
  const profileBio = document.querySelector(".ursac-profile-bio")
  if (profileBio) {
    profileBio.textContent = userData.bio || "No bio available."
  }

  // Update profile avatar
  const profileAvatar = document.getElementById("profile-avatar")
  if (profileAvatar) {
    if (userData.profileImageUrl) {
      profileAvatar.innerHTML = `<img src="${userData.profileImageUrl}" alt="Profile Image" id="profile-image">`
    } else {
      const initials = getInitials(userData.firstName, userData.lastName)
      profileAvatar.innerHTML = `<span>${initials}</span>`
    }
  }

  // Update header profile button if it exists on this page
  updateHeaderProfileButton(userData)
}

// Helper function to get user initials
function getInitials(firstName, lastName) {
  let initials = ""
  if (firstName) {
    initials += firstName.charAt(0).toUpperCase()
  }
  if (lastName) {
    initials += lastName.charAt(0).toUpperCase()
  }
  return initials
}

function initProfilePage() {
  // Get DOM elements
  const editProfileBtn = document.getElementById("edit-profile-btn")
  const profileForm = document.getElementById("profile-form")
  const cancelEditBtn = document.getElementById("cancel-edit-btn")
  const saveProfileBtn = document.getElementById("save-profile-btn")
  const uploadImageBtn = document.getElementById("upload-image-btn")
  const profileImageInput = document.getElementById("profile-image-input")
  const successAlert = document.getElementById("success-alert")
  const errorAlert = document.getElementById("error-alert")

  // Add event listeners
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      profileForm.style.display = "block"
    })
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", () => {
      profileForm.style.display = "none"
    })
  }

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", () => {
      updateProfile()
    })
  }

  if (uploadImageBtn) {
    uploadImageBtn.addEventListener("click", () => {
      profileImageInput.click()
    })
  }

  if (profileImageInput) {
    profileImageInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0]

        // Preview the image
        const reader = new FileReader()
        reader.onload = (e) => {
          const previewImage = document.getElementById("preview-image")
          if (previewImage) {
            previewImage.src = e.target.result
          } else {
            const imagePreview = document.getElementById("image-preview")
            if (imagePreview) {
              imagePreview.innerHTML = `<img src="${e.target.result}" alt="Profile Image" id="preview-image">`
            }
          }
        }
        reader.readAsDataURL(file)

        // Upload the image
        uploadProfileImage(file)
      }
    })
  }

  // Initialize profile tabs
  const profileTabs = document.querySelectorAll(".ursac-profile-tab")
  const profileSections = document.querySelectorAll(".ursac-profile-section")

  profileTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const tabName = this.getAttribute("data-tab")

      // Update active tab
      profileTabs.forEach((t) => t.classList.remove("active"))
      this.classList.add("active")

      // Show corresponding section
      profileSections.forEach((section) => {
        if (section.id === `${tabName}-section`) {
          section.classList.add("active")
        } else {
          section.classList.remove("active")
        }
      })
    })
  })
}

function updateProfile() {
  const firstName = document.getElementById("first-name").value.trim()
  const lastName = document.getElementById("last-name").value.trim()
  const bio = document.getElementById("bio").value.trim()
  const successAlert = document.getElementById("success-alert")
  const errorAlert = document.getElementById("error-alert")

  // Validate inputs
  if (!firstName || !lastName) {
    showAlert(errorAlert, "First name and last name are required")
    return
  }

  // Get current user
  const user = firebase.auth().currentUser
  if (!user) {
    showAlert(errorAlert, "You must be logged in to update your profile")
    return
  }

  // Show loading state
  const saveProfileBtn = document.getElementById("save-profile-btn")
  if (saveProfileBtn) {
    saveProfileBtn.textContent = "Saving..."
    saveProfileBtn.disabled = true
  }

  // Create user data object
  const userData = {
    firstName: firstName,
    lastName: lastName,
    bio: bio || "",
    updatedAt: firebase.database.ServerValue.TIMESTAMP,
  }

  // Update directly in Firebase
  firebase
    .database()
    .ref(`users/${user.uid}`)
    .update(userData)
    .then(() => {
      // Show success message
      showAlert(successAlert, "Profile updated successfully!")

      // Update UI
      updateProfileUI({
        firstName: firstName,
        lastName: lastName,
        bio: bio || "",
        profileImageUrl: document.getElementById("profile-image")?.src,
      })

      // Hide the form
      const profileForm = document.getElementById("profile-form")
      if (profileForm) {
        profileForm.style.display = "none"
      }

      // Broadcast profile update event to update other parts of the app
      broadcastProfileUpdate(user.uid)
    })
    .catch((error) => {
      console.error("Error updating profile:", error)
      showAlert(errorAlert, "An error occurred while updating your profile: " + error.message)
    })
    .finally(() => {
      // Reset button state
      if (saveProfileBtn) {
        saveProfileBtn.textContent = "Save Changes"
        saveProfileBtn.disabled = false
      }
    })
}

function uploadProfileImage(file) {
  const successAlert = document.getElementById("success-alert")
  const errorAlert = document.getElementById("error-alert")

  // Show upload progress
  const uploadModal = document.getElementById("upload-modal")
  const uploadProgress = document.getElementById("upload-progress")
  const uploadStatus = document.getElementById("upload-status")

  if (uploadModal) uploadModal.style.display = "flex"
  if (uploadStatus) uploadStatus.textContent = "0%"
  if (uploadProgress) uploadProgress.style.width = "0%"

  // Convert the file to base64
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => {
    const base64data = reader.result.split(",")[1]

    // Get ImgBB API key
    const apiKey = "fa517d5bab87e31f661cb28d7de365ba" // Using the ImgBB API key

    // Create form data for the API request
    const formData = new FormData()
    formData.append("image", base64data)

    // Update progress to show we're starting the upload
    if (uploadProgress) uploadProgress.style.width = "10%"
    if (uploadStatus) uploadStatus.textContent = "Uploading to ImgBB..."

    // Make the API request to ImgBB
    fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`ImgBB API error: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        // Update progress to show completion
        if (uploadProgress) uploadProgress.style.width = "100%"
        if (uploadStatus) uploadStatus.textContent = "Upload complete!"

        // Hide modal after a short delay
        setTimeout(() => {
          if (uploadModal) uploadModal.style.display = "none"
        }, 1000)

        // Get the image URL from the response
        const imageUrl = data.data.url

        // Update profile image in Firebase
        if (firebase.auth().currentUser) {
          firebase
            .database()
            .ref(`users/${firebase.auth().currentUser.uid}`)
            .update({
              profileImageUrl: imageUrl,
              updatedAt: firebase.database.ServerValue.TIMESTAMP,
            })
            .then(() => {
              // Update profile image in UI
              const profileImage = document.getElementById("profile-image")
              if (profileImage) {
                profileImage.src = imageUrl
              } else {
                const profileAvatar = document.getElementById("profile-avatar")
                if (profileAvatar) {
                  profileAvatar.innerHTML = `<img src="${imageUrl}" alt="Profile Image" id="profile-image">`
                }
              }

              // Show success message
              showAlert(successAlert, "Profile image updated successfully!")

              // Broadcast profile update event to update other parts of the app
              broadcastProfileUpdate(firebase.auth().currentUser.uid)
            })
            .catch((error) => {
              console.error("Error updating profile image in Firebase:", error)
              showAlert(errorAlert, "An error occurred while updating your profile image in the database.")
            })
        }
      })
      .catch((error) => {
        console.error("ImgBB upload failed:", error)
        if (uploadModal) uploadModal.style.display = "none"
        showAlert(errorAlert, "Failed to upload image. Please try again.")
      })
  }

  reader.onerror = (error) => {
    console.error("Error reading file:", error)
    if (uploadModal) uploadModal.style.display = "none"
    showAlert(errorAlert, "Error reading image file. Please try again.")
  }
}

// Function to broadcast profile update to other parts of the app
function broadcastProfileUpdate(userId) {
  // Create a custom event that other parts of the app can listen for
  const event = new CustomEvent("profileUpdated", {
    detail: { userId: userId },
  })
  document.dispatchEvent(event)

  // Also update the last modified timestamp in a special location for real-time sync
  firebase
    .database()
    .ref("profileUpdates")
    .update({
      [userId]: firebase.database.ServerValue.TIMESTAMP,
    })
}

// Function to update the header profile button with user data
function updateHeaderProfileButton(userData) {
  const userProfileBtn = document.getElementById("user-profile-btn")
  if (userProfileBtn && userData) {
    const initials = getInitials(userData.firstName, userData.lastName)
    const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
    const email = firebase.auth().currentUser?.email || ""

    // Update profile button
    userProfileBtn.innerHTML = `
            <div class="ursac-profile-avatar">
                ${
                  userData.profileImageUrl
                    ? `<img src="${userData.profileImageUrl}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
                    : `<span>${initials}</span>`
                }
            </div>
            <div class="ursac-profile-info">
                <div class="ursac-profile-name">${fullName}</div>
                <div class="ursac-profile-email">${email}</div>
            </div>
            <i class="fas fa-chevron-down"></i>
        `
  }
}

// Helper function to show alerts
function showAlert(alertElement, message) {
  if (!alertElement) return

  alertElement.textContent = message
  alertElement.style.display = "block"

  // Hide the alert after 5 seconds
  setTimeout(() => {
    alertElement.style.display = "none"
  }, 5000)
}

// Helper function to initialize form with current user data
function initializeProfileForm(userData) {
  const firstNameInput = document.getElementById("first-name")
  const lastNameInput = document.getElementById("last-name")
  const bioInput = document.getElementById("bio")

  if (firstNameInput) firstNameInput.value = userData.firstName || ""
  if (lastNameInput) lastNameInput.value = userData.lastName || ""
  if (bioInput) bioInput.value = userData.bio || ""
}

function loadUserPosts() {
  const userPostsFeed = document.getElementById("user-posts-feed")
  if (!userPostsFeed) {
    console.warn("Posts feed element not found")
    // Try again after a short delay
    setTimeout(loadUserPosts, 1000)
    return
  }

  // Get current user
  const user = firebase.auth().currentUser
  if (!user) {
    console.warn("User not authenticated")
    return
  }

  // Get user's posts from Firebase
  firebase
    .database()
    .ref("posts")
    .orderByChild("userId")
    .equalTo(user.uid)
    .once("value")
    .then((snapshot) => {
      const posts = snapshot.val()

      if (posts) {
        // Clear the feed
        userPostsFeed.innerHTML = ""

        // Convert to array and sort by timestamp (newest first)
        const postsArray = Object.entries(posts)
          .map(([id, post]) => ({
            id,
            ...post,
          }))
          .sort((a, b) => b.timestamp - a.timestamp)

        // Process each post
        postsArray.forEach((post) => {
          // Get user data
          firebase
            .database()
            .ref(`users/${post.userId}`)
            .once("value")
            .then((userSnapshot) => {
              const userData = userSnapshot.val()

              // Create post element
              const postElement = createPostElement(post, userData)

              // Add to feed
              userPostsFeed.appendChild(postElement)
            })
        })
      } else {
        userPostsFeed.innerHTML = `
                    <div class="ursac-no-posts">
                        <p>You haven't created any posts yet.</p>
                    </div>
                `
      }
    })
    .catch((error) => {
      console.error("Error loading user posts:", error)
      userPostsFeed.innerHTML = `
                <div class="ursac-no-posts">
                    <p>Error loading posts. Please refresh the page.</p>
                </div>
            `
    })
}

// Define the missing deletePost function
function deletePost(postId) {
  if (!postId || !firebase.auth().currentUser) return

  if (confirm("Are you sure you want to delete this post?")) {
    const userId = firebase.auth().currentUser.uid

    // Check if the post belongs to the current user
    firebase
      .database()
      .ref(`posts/${postId}`)
      .once("value")
      .then((snapshot) => {
        const post = snapshot.val()

        if (post && post.userId === userId) {
          // Delete the post
          firebase
            .database()
            .ref(`posts/${postId}`)
            .remove()
            .then(() => {
              // Remove the post element from the DOM
              const postElement = document.querySelector(`.ursac-post-card[data-post-id="${postId}"]`)
              if (postElement) {
                postElement.remove()
              }

              // Show success message
              alert("Post deleted successfully!")
            })
            .catch((error) => {
              console.error("Error deleting post:", error)
              alert("Failed to delete post. Please try again.")
            })
        } else {
          alert("You can only delete your own posts.")
        }
      })
      .catch((error) => {
        console.error("Error checking post ownership:", error)
        alert("An error occurred. Please try again.")
      })
  }
}

// Define other missing functions that might be called from the HTML
function likePost(postId) {
  if (!postId || !firebase.auth().currentUser) return

  const userId = firebase.auth().currentUser.uid
  const likeRef = firebase.database().ref(`posts/${postId}/likes/${userId}`)

  // Check if already liked
  likeRef.once("value").then((snapshot) => {
    const alreadyLiked = snapshot.val()

    if (alreadyLiked) {
      // Unlike
      likeRef.remove().then(() => {
        // Update UI
        const likeButton = document.querySelector(`.ursac-post-card[data-post-id="${postId}"] .fa-thumbs-up`)
        if (likeButton) {
          likeButton.classList.remove("fas")
          likeButton.classList.add("far")
        }

        // Update count
        updateLikeCount(postId)
      })
    } else {
      // Like
      likeRef.set(true).then(() => {
        // Update UI
        const likeButton = document.querySelector(`.ursac-post-card[data-post-id="${postId}"] .fa-thumbs-up`)
        if (likeButton) {
          likeButton.classList.remove("far")
          likeButton.classList.add("fas")
        }

        // Update count
        updateLikeCount(postId)
      })
    }
  })
}

function updateLikeCount(postId) {
  firebase
    .database()
    .ref(`posts/${postId}/likes`)
    .once("value")
    .then((snapshot) => {
      const likes = snapshot.val() || {}
      const count = Object.keys(likes).length

      // Update UI
      const likeCount = document.querySelector(`.ursac-post-card[data-post-id="${postId}"] .like-count`)
      if (likeCount) {
        likeCount.textContent = count
      }
    })
}

function toggleComments(element) {
  const postCard = element.closest(".ursac-post-card")
  if (!postCard) return

  const commentsSection = postCard.querySelector(".ursac-post-comments")
  if (commentsSection) {
    const isVisible = commentsSection.style.display !== "none"
    commentsSection.style.display = isVisible ? "none" : "block"

    // Load comments if showing
    if (!isVisible) {
      const postId = postCard.getAttribute("data-post-id")
      loadComments(postId)
    }
  }
}

function loadComments(postId) {
  const commentsListElement = document.querySelector(`.ursac-post-card[data-post-id="${postId}"] .ursac-comments-list`)
  if (!commentsListElement) return

  // Clear existing comments
  commentsListElement.innerHTML = ""

  // Load comments from Firebase
  firebase
    .database()
    .ref(`posts/${postId}/comments`)
    .once("value")
    .then((snapshot) => {
      const comments = snapshot.val()

      if (comments) {
        // Convert to array and sort by timestamp
        const commentsArray = Object.entries(comments)
          .map(([id, comment]) => ({
            id,
            ...comment,
          }))
          .sort((a, b) => a.timestamp - b.timestamp)

        // Process each comment
        commentsArray.forEach((comment) => {
          // Get user data
          firebase
            .database()
            .ref(`users/${comment.userId}`)
            .once("value")
            .then((userSnapshot) => {
              const userData = userSnapshot.val()

              // Create comment element
              const commentElement = createCommentElement(comment, userData)

              // Add to list
              commentsListElement.appendChild(commentElement)
            })
        })
      } else {
        commentsListElement.innerHTML = `
                    <div class="ursac-no-comments">
                        <p>No comments yet. Be the first to comment!</p>
                    </div>
                `
      }
    })
    .catch((error) => {
      console.error("Error loading comments:", error)
      commentsListElement.innerHTML = `
                <div class="ursac-no-comments">
                    <p>Error loading comments. Please try again.</p>
                </div>
            `
    })
}

function createCommentElement(comment, userData) {
  const commentElement = document.createElement("div")
  commentElement.className = "ursac-comment"
  commentElement.setAttribute("data-comment-id", comment.id)

  const userInitials = getInitials(userData?.firstName, userData?.lastName)
  const userName = userData ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim() : "Unknown User"
  const commentTime = formatTimeAgo(new Date(comment.timestamp))

  commentElement.innerHTML = `
        <div class="ursac-comment-avatar">
            <span>${userInitials}</span>
        </div>
        <div class="ursac-comment-content">
            <div class="ursac-comment-header">
                <div class="ursac-comment-author">${userName}</div>
                <div class="ursac-comment-time">${commentTime}</div>
            </div>
            <div class="ursac-comment-text">${linkifyText(comment.text)}</div>
        </div>
    `

  return commentElement
}

function submitComment(postId) {
  if (!postId || !firebase.auth().currentUser) return

  const commentInput = document.querySelector(`.ursac-post-card[data-post-id="${postId}"] .ursac-comment-input`)
  if (!commentInput) return

  const commentText = commentInput.value.trim()
  if (!commentText) return

  const userId = firebase.auth().currentUser.uid

  // Create comment object
  const newComment = {
    userId: userId,
    text: commentText,
    timestamp: Date.now(),
  }

  // Add to Firebase
  firebase
    .database()
    .ref(`posts/${postId}/comments`)
    .push(newComment)
    .then(() => {
      // Clear input
      commentInput.value = ""

      // Reload comments
      loadComments(postId)

      // Update comment count
      updateCommentCount(postId)
    })
    .catch((error) => {
      console.error("Error adding comment:", error)
      alert("Failed to add comment. Please try again.")
    })
}

function updateCommentCount(postId) {
  firebase
    .database()
    .ref(`posts/${postId}/comments`)
    .once("value")
    .then((snapshot) => {
      const comments = snapshot.val() || {}
      const count = Object.keys(comments).length

      // Update UI
      const commentCount = document.querySelector(`.ursac-post-card[data-post-id="${postId}"] .comment-count`)
      if (commentCount) {
        commentCount.textContent = count
      }
    })
}

function sharePost(postId) {
  // Simple share functionality - copy link to clipboard
  const postUrl = `${window.location.origin}/post/${postId}`

  // Create a temporary input element
  const tempInput = document.createElement("input")
  tempInput.value = postUrl
  document.body.appendChild(tempInput)

  // Select and copy
  tempInput.select()
  document.execCommand("copy")

  // Remove the temporary element
  document.body.removeChild(tempInput)

  // Notify user
  alert("Post link copied to clipboard!")
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// This function is similar to the one in script.js but adapted for the profile page
function createPostElement(post, userData) {
  const postId = post.id
  const postTimestamp = new Date(post.timestamp)
  const timeAgo = formatTimeAgo(postTimestamp)
  const hasLiked = post.likes && post.likes[firebase.auth().currentUser?.uid] === true
  const likesCount = countLikes(post.likes)
  const commentsCount = countComments(post.comments)

  // Create post card element
  const postCard = document.createElement("div")
  postCard.className = "ursac-post-card"
  postCard.setAttribute("data-post-id", postId)
  postCard.setAttribute("data-user-id", post.userId)

  // Get user initials for avatar
  const userInitials = getInitials(userData?.firstName, userData?.lastName)
  const userName = userData ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim() : "Unknown User"

  // Create post HTML structure
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
            ${post.content ? `<p>${linkifyText(post.content)}</p>` : ""}
    `

  // Add media content if available
  if (post.mediaURL) {
    if (post.mediaType === "image") {
      postHTML += `
                <div class="ursac-post-media">
                    <img src="${post.mediaURL}" alt="Post image" loading="lazy">
                </div>
            `
    } else if (post.mediaType === "video") {
      postHTML += `
                <div class="ursac-post-media">
                    <video controls>
                        <source src="${post.mediaURL}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
            `
    } else if (post.mediaType === "file") {
      postHTML += `
                <div class="ursac-post-attachment">
                    <a href="${post.mediaURL}" target="_blank" class="ursac-attachment-link">
                        <i class="fas fa-paperclip"></i>
                        <span>${post.mediaName || "Attachment"}</span>
                        ${post.mediaSize ? `<small>(${post.mediaSize})</small>` : ""}
                    </a>
                </div>
            `
    }
  }

  // Add post actions
  postHTML += `
        </div>
        <div class="ursac-post-footer">
            <div class="ursac-post-stat" onclick="likePost('${postId}')">
                <i class="${hasLiked ? "fas" : "far"} fa-thumbs-up"></i>
                <span class="like-count">${likesCount}</span>
            </div>
            <div class="ursac-post-stat" onclick="toggleComments(this)">
                <i class="far fa-comment"></i>
                <span class="comment-count">${commentsCount}</span>
            </div>
            <div class="ursac-post-stat" onclick="sharePost('${postId}')">
                <i class="far fa-share-square"></i>
            </div>
            <div class="ursac-post-stat" onclick="deletePost('${postId}')">
                <i class="far fa-trash-alt"></i>
            </div>
        </div>
        <div class="ursac-post-comments" style="display: none;">
            <div class="ursac-comment-input-wrapper">
                <div class="ursac-comment-avatar">
                    <span>${getInitials(firebase.auth().currentUser?.displayName || "", "")}</span>
                </div>
                <div class="ursac-comment-input-container">
                    <input type="text" class="ursac-comment-input" placeholder="Write a comment...">
                    <button class="ursac-comment-submit" onclick="submitComment('${postId}')">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
            
            <div class="ursac-comments-list">
                <!-- Comments will be loaded dynamically -->
            </div>
        </div>
    `

  postCard.innerHTML = postHTML
  return postCard
}

// Helper function to format text with links
function linkifyText(text) {
  if (!text) return ""
  // Simple regex to convert URLs to clickable links
  return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
}

// Helper function to count likes
function countLikes(likes) {
  if (!likes) return 0
  return Object.keys(likes).length
}

// Helper function to count comments
function countComments(comments) {
  if (!comments) return 0
  return Object.keys(comments).length
}

// Helper function to format timestamp to readable time
function formatTimeAgo(date) {
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) {
    return "Just now"
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }

  const options = { year: "numeric", month: "short", day: "numeric" }
  return date.toLocaleDateString(undefined, options)
}

// Add these functions to the global scope so they can be called from HTML
window.deletePost = deletePost
window.likePost = likePost
window.toggleComments = toggleComments
window.submitComment = submitComment
window.sharePost = sharePost

// Listen for profile updates from other pages
document.addEventListener("profileUpdated", (event) => {
  const userId = event.detail.userId

  // If this is the current user, update the UI
  if (userId === firebase.auth().currentUser?.uid) {
    loadUserData(userId)
  }
})

// Set up a listener for profile updates in Firebase
function setupProfileUpdateListener() {
  const currentUser = firebase.auth().currentUser
  if (!currentUser) return

  // Listen for changes to the profileUpdates node
  firebase
    .database()
    .ref("profileUpdates")
    .on("child_changed", (snapshot) => {
      const userId = snapshot.key
      const timestamp = snapshot.val()

      // If this is not the current user, update the UI
      if (userId !== currentUser.uid) {
        // Check if this user's data is displayed on the page
        const userElements = document.querySelectorAll(`[data-user-id="${userId}"]`)
        if (userElements.length > 0) {
          // Refresh user data
          firebase
            .database()
            .ref(`users/${userId}`)
            .once("value")
            .then((snapshot) => {
              const userData = snapshot.val()
              if (userData) {
                // Update all elements with this user's data
                userElements.forEach((element) => {
                  // Update based on element type
                  if (element.classList.contains("ursac-post-card")) {
                    // Update post author
                    const authorElement = element.querySelector(".ursac-post-author")
                    if (authorElement) {
                      authorElement.textContent = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
                    }

                    // Update avatar
                    const avatarElement = element.querySelector(".ursac-profile-avatar")
                    if (avatarElement) {
                      if (userData.profileImageUrl) {
                        avatarElement.innerHTML = `<img src="${userData.profileImageUrl}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
                      } else {
                        const initials = getInitials(userData.firstName, userData.lastName)
                        avatarElement.innerHTML = `<span>${initials}</span>`
                      }
                    }
                  }

                  // Add more element types as needed
                })
              }
            })
        }
      }
    })
}

// Initialize profile update listener
document.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      setupProfileUpdateListener()
    }
  })
})
