// Global variables and Firebase setup
const firebase = window.firebase


let selectedMedia = null
let postsListener = null
let newPostListener = null // NEW: Separate listener for new posts
let userProfileBtn = null
let profileDropdown = null
let logoutBtn = null
let addAccountBtn = null
let notificationsListener = null

// Enhanced duplicate prevention variables
let isSubmitting = false
let lastSubmissionTime = 0
const SUBMISSION_COOLDOWN = 2000 // 2 seconds between submissions

// IMPROVED: Track loaded posts with better duplicate prevention
let loadedPosts = new Map() // Store post ID -> timestamp mapping
let isInitialLoad = true // Track if this is the first load
let lastLoadTimestamp = 0 // Track when we last loaded posts

// Debounce function
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Profile update listener
function setupProfileUpdateListener() {
  document.addEventListener("profileUpdated", (event) => {
    const userId = event.detail.userId
    if (userId === currentUser?.uid) {
      loadUserProfile(currentUser)
    }
  })

  if (!firebase?.database) {
    console.warn("Firebase database not available for profile updates")
    return
  }

  firebase
    .database()
    .ref("profileUpdates")
    .on(
      "child_changed",
      (snapshot) => {
        const userId = snapshot.key
        if (userId !== currentUser?.uid) {
          const userElements = document.querySelectorAll(`[data-user-id="${userId}"]`)
          if (userElements.length > 0) {
            firebase
              .database()
              .ref(`users/${userId}`)
              .once("value")
              .then((snapshot) => {
                const userData = snapshot.val()
                if (userData) {
                  userElements.forEach((element) => {
                    if (element.classList.contains("ursac-post-card")) {
                      updatePostWithUserData(element, userData)
                    } else if (element.classList.contains("ursac-comment")) {
                      updateCommentWithUserData(element, userData)
                    }
                  })
                }
              })
              .catch((error) => {
                console.error("Error fetching user data:", error)
              })
          }
        }
      },
      (error) => {
        console.error("Error setting up profile update listener:", error)
      },
    )
}

// Helper functions for profile updates
function updatePostWithUserData(postElement, userData) {
  const authorElement = postElement.querySelector(".ursac-post-author")
  if (authorElement) {
    authorElement.textContent = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
  }

  const avatarElement = postElement.querySelector(".ursac-profile-avatar")
  if (avatarElement) {
    if (userData.profileImageUrl) {
      avatarElement.innerHTML = `<img src="${userData.profileImageUrl}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
    } else {
      const initials = getInitials(userData.firstName, userData.lastName)
      avatarElement.innerHTML = `<span>${initials}</span>`
    }
  }
}

function updateCommentWithUserData(commentElement, userData) {
  const authorElement = commentElement.querySelector(".ursac-comment-author")
  if (authorElement) {
    authorElement.textContent = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
  }

  const avatarElement = commentElement.querySelector(".ursac-comment-avatar span")
  if (avatarElement) {
    const initials = getInitials(userData.firstName, userData.lastName)
    avatarElement.textContent = initials
  }
}

// Profanity Filter
const prohibitedWords = [
  "bobo", "tanga", "gago", "inutil", "putangina", "punyeta", "ulol", "tarantado",
  "buwisit", "bwisit", "lintik", "kupal", "gunggong", "hinayupak", "hayop","pota","p0t4", "potae", "p0tae", "p0tah", "p0t4h", "p0tah", "p0t4h",
  "engot", "ungas", "pokpok", "puta", "leche", "burat", "tite", "pekpek",
  "bilat", "kantot", "iyot", "stupid", "idiot", "dumb", "moron", "fool",
  "imbecile", "retard", "asshole", "bitch", "bastard", "damn", "shit",
  "fuck", "cunt", "dick", "pussy", "whore", "ass",
]

function checkForProfanity(text) {
  if (!text || typeof text !== "string") {
    return { isProfane: false, matches: [] }
  }

  const lowerText = text.toLowerCase()
  const matches = []

  for (const word of prohibitedWords) {
    const regex = new RegExp(`${word}`, "gi")
    const found = lowerText.match(regex)
    if (found) {
      matches.push(...found)
    }
  }

  return {
    isProfane: matches.length > 0,
    matches: [...new Set(matches)],
  }
}

function showProfanityWarning(matches) {
  let modalElement = document.getElementById("profanity-warning-modal");

  if (!modalElement) {
    const modalHTML = `
      <div class="ursac-modal" id="profanity-warning-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
        <div class="ursac-modal-content" style="background: white; padding: 20px; border-radius: 8px; max-width: 400px; width: 90%;">
          <div class="ursac-modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3>Inappropriate Language Detected</h3>
            <button class="ursac-modal-close" id="close-profanity-modal" style="background: none; border: none; font-size: 18px; cursor: pointer;">&times;</button>
          </div>
          <div class="ursac-modal-body" style="margin-bottom: 20px;">
            <p>Your message contains inappropriate language that violates our community guidelines.</p>
            <p>Please revise your message before sending.</p>
            <div id="profanity-details" class="ursac-profanity-details" style="margin-top: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px; border-left: 3px solid #dc3545;"></div>
          </div>
          <div class="ursac-modal-footer" style="text-align: right;">
            <button class="ursac-button ursac-button-primary" id="acknowledge-profanity" style="background: #4a76a8; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">I Understand</button>
          </div>
        </div>
      </div>
    `;

    const modalContainer = document.createElement("div");
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);

    modalElement = document.getElementById("profanity-warning-modal");
  }

  // Define close function
  const closeModal = () => {
    modalElement.style.display = "none";
  };

  // Remove existing event listeners to prevent duplicates
  const closeButton = document.getElementById("close-profanity-modal");
  const acknowledgeButton = document.getElementById("acknowledge-profanity");

  // Clone and replace buttons to remove old event listeners
  if (closeButton) {
    const newCloseButton = closeButton.cloneNode(true);
    closeButton.parentNode.replaceChild(newCloseButton, closeButton);
    newCloseButton.addEventListener("click", closeModal);
  }

  if (acknowledgeButton) {
    const newAcknowledgeButton = acknowledgeButton.cloneNode(true);
    acknowledgeButton.parentNode.replaceChild(newAcknowledgeButton, acknowledgeButton);
    newAcknowledgeButton.addEventListener("click", closeModal);
  }

  // Also allow clicking outside the modal to close it
  modalElement.addEventListener("click", (e) => {
    if (e.target === modalElement) {
      closeModal();
    }
  });

  // Prevent clicks inside the modal content from closing the modal
  const modalContent = modalElement.querySelector(".ursac-modal-content");
  if (modalContent) {
    modalContent.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  const detailsElement = document.getElementById("profanity-details");
  if (detailsElement && matches && matches.length > 0) {
    detailsElement.innerHTML = `
      <p>Detected inappropriate words:</p>
      <ul style="margin: 5px 0 0 20px; padding: 0;">
        ${matches.map((word) => `<li style="color: #dc3545; font-weight: bold;">${word}</li>`).join("")}
      </ul>
    `;
  }

  modalElement.style.display = "flex";
}


// Helper functions
function getInitials(firstName, lastName) {
  let initials = ""
  if (firstName) initials += firstName.charAt(0).toUpperCase()
  if (lastName) initials += lastName.charAt(0).toUpperCase()
  return initials || "?"
}

function showModal(title, message) {
  let modalElement = document.getElementById("ursac-modal")

  if (!modalElement) {
    const modalHTML = `
      <div class="ursac-modal" id="ursac-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
        <div class="ursac-modal-content" style="background: white; padding: 20px; border-radius: 8px; max-width: 400px; width: 90%;">
          <div class="ursac-modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 id="ursac-modal-title" style="margin: 0;"></h3>
            <button class="ursac-modal-close" id="ursac-modal-close" style="background: none; border: none; font-size: 18px; cursor: pointer;">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="ursac-modal-body" style="margin-bottom: 20px;">
            <p id="ursac-modal-message" style="margin: 0;"></p>
          </div>
          <div class="ursac-modal-footer" style="text-align: right;">
            <button class="ursac-button ursac-button-primary" id="ursac-modal-ok" style="background: #4a76a8; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">OK</button>
          </div>
        </div>
      </div>
    `

    const modalContainer = document.createElement("div")
    modalContainer.innerHTML = modalHTML
    document.body.appendChild(modalContainer.firstElementChild)

    modalElement = document.getElementById("ursac-modal")

    document.getElementById("ursac-modal-close").addEventListener("click", () => {
      modalElement.style.display = "none"
    })

    document.getElementById("ursac-modal-ok").addEventListener("click", () => {
      modalElement.style.display = "none"
    })
  }

  const titleElement = document.getElementById("ursac-modal-title")
  const messageElement = document.getElementById("ursac-modal-message")

  if (titleElement) titleElement.textContent = title
  if (messageElement) messageElement.textContent = message

  modalElement.style.display = "flex"
}

// User profile functions
function loadUserProfile(user) {
  if (!user) return

  firebase
    .database()
    .ref("users/" + user.uid)
    .once("value")
    .then((snapshot) => {
      const userData = snapshot.val()

      if (userData && userProfileBtn) {
        const initials = getInitials(userData.firstName, userData.lastName)
        const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()

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
            <div class="ursac-profile-email">${user.email}</div>
          </div>
          <i class="fas fa-chevron-down"></i>
        `

        const createPostAvatar = document.getElementById("create-post-avatar")
        const createPostUsername = document.getElementById("create-post-username")

        if (createPostAvatar) {
          if (userData.profileImageUrl) {
            createPostAvatar.innerHTML = `<img src="${userData.profileImageUrl}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
          } else {
            createPostAvatar.innerHTML = `<span>${initials}</span>`
          }
        }
        if (createPostUsername) {
          createPostUsername.textContent = fullName
        }
      }
    })
    .catch((error) => {
      console.error("Error loading user profile:", error)
    })
}

function loadNotifications() {
  if (!currentUser) return

  const notifBadges = document.querySelectorAll(".ursac-notification-badge")
  if (notifBadges.length === 0) return

  const notifRef = firebase.database().ref(`notifications/${currentUser.uid}`)

  if (notificationsListener) {
    notifRef.off("value", notificationsListener)
  }

  notificationsListener = notifRef.on("value", (snapshot) => {
    let unreadCount = 0

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const notification = childSnapshot.val()
        if (!notification.read) unreadCount++
      })
    }

    notifBadges.forEach((badge) => {
      if (unreadCount > 0) {
        badge.style.display = "flex"
        badge.textContent = unreadCount > 99 ? "99+" : unreadCount
      } else {
        badge.style.display = "none"
      }
    })
  })
}

// Post creation function - only pushes to database, NO manual UI updates
function submitPost() {
  if (!currentUser) {
    showModal("Authentication Required", "You must be logged in to post.")
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
    showModal("Please Wait", `Please wait ${remainingTime} more seconds before posting again.`)
    return
  }

  const postForm = document.getElementById("postForm")
  if (!postForm) {
    console.error("Post form element not found")
    return
  }

  const content = postForm.value.trim()
  if (!content && !selectedMedia) {
    showModal("Empty Post", "Please enter some content or add media to your post.")
    return
  }

  // Check for profanity before posting
  if (content) {
    const profanityResult = checkForProfanity(content)
    if (profanityResult.isProfane) {
      showProfanityWarning(profanityResult.matches)
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
      updatePostButton()
    }
  }

  // Clear the form immediately
  postForm.value = ""
  clearMediaPreview()

  const expandedPostArea = document.getElementById("expanded-post-area")
  if (expandedPostArea) {
    expandedPostArea.classList.remove("ursac-expanded")
  }

  // Handle media upload if needed, then submit to Firebase
  const submitToFirebase = (mediaData = null) => {
    const newPostRef = firebase.database().ref("posts").push()

    const postData = {
      userId: currentUser.uid,
      content: content,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
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
        // NO MANUAL UI UPDATE - let the listener handle it
        resetSubmissionState()
      })
      .catch((error) => {
        console.error("Error creating post:", error)
        showModal("Post Creation Failed", "Failed to create post: " + error.message)
        resetSubmissionState()
      })
  }

  // Upload media if needed, otherwise submit directly
  if (selectedMedia) {
    uploadMedia(selectedMedia.file, selectedMedia.type)
      .then((mediaData) => {
        return submitToFirebase(mediaData)
      })
      .catch((error) => {
        console.error("Error uploading media:", error)
        showModal("Post Creation Failed", "Failed to upload media: " + error.message)
        resetSubmissionState()
      })
  } else {
    submitToFirebase()
  }
}

function updatePostButton() {
  const postForm = document.getElementById("postForm")
  const postButton = document.getElementById("post-button")

  if (postForm && postButton) {
    const hasContent = postForm.value.trim() !== ""
    const hasMedia = selectedMedia !== null
    postButton.disabled = !hasContent && !hasMedia
  }
}

// Media handling functions
function handleFileSelect(event, type) {
  const file = event.target.files[0]
  if (!file) return

  // Remove video support as requested
  if (type === "video") {
    showModal(
      "Video Not Supported",
      "Video uploads are not currently supported. Please select an image or document instead.",
    )
    event.target.value = ""
    return
  }

  clearMediaPreview()
  selectedMedia = {
    file: file,
    type: type,
    name: file.name,
    size: formatFileSize(file.size),
  }

  const mediaPreview = document.getElementById("media-preview")
  if (!mediaPreview) return

  const previewItem = document.createElement("div")
  previewItem.className = "ursac-preview-item"

  if (type === "image") {
    const reader = new FileReader()
    reader.onload = (e) => {
      previewItem.innerHTML = `
        <img src="${e.target.result}" alt="Selected image" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
        <div class="ursac-preview-remove" onclick="clearMediaPreview()" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <i class="fas fa-times"></i>
        </div>
      `
      previewItem.style.position = "relative"
      previewItem.style.display = "inline-block"
      mediaPreview.appendChild(previewItem)
    }
    reader.readAsDataURL(file)
  } else if (type === "file") {
    previewItem.innerHTML = `
      <div class="ursac-preview-file" style="display: flex; align-items: center; gap: 8px; padding: 10px; background: #f0f2f5; border-radius: 8px; position: relative;">
        <i class="fas fa-file" style="font-size: 24px; color: #4a76a8;"></i>
        <span>${file.name}</span>
        <div class="ursac-preview-remove" onclick="clearMediaPreview()" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px;">
          <i class="fas fa-times"></i>
        </div>
      </div>
    `
    mediaPreview.appendChild(previewItem)
  }

  updatePostButton()
  const expandedPostArea = document.getElementById("expanded-post-area")
  if (expandedPostArea) {
    expandedPostArea.classList.add("ursac-expanded")
  }
}

function clearMediaPreview() {
  const mediaPreview = document.getElementById("media-preview")
  if (mediaPreview) {
    mediaPreview.innerHTML = ""
  }
  selectedMedia = null

  const filePhoto = document.getElementById("file-photo")
  const fileAttachment = document.getElementById("file-attachment")

  if (filePhoto) filePhoto.value = ""
  if (fileAttachment) fileAttachment.value = ""

  updatePostButton()
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Upload media function (images only, no video)
function uploadMedia(file, type) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"))
      return
    }

    const uploadModal = document.getElementById("upload-modal")
    const uploadProgress = document.getElementById("upload-progress")
    const uploadStatus = document.getElementById("upload-status")

    if (uploadModal) uploadModal.style.display = "flex"
    if (uploadStatus) uploadStatus.textContent = "0%"
    if (uploadProgress) uploadProgress.style.width = "0%"

    if (type !== "image") {
      const storageRef = firebase.storage().ref()
      const fileExtension = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`
      const fileRef = storageRef.child(`files/${fileName}`)

      const uploadTask = fileRef.put(file)

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          if (uploadProgress) uploadProgress.style.width = progress + "%"
          if (uploadStatus) uploadStatus.textContent = `${Math.round(progress)}%`
        },
        (error) => {
          console.error("Upload failed:", error)
          if (uploadModal) uploadModal.style.display = "none"
          reject(error)
        },
        () => {
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            if (uploadStatus) uploadStatus.textContent = "Upload complete!"
            setTimeout(() => {
              if (uploadModal) uploadModal.style.display = "none"
            }, 1000)

            resolve({
              url: downloadURL,
              type: type,
              name: file.name,
              size: formatFileSize(file.size),
            })
          })
        },
      )
      return
    }

    // For images, use ImgBB API
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const base64data = reader.result.split(",")[1]
      const apiKey = "fa517d5bab87e31f661cb28d7de365ba"

      const formData = new FormData()
      formData.append("image", base64data)

      if (uploadProgress) uploadProgress.style.width = "10%"
      if (uploadStatus) uploadStatus.textContent = "Uploading to ImgBB..."

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
          if (uploadProgress) uploadProgress.style.width = "100%"
          if (uploadStatus) uploadStatus.textContent = "Upload complete!"

          setTimeout(() => {
            if (uploadModal) uploadModal.style.display = "none"
          }, 1000)

          resolve({
            url: data.data.url,
            type: "image",
            name: file.name,
            size: formatFileSize(file.size),
          })
        })
        .catch((error) => {
          console.error("ImgBB upload failed:", error)
          if (uploadModal) uploadModal.style.display = "none"
          reject(error)
        })
    }

    reader.onerror = (error) => {
      console.error("Error reading file:", error)
      if (uploadModal) uploadModal.style.display = "none"
      reject(error)
    }
  })
}

// NEW: Hybrid approach for posts - Initial load + Real-time updates
function setupPostsListener() {
  const postsContainer = document.getElementById("postsContainer")
  if (!postsContainer) {
    console.error("Posts container element not found")
    return
  }

  // Clear existing listeners
  if (postsListener) {
    firebase.database().ref("posts").off("value", postsListener)
  }
  if (newPostListener) {
    firebase.database().ref("posts").off("child_added", newPostListener)
  }
  
  // Reset tracking
  loadedPosts.clear()
  isInitialLoad = true
  lastLoadTimestamp = Date.now()

  console.log("Setting up hybrid posts listener (initial load + real-time updates)...")

  // STEP 1: Initial load with proper sorting (for page refresh/first load)
  postsListener = firebase
    .database()
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
        setupRealTimeListener() // Setup real-time listener after initial load
        return
      }

      try {
        // Convert to array and sort by timestamp (newest first)
        const postsArray = Object.entries(postsData)
          .map(([id, post]) => ({ 
            id, 
            ...post,
            timestamp: typeof post.timestamp === 'number' ? post.timestamp : Date.now()
          }))
          .filter(post => {
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
            const userSnapshot = await firebase.database().ref(`users/${post.userId}`).once("value")
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

// NEW: Setup real-time listener for new posts (after initial load)
function setupRealTimeListener() {
  if (isInitialLoad) {
    console.log("Skipping real-time listener setup - initial load not complete")
    return
  }

  console.log("Setting up real-time listener for new posts...")

  // STEP 2: Real-time listener for new posts only
  newPostListener = firebase
    .database()
    .ref("posts")
    .orderByChild("timestamp")
    .startAt(lastLoadTimestamp)
    .on("child_added", async (snapshot) => {
      const postId = snapshot.key
      const postData = snapshot.val()

      // Skip if this post was already loaded in initial load
      if (loadedPosts.has(postId)) {
        console.log(`Skipping already loaded post: ${postId}`)
        return
      }

      // Skip if post is older than our last load (shouldn't happen with startAt, but safety check)
      if (postData.timestamp <= lastLoadTimestamp) {
        console.log(`Skipping old post: ${postId}`)
        return
      }

      console.log(`New post detected: ${postId}`)

      try {
        const userSnapshot = await firebase.database().ref(`users/${postData.userId}`).once("value")
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
          const noPostsMessage = postsContainer.querySelector('.ursac-post-card .ursac-post-content')
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
    }, (error) => {
      console.error("Firebase real-time listener error:", error)
    })
}

// Create post element
function createPostElement(post, userData) {
  const postId = post.id
  const postTimestamp = new Date(post.timestamp)
  const timeAgo = formatTimeAgo(postTimestamp)
  const hasLiked = post.likes && post.likes[currentUser?.uid] === true
  const likesCount = countLikes(post.likes)
  const commentsCount = countComments(post.comments)

  const postCard = document.createElement("div")
  postCard.className = "ursac-post-card"
  postCard.setAttribute("data-post-id", postId)
  postCard.setAttribute("data-user-id", post.userId)
  postCard.setAttribute("data-timestamp", post.timestamp.toString())

  const userInitials = getInitials(userData?.firstName, userData?.lastName)
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
      ${post.content ? `<p>${linkifyText(post.content)}</p>` : ""}
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
      <div class="ursac-post-stat" onclick="likePost('${postId}')" style="cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 8px;">
        <i class="${hasLiked ? "fas" : "far"} fa-thumbs-up"></i>
        <span class="like-count">${likesCount}</span>
      </div>
      <div class="ursac-post-stat" onclick="toggleComments(this)" style="cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 8px;">
        <i class="far fa-comment"></i>
        <span class="comment-count">${commentsCount}</span>
      </div>
      <div class="ursac-post-stat" onclick="sharePost('${postId}')" style="cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 8px;">
        <i class="far fa-share-square"></i>
      </div>
    </div>
    <div class="ursac-post-comments" style="display: none;">
      <div class="ursac-comment-input-wrapper">
        <div class="ursac-comment-avatar">
          <span>${getInitials(currentUser?.firstName || "", currentUser?.lastName || "")}</span>
        </div>
        <div class="ursac-comment-input-container">
          <input type="text" class="ursac-comment-input" placeholder="Write a comment...">
          <button class="ursac-comment-submit" onclick="commentSystem.submitComment('${postId}')" disabled>
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

// Helper functions
function formatTimeAgo(date) {
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

function linkifyText(text) {
  if (!text) return ""
  return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
}

function countLikes(likes) {
  if (!likes) return 0
  return Object.keys(likes).length
}

function countComments(comments) {
  if (!comments) return 0
  return Object.keys(comments).length
}

// Enhanced like function with immediate UI updates
function likePost(postId) {
  if (!currentUser) {
    showModal("Authentication Required", "You must be logged in to like a post.")
    return
  }

  // IMMEDIATE UI UPDATE
  const postCard = document.querySelector(`[data-post-id="${postId}"]`)
  if (postCard) {
    const likeButton = postCard.querySelector(".ursac-post-stat i.fa-thumbs-up")
    const likeCount = postCard.querySelector(".like-count")

    if (likeButton && likeCount) {
      const isCurrentlyLiked = likeButton.classList.contains("fas")
      const currentCount = Number.parseInt(likeCount.textContent) || 0

      // Immediately update UI
      if (isCurrentlyLiked) {
        likeButton.classList.remove("fas")
        likeButton.classList.add("far")
        likeCount.textContent = Math.max(0, currentCount - 1)
      } else {
        likeButton.classList.remove("far")
        likeButton.classList.add("fas")
        likeCount.textContent = currentCount + 1
      }
    }
  }

  // Then update Firebase
  const postRef = firebase.database().ref(`posts/${postId}/likes/${currentUser.uid}`)

  firebase
    .database()
    .ref(`posts/${postId}`)
    .once("value")
    .then((postSnapshot) => {
      const postData = postSnapshot.val()
      if (!postData) return

      const shouldNotify = postData.userId !== currentUser.uid

      postRef.once("value").then((snapshot) => {
        if (snapshot.exists()) {
          postRef
            .remove()
            .then(() => {
              console.log("Post unliked successfully.")
            })
            .catch((error) => {
              console.error("Error unliking post:", error)
              // Revert UI on error
              if (postCard) {
                const likeButton = postCard.querySelector(".ursac-post-stat i.fa-thumbs-up")
                const likeCount = postCard.querySelector(".like-count")
                if (likeButton && likeCount) {
                  likeButton.classList.remove("far")
                  likeButton.classList.add("fas")
                  likeCount.textContent = Number.parseInt(likeCount.textContent) + 1
                }
              }
            })
        } else {
          postRef
            .set(true)
            .then(() => {
              console.log("Post liked successfully.")

              if (shouldNotify) {
                const notifRef = firebase.database().ref(`notifications/${postData.userId}`).push()
                return notifRef.set({
                  type: "like",
                  userId: currentUser.uid,
                  postId: postId,
                  timestamp: firebase.database.ServerValue.TIMESTAMP,
                  read: false,
                })
              }
            })
            .catch((error) => {
              console.error("Error liking post:", error)
              // Revert UI on error
              if (postCard) {
                const likeButton = postCard.querySelector(".ursac-post-stat i.fa-thumbs-up")
                const likeCount = postCard.querySelector(".like-count")
                if (likeButton && likeCount) {
                  likeButton.classList.remove("fas")
                  likeButton.classList.add("far")
                  likeCount.textContent = Math.max(0, Number.parseInt(likeCount.textContent) - 1)
                }
              }
            })
        }
      })
    })
}

function sharePost(postId) {
  if (!currentUser) {
    showModal("Authentication Required", "You must be logged in to share a post.")
    return
  }

  firebase
    .database()
    .ref(`posts/${postId}`)
    .once("value")
    .then((snapshot) => {
      const postData = snapshot.val()
      if (!postData) {
        showModal("Error", "Post not found.")
        return
      }

      const sharedContent = `Shared from ${postData.userId}: ${postData.content}`

      const profanityResult = checkForProfanity(sharedContent)
      if (profanityResult.isProfane) {
        showProfanityWarning(profanityResult.matches)
        return
      }

      const newPostRef = firebase.database().ref("posts").push()
      const newPostData = {
        userId: currentUser.uid,
        content: sharedContent,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      }

      if (postData.mediaURL) {
        newPostData.mediaURL = postData.mediaURL
        newPostData.mediaType = postData.mediaType
        newPostData.mediaName = postData.mediaName
        newPostData.mediaSize = postData.mediaSize
      }

      newPostRef
        .set(newPostData)
        .then(() => {
          console.log("Post shared successfully with ID:", newPostRef.key)
          showModal("Success", "Post shared successfully!")
        })
        .catch((error) => {
          console.error("Error sharing post:", error)
          showModal("Share Failed", "Failed to share post: " + error.message)
        })
    })
}

function toggleComments(element) {
  const postCard = element.closest(".ursac-post-card")
  if (!postCard) return

  const commentsSection = postCard.querySelector(".ursac-post-comments")
  if (commentsSection) {
    const isVisible = commentsSection.style.display === "block"
    commentsSection.style.display = isVisible ? "none" : "block"

    if (!isVisible) {
      const postId = postCard.getAttribute("data-post-id")
      if (postId && window.commentSystem) {
        window.commentSystem.loadComments(postId)
      }
    }
  }
}

// Comment and reply functions for Firebase integration (used by comments.js)
function commentPost(postId, commentText, mediaFile = null, parentCommentId = null) {
  if (!currentUser) {
    showModal("Authentication Required", "You must be logged in to comment on a post.")
    return Promise.reject(new Error("Not logged in"))
  }

  if (commentText) {
    const profanityResult = checkForProfanity(commentText)
    if (profanityResult.isProfane) {
      showProfanityWarning(profanityResult.matches)
      return Promise.reject(new Error("Comment contains inappropriate language"))
    }
  }

  const commentRef = firebase.database().ref(`posts/${postId}/comments`).push()
  const commentId = commentRef.key

  return firebase
    .database()
    .ref(`users/${currentUser.uid}`)
    .once("value")
    .then((userSnapshot) => {
      const userData = userSnapshot.val()

      const commentData = {
        id: commentId,
        userId: currentUser.uid,
        userFirstName: userData.firstName,
        userLastName: userData.lastName,
        text: commentText,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      }

      if (parentCommentId) {
        commentData.parentCommentId = parentCommentId
      }

      if (mediaFile) {
        return uploadMedia(mediaFile.file, mediaFile.type).then((mediaData) => {
          commentData.mediaURL = mediaData.url
          commentData.mediaType = mediaData.type
          commentData.mediaName = mediaData.name
          commentData.mediaSize = mediaData.size
          return commentData
        })
      } else {
        return commentData
      }
    })
    .then((commentData) => {
      return commentRef.set(commentData).then(() => commentData)
    })
    .then((commentData) => {
      return firebase
        .database()
        .ref(`posts/${postId}`)
        .once("value")
        .then((postSnapshot) => {
          const postData = postSnapshot.val()

          const postCard = document.querySelector(`[data-post-id="${postId}"]`)
          if (postCard) {
            const commentCount = postCard.querySelector(".comment-count")
            if (commentCount) {
              const currentCount = Number.parseInt(commentCount.textContent) || 0
              commentCount.textContent = currentCount + 1
            }
          }

          if (postData && postData.userId !== currentUser.uid) {
            const notifRef = firebase.database().ref(`notifications/${postData.userId}`).push()
            return notifRef.set({
              type: "comment",
              userId: currentUser.uid,
              postId: postId,
              commentId: commentData.id,
              commentText: commentText,
              timestamp: firebase.database.ServerValue.TIMESTAMP,
              read: false,
            })
          }

          return Promise.resolve()
        })
    })
    .catch((error) => {
      console.error("Error adding comment:", error)
      showModal("Comment Failed", "Failed to add comment. Please try again.")
      throw error
    })
}

function replyToComment(postId, parentCommentId, replyText, mediaFile = null) {
  return commentPost(postId, replyText, mediaFile, parentCommentId)
}

// Setup event listeners
function setupEventListeners() {
  const postForm = document.getElementById("postForm")
  const postButton = document.getElementById("post-button")
  const filePhoto = document.getElementById("file-photo")
  const fileAttachment = document.getElementById("file-attachment")
  const expandedPostArea = document.getElementById("expanded-post-area")

  console.log("Setting up event listeners...")
  console.log("Post form found:", !!postForm)
  console.log("Post button found:", !!postButton)

  if (postForm) {
    postForm.addEventListener("click", () => {
      if (expandedPostArea) {
        expandedPostArea.classList.add("ursac-expanded")
      }
    })

    postForm.addEventListener("input", () => {
      updatePostButton()
    })
  }

  // Attach post button event listener
  if (postButton) {
    const newPostButton = postButton.cloneNode(true)
    postButton.parentNode.replaceChild(newPostButton, postButton)

    newPostButton.addEventListener("click", function (e) {
      e.preventDefault()
      console.log("Post button clicked!")
      if (!this.disabled) {
        submitPost()
      }
    })

    console.log("Post button event listener attached successfully")
  }

  if (filePhoto) {
    filePhoto.addEventListener("change", (e) => {
      handleFileSelect(e, "image")
    })
  }

  if (fileAttachment) {
    fileAttachment.addEventListener("change", (e) => {
      handleFileSelect(e, "file")
    })
  }

  document.addEventListener("click", (event) => {
    if (
      expandedPostArea &&
      expandedPostArea.classList.contains("ursac-expanded") &&
      !event.target.closest(".ursac-create-post") &&
      event.target !== postForm
    ) {
      expandedPostArea.classList.remove("ursac-expanded")
    }
  })
}

function initializeProfileElements() {
  userProfileBtn = document.getElementById("user-profile-btn")
  profileDropdown = document.getElementById("user-profile-dropdown")
  logoutBtn = document.getElementById("logout-btn")
  addAccountBtn = document.getElementById("add-account-btn")

  if (userProfileBtn) {
    userProfileBtn.addEventListener("click", function (e) {
      e.stopPropagation()
      if (profileDropdown) {
        const isVisible = profileDropdown.style.display === "block"
        profileDropdown.style.display = isVisible ? "none" : "block"

        const chevron = this.querySelector(".fa-chevron-down")
        if (chevron) {
          chevron.style.transform = isVisible ? "rotate(0deg)" : "rotate(180deg)"
          chevron.style.transition = "transform 0.2s"
        }

        if (!isVisible) {
          const buttonRect = userProfileBtn.getBoundingClientRect()
          profileDropdown.style.bottom = `${buttonRect.height + 8}px`
        }
      }
    })
  }

  document.addEventListener("click", (e) => {
    if (
      profileDropdown &&
      !profileDropdown.contains(e.target) &&
      userProfileBtn &&
      !userProfileBtn.contains(e.target)
    ) {
      profileDropdown.style.display = "none"
      const chevron = userProfileBtn?.querySelector(".fa-chevron-down")
      if (chevron) {
        chevron.style.transform = "rotate(0deg)"
      }
    }
  })

  if (logoutBtn) {
    logoutBtn.innerHTML = `
      <i class="fas fa-sign-out-alt"></i>
      <span>Log out</span>
    `
    logoutBtn.addEventListener("click", () => {
      firebase
        .auth()
        .signOut()
        .then(() => {
          window.location.href = "/login"
        })
        .catch((error) => {
          console.error("Logout Error:", error)
        })
    })
  }

  if (addAccountBtn) {
    addAccountBtn.innerHTML = `
      <i class="fas fa-user-plus"></i>
      <span>Add an existing account</span>
    `
    addAccountBtn.addEventListener("click", () => {
      firebase
        .auth()
        .signOut()
        .then(() => {
          sessionStorage.setItem("addingAccount", "true")
          window.location.href = "/login"
        })
    })
  }
}

// IMPROVED: Main initialization with hybrid approach
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded - Initializing with hybrid post loading approach...")

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      currentUser = user
      console.log("User authenticated:", user.email)

      setTimeout(() => {
        initializeProfileElements()
        loadUserProfile(user)
        setupPostsListener() // NEW: Hybrid approach - initial load + real-time updates
        loadNotifications()
        setupProfileUpdateListener()
        setupEventListeners()
        updatePostButton()

        // Initialize comment system if available
        if (window.commentSystem) {
          window.commentSystem.initialize(user)
        }

        setInterval(loadNotifications, 30000)
      }, 100)
    } else {
      window.location.href = "/login"
    }
  })

  const searchInput = document.getElementById("search-input")
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim()
      if (query) {
        // searchPosts(query) // Implement if needed
      } else {
        setupPostsListener() // Reload posts
      }
    })
  }
})

// Make functions available globally for HTML onclick handlers
window.likePost = likePost
window.toggleComments = toggleComments
window.sharePost = sharePost
window.clearMediaPreview = clearMediaPreview
window.commentPost = commentPost
window.replyToComment = replyToComment
window.checkForProfanity = checkForProfanity
window.showProfanityWarning = showProfanityWarning
window.showModal = showModal
window.submitPost = submitPost