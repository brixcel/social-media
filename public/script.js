// Add this function to the top of script.js
function setupProfileUpdateListener() {
  // Listen for profile updates from other pages
  document.addEventListener("profileUpdated", (event) => {
    const userId = event.detail.userId

    // If this is the current user, update the UI
    if (userId === currentUser?.uid) {
      loadUserProfile(currentUser)
    }
  })

  // Listen for changes to the profileUpdates node in Firebase
  firebase
    .database()
    .ref("profileUpdates")
    .on("child_changed", (snapshot) => {
      const userId = snapshot.key
      const timestamp = snapshot.val()

      // If this is not the current user, update the UI
      if (userId !== currentUser?.uid) {
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
                    updatePostWithUserData(element, userData)
                  } else if (element.classList.contains("ursac-comment")) {
                    updateCommentWithUserData(element, userData)
                  }
                  // Add more element types as needed
                })
              }
            })
        }
      }
    })
}

// Helper function to update post elements with new user data
function updatePostWithUserData(postElement, userData) {
  // Update author name
  const authorElement = postElement.querySelector(".ursac-post-author")
  if (authorElement) {
    authorElement.textContent = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
  }

  // Update avatar
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

// Helper function to update comment elements with new user data
function updateCommentWithUserData(commentElement, userData) {
  // Update author name
  const authorElement = commentElement.querySelector(".ursac-comment-author")
  if (authorElement) {
    authorElement.textContent = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
  }

  // Update avatar
  const avatarElement = commentElement.querySelector(".ursac-comment-avatar span")
  if (avatarElement) {
    const initials = getInitials(userData.firstName, userData.lastName)
    avatarElement.textContent = initials
  }
}

const firebase = window.firebase
let currentUser = null
let selectedMedia = null
let postsLoaded = false
let postsListener = null
let userProfileBtn = null
let profileDropdown = null
let logoutBtn = null
let addAccountBtn = null
let notificationsListener = null

// Profanity Filter - List of prohibited words (Filipino and English)
const prohibitedWords = [
  // Filipino bad words
  "bobo",
  "tanga",
  "gago",
  "inutil",
  "putangina",
  "punyeta",
  "ulol",
  "tarantado",
  "buwisit",
  "bwisit",
  "lintik",
  "kupal",
  "gunggong",
  "hinayupak",
  "hayop",
  "engot",
  "ungas",
  "pokpok",
  "puta",
  "leche",
  "burat",
  "tite",
  "pekpek",
  "bilat",
  "kantot",
  "iyot",

  // English bad words
  "stupid",
  "idiot",
  "dumb",
  "moron",
  "fool",
  "imbecile",
  "retard",
  "asshole",
  "bitch",
  "bastard",
  "damn",
  "shit",
  "fuck",
  "cunt",
  "dick",
  "pussy",
  "whore",
  "ass",
]

// Profanity Filter - Check if text contains prohibited words
function checkForProfanity(text) {
  if (!text || typeof text !== "string") {
    return { isProfane: false, matches: [] }
  }

  // Convert to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase()

  // Find all matches
  const matches = []

  for (const word of prohibitedWords) {
    // Use regex to match whole words and embedded words
    const regex = new RegExp(`${word}`, "gi")
    const found = lowerText.match(regex)

    if (found) {
      matches.push(...found)
    }
  }

  return {
    isProfane: matches.length > 0,
    matches: [...new Set(matches)], // Remove duplicates
  }
}

// Profanity Filter - Show warning modal
function showProfanityWarning(matches) {
  // Create modal if it doesn't exist
  let modalElement = document.getElementById("profanity-warning-modal")

  if (!modalElement) {
    const modalHTML = `
      <div class="ursac-modal" id="profanity-warning-modal">
        <div class="ursac-modal-content">
          <div class="ursac-modal-header">
            <h3>Inappropriate Language Detected</h3>
            <button class="ursac-modal-close" id="close-profanity-modal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="ursac-modal-body">
            <p>Your message contains inappropriate language that violates our community guidelines.</p>
            <p>Please revise your message before sending.</p>
            <div id="profanity-details" class="ursac-profanity-details" style="margin-top: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px; border-left: 3px solid #dc3545;"></div>
          </div>
          <div class="ursac-modal-footer">
            <button class="ursac-button ursac-button-primary" id="acknowledge-profanity">I Understand</button>
          </div>
        </div>
      </div>
    `

    const modalContainer = document.createElement("div")
    modalContainer.innerHTML = modalHTML
    document.body.appendChild(modalContainer.firstElementChild)

    modalElement = document.getElementById("profanity-warning-modal")

    // Add event listeners
    document.getElementById("close-profanity-modal").addEventListener("click", () => {
      modalElement.style.display = "none"
    })

    document.getElementById("acknowledge-profanity").addEventListener("click", () => {
      modalElement.style.display = "none"
    })
  }

  // Update details
  const detailsElement = document.getElementById("profanity-details")
  if (detailsElement && matches && matches.length > 0) {
    detailsElement.innerHTML = `
      <p>Detected inappropriate words:</p>
      <ul style="margin: 5px 0 0 20px; padding: 0;">
        ${matches.map((word) => `<li style="color: #dc3545; font-weight: bold;">${word}</li>`).join("")}
      </ul>
    `
  }

  // Show modal
  modalElement.style.display = "flex"
}

// Add this helper function at the top level of your script.js file
function getInitials(firstName, lastName) {
  let initials = ""
  if (firstName) initials += firstName.charAt(0).toUpperCase()
  if (lastName) initials += lastName.charAt(0).toUpperCase()
  return initials || "?"
}

// Define handleCommentInput function at the global scope
function handleCommentInput(e) {
  const inputValue = e.target.value.trim()
  const submitBtn = e.target.nextElementSibling
  if (submitBtn) {
    submitBtn.disabled = inputValue.length === 0
  }
}

// Updated loadNotifications function to properly display notification count
function loadNotifications() {
  if (!currentUser) return

  // Get all notification badges
  const notifBadges = document.querySelectorAll(".ursac-notification-badge")
  if (notifBadges.length === 0) return

  const notifRef = firebase.database().ref(`notifications/${currentUser.uid}`)

  // Remove any existing listener first to prevent duplicates
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

    // Update all notification badges with count
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

// Move loadUserProfile function here, outside DOMContentLoaded
// Update the loadUserProfile function to handle profile images
function loadUserProfile(user) {
  if (!user) {
    return
  }

  firebase
    .database()
    .ref("users/" + user.uid)
    .once("value")
    .then((snapshot) => {
      const userData = snapshot.val()

      // Use the global userProfileBtn instead of creating a new local variable
      if (userData && userProfileBtn) {
        const initials = getInitials(userData.firstName, userData.lastName)
        const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()

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
                        <div class="ursac-profile-email">${user.email}</div>
                    </div>
                    <i class="fas fa-chevron-down"></i>
                `

        // Update create post area
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
      } else {
        console.error("User data or profile button not found")
      }
    })
    .catch((error) => {
      console.error("Error loading user profile:", error)
    })
}

// Add document ready check at the beginning of the file
document.addEventListener("DOMContentLoaded", () => {
  const postInput = document.getElementById("post-input")
  const postButton = document.getElementById("post-button")
  const mediaPreview = document.getElementById("media-preview")
  const filePhoto = document.getElementById("file-photo")
  const fileVideo = document.getElementById("file-video")
  const fileAttachment = document.getElementById("file-attachment")
  const uploadModal = document.getElementById("upload-modal")
  const uploadProgress = document.getElementById("upload-progress")
  const uploadStatus = document.getElementById("upload-status")

  // Initialize Firebase listeners only after DOM is ready
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      currentUser = user
      initializeProfileElements() // Initialize profile elements first
      loadUserProfile(user) // Load user profile data
      loadPosts() // Load posts after user is authenticated
      loadNotifications() // Load notifications after user is authenticated

      // Set up profile update listener
      setupProfileUpdateListener()

      // Set up a periodic refresh of notifications
      setInterval(loadNotifications, 30000) // Refresh every 30 seconds
    } else {
      window.location.href = "/login"
    }
  })

  // Function to initialize profile elements
  function initializeProfileElements() {
    userProfileBtn = document.getElementById("user-profile-btn")
    profileDropdown = document.getElementById("user-profile-dropdown")
    logoutBtn = document.getElementById("logout-btn")
    addAccountBtn = document.getElementById("add-account-btn")

    // Toggle profile dropdown
    if (userProfileBtn) {
      userProfileBtn.addEventListener("click", function (e) {
        e.stopPropagation()
        if (profileDropdown) {
          const isVisible = profileDropdown.style.display === "block"

          // Toggle dropdown
          profileDropdown.style.display = isVisible ? "none" : "block"

          // Toggle chevron rotation
          const chevron = this.querySelector(".fa-chevron-down")
          if (chevron) {
            chevron.style.transform = isVisible ? "rotate(0deg)" : "rotate(180deg)"
            chevron.style.transition = "transform 0.2s"
          }

          // Position the dropdown above the button
          if (!isVisible) {
            const buttonRect = userProfileBtn.getBoundingClientRect()
            profileDropdown.style.bottom = `${buttonRect.height + 8}px`
          }
        }
      })
    }

    // Close dropdown when clicking outside
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

    // Setup logout button
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

    // Setup add account button
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

  // Add event listeners only if elements exist
  const setupEventListeners = () => {
    const userProfileBtn = document.getElementById("user-profile-btn")
    const profileDropdown = document.getElementById("user-profile-dropdown")
    const logoutBtn = document.getElementById("logout-btn")
    const addAccountBtn = document.getElementById("add-account-btn")

    if (userProfileBtn) {
      userProfileBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        if (profileDropdown) {
          profileDropdown.classList.toggle("show")
        }
      })
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        firebase
          .auth()
          .signOut()
          .then(() => {
            window.location.href = "/login"
          })
      })
    }

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (
        profileDropdown &&
        !profileDropdown.contains(e.target) &&
        userProfileBtn &&
        !userProfileBtn.contains(e.target)
      ) {
        profileDropdown.classList.remove("show")
      }
    })
  }

  // Call setup function after DOM is ready
  setupEventListeners()

  // Setup search input event listener
  const searchInput = document.getElementById("search-input")
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim()
      if (query) {
        searchPosts(query)
      } else {
        // Reset the feed if the search input is cleared
        loadPosts()
      }
    })
  }

  // Modal elements
  const postModal = document.getElementById("post-modal")
  const openPostModalBtn = document.getElementById("open-post-modal")
  const closePostModalBtn = document.getElementById("close-post-modal")
  const modalPostContent = document.getElementById("modal-post-content")
  const modalPostButton = document.getElementById("modal-post-button")
  const modalMediaPreview = document.getElementById("modal-media-preview")
  let modalSelectedMedia = null

  // Open modal
  if (openPostModalBtn) {
    openPostModalBtn.addEventListener("click", () => {
      postModal.style.display = "flex"
      modalPostContent.value = ""
      modalMediaPreview.innerHTML = ""
      modalSelectedMedia = null
      modalPostButton.disabled = true
    })
  }

  // Close modal
  if (closePostModalBtn) {
    closePostModalBtn.addEventListener("click", () => {
      postModal.style.display = "none"
    })
  }

  // Enable/disable post button based on input/media
  if (modalPostContent) {
    modalPostContent.addEventListener("input", () => {
      modalPostButton.disabled = modalPostContent.value.trim().length === 0 && !modalSelectedMedia
    })
  }

  // Media file handlers for modal
  document.getElementById("modal-file-photo")?.addEventListener("change", (e) => {
    handleModalFileSelect(e, "image")
  })
  document.getElementById("modal-file-video")?.addEventListener("change", (e) => {
    handleModalFileSelect(e, "video")
  })
  document.getElementById("modal-file-attachment")?.addEventListener("change", (e) => {
    handleModalFileSelect(e, "file")
  })

  function handleModalFileSelect(event, type) {
    const file = event.target.files[0]
    if (!file) return
    modalMediaPreview.innerHTML = ""
    modalSelectedMedia = { file, type, name: file.name, size: file.size }
    const previewItem = document.createElement("div")
    previewItem.className = "ursac-preview-item"
    if (type === "image") {
      const img = document.createElement("img")
      img.src = URL.createObjectURL(file)
      previewItem.appendChild(img)
    } else if (type === "video") {
      const video = document.createElement("video")
      video.src = URL.createObjectURL(file)
      video.controls = true
      previewItem.appendChild(video)
    } else {
      previewItem.innerHTML = `<i class="fas fa-paperclip"></i><span>${file.name}</span>`
    }
    modalMediaPreview.appendChild(previewItem)
    modalPostButton.disabled = modalPostContent.value.trim().length === 0 && !modalSelectedMedia
  }

  // Post creation logic for modal
  if (modalPostButton) {
    modalPostButton.addEventListener("click", () => {
      if (!currentUser) {
        showModal("Authentication Required", "You must be logged in to post.")
        return
      }
      const content = modalPostContent.value.trim()

      // Check for profanity before posting
      if (content) {
        const profanityResult = checkForProfanity(content)
        if (profanityResult.isProfane) {
          showProfanityWarning(profanityResult.matches)
          return
        }
      }

      modalPostButton.disabled = true

      // If there is media, upload it first
      if (modalSelectedMedia) {
        uploadMedia(modalSelectedMedia.file, modalSelectedMedia.type)
          .then((mediaData) => {
            const newPostRef = firebase.database().ref("posts").push()
            newPostRef
              .set({
                userId: currentUser.uid,
                content: content,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                mediaURL: mediaData.url,
                mediaType: mediaData.type,
                mediaName: mediaData.name,
                mediaSize: mediaData.size,
              })
              .then(() => {
                console.log("Post with media created successfully.")
              })
              .catch((error) => {
                console.error("Error creating post with media:", error)
                showModal("Post Creation Failed", "Failed to create post: " + error.message)
              })
          })
          .catch((error) => {
            console.error("Media upload failed:", error)
            showModal("Post Creation Failed", "Failed to create post: " + error.message)
          })
          .finally(() => {
            modalPostButton.disabled = false
          })
      } else {
        // No media, just create the post
        const newPostRef = firebase.database().ref("posts").push()
        newPostRef
          .set({
            userId: currentUser.uid,
            content: content,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
          })
          .then(() => {
            console.log("Post created successfully.")
          })
          .catch((error) => {
            console.error("Error creating post:", error)
            showModal("Post Creation Failed", "Failed to create post: " + error.message)
          })
          .finally(() => {
            modalPostButton.disabled = false
          })
      }

      postModal.style.display = "none"
      // Reset modal state
      modalPostContent.value = ""
      modalMediaPreview.innerHTML = ""
      modalSelectedMedia = null
      modalPostButton.disabled = true
    })
  }

  initializeCommentListeners()
})

// Completely rewritten loadPosts function to ensure newest posts are at the top
function loadPosts() {
  // Remove any existing listener to prevent duplicates
  if (postsListener) {
    const postsRef = firebase.database().ref("posts")
    postsRef.off("value", postsListener)
  }

  const postsRef = firebase.database().ref("posts")
  postsListener = postsRef.on(
    "value",
    async (snapshot) => {
      const postsData = snapshot.val()
      const postsFeed = document.getElementById("posts-feed")

      if (!postsFeed) {
        console.error("Posts feed element not found")
        return
      }

      // Clear the feed
      postsFeed.innerHTML = ""

      if (!postsData) {
        postsFeed.innerHTML = `
        <div class="ursac-post-card">
          <div class="ursac-post-content" style="text-align: center;">
            No posts yet. Be the first to post something!
          </div>
        </div>
      `
        postsLoaded = true
        return
      }

      try {
        // Convert to array and sort by timestamp in descending order (newest first)
        const postsArray = Object.entries(postsData)
          .map(([id, post]) => ({
            id,
            ...post,
          }))
          .sort((a, b) => b.timestamp - a.timestamp)

        console.log(
          "Posts sorted by timestamp (newest first):",
          postsArray.map((p) => ({
            id: p.id,
            timestamp: p.timestamp,
            time: new Date(p.timestamp).toLocaleTimeString(),
            content: p.content?.substring(0, 15) || "[No content]",
          })),
        )

        // Process each post one by one, in order
        for (const post of postsArray) {
          try {
            const userSnapshot = await firebase
              .database()
              .ref("users/" + post.userId)
              .once("value")
            const userData = userSnapshot.val()
            const postElement = createPostElement(post, userData)

            // Add timestamp as data attribute for debugging
            postElement.setAttribute("data-timestamp", post.timestamp)
            postElement.setAttribute("data-time", new Date(post.timestamp).toLocaleTimeString())

            // Add the post to the feed (newest first)
            postsFeed.appendChild(postElement)
          } catch (error) {
            console.error(`Error processing post ${post.id}:`, error)
          }
        }
      } catch (error) {
        console.error("Error loading posts:", error)
        postsFeed.innerHTML = `
        <div class="ursac-post-card">
          <div class="ursac-post-content" style="text-align: center;">
            Error loading posts. Please refresh the page.
          </div>
        </div>
      `
      }

      postsLoaded = true
    },
    (error) => {
      console.error("Error loading posts:", error)
    },
  )
}

// Also update the createPost function to ensure new posts appear at the top immediately
function createPost() {
  if (!currentUser) {
    showModal("Authentication Required", "You must be logged in to post.")
    return
  }

  const postInput = document.getElementById("post-input")
  if (!postInput) return

  const content = postInput.value.trim()
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

  const postButton = document.getElementById("post-button")
  if (postButton) postButton.disabled = true

  // Current timestamp to ensure proper ordering
  const timestamp = Date.now() // Use client timestamp for immediate feedback

  // If there is media, upload it first
  if (selectedMedia) {
    uploadMedia(selectedMedia.file, selectedMedia.type)
      .then((mediaData) => {
        const newPostRef = firebase.database().ref("posts").push()
        return newPostRef.set({
          userId: currentUser.uid,
          content: content,
          timestamp: timestamp, // Use client timestamp for immediate ordering
          mediaURL: mediaData.url,
          mediaType: mediaData.type,
          mediaName: mediaData.name,
          mediaSize: mediaData.size,
        })
      })
      .then(() => {
        console.log("Post with media created successfully at timestamp:", timestamp)
        postInput.value = ""
        clearMediaPreview()
        if (postButton) postButton.disabled = true

        // Collapse expanded post area
        const expandedPostArea = document.getElementById("expanded-post-area")
        if (expandedPostArea) {
          expandedPostArea.classList.remove("ursac-expanded")
        }

        // Force refresh posts to ensure new post appears at the top
        // No need to call loadPosts() as the Firebase listener will trigger
      })
      .catch((error) => {
        console.error("Error creating post with media:", error)
        showModal("Post Creation Failed", "Failed to create post: " + error.message)
        if (postButton) postButton.disabled = false
      })
  } else {
    // No media, just create the post
    const newPostRef = firebase.database().ref("posts").push()
    newPostRef
      .set({
        userId: currentUser.uid,
        content: content,
        timestamp: timestamp, // Use client timestamp for immediate ordering
      })
      .then(() => {
        console.log("Post created successfully at timestamp:", timestamp)
        postInput.value = ""
        if (postButton) postButton.disabled = true

        // Collapse expanded post area
        const expandedPostArea = document.getElementById("expanded-post-area")
        if (expandedPostArea) {
          expandedPostArea.classList.remove("ursac-expanded")
        }

        // Force refresh posts to ensure new post appears at the top
        // No need to call loadPosts() as the Firebase listener will trigger
      })
      .catch((error) => {
        console.error("Error creating post:", error)
        showModal("Post Creation Failed", "Failed to create post: " + error.message)
        if (postButton) postButton.disabled = false
      })
  }
}

// Update the Firebase query to ensure we're getting the most recent posts
// This is an alternative implementation that uses limitToLast with orderByChild
function loadPostsAlternative() {
  // Remove any existing listener to prevent duplicates
  if (postsListener) {
    const postsRef = firebase.database().ref("posts")
    postsRef.off("value", postsListener)
  }

  const postsRef = firebase.database().ref("posts")
  postsListener = postsRef
    .orderByChild("timestamp") // Order by timestamp
    .limitToLast(50) // Get the last 50 posts (most recent)
    .on(
      "value",
      (snapshot) => {
        const postsData = snapshot.val()
        const postsFeed = document.getElementById("posts-feed")

        if (!postsFeed) {
          console.error("Posts feed element not found")
          return
        }

        postsFeed.innerHTML = ""

        if (postsData) {
          // Convert to array and sort by timestamp in descending order (newest first)
          const postsArray = Object.entries(postsData)
            .map(([id, post]) => ({
              id,
              ...post,
            }))
            .sort((a, b) => b.timestamp - a.timestamp) // Ensure newest posts are first

          const fragment = document.createDocumentFragment()

          // Process posts in order - newest first
          Promise.all(
            postsArray.map((post) => {
              return firebase
                .database()
                .ref("users/" + post.userId)
                .once("value")
                .then((userSnapshot) => {
                  const userData = userSnapshot.val()
                  const postElement = createPostElement(post, userData)
                  fragment.appendChild(postElement)
                })
                .catch((error) => {
                  console.error("Error loading user data for post:", error)
                })
            }),
          ).then(() => {
            // Clear the feed and add all posts
            postsFeed.innerHTML = ""
            postsFeed.appendChild(fragment)
          })
        } else {
          postsFeed.innerHTML = `
            <div class="ursac-post-card">
              <div class="ursac-post-content" style="text-align: center;">
                No posts yet. Be the first to post something!
              </div>
            </div>
          `
        }
        postsLoaded = true
      },
      (error) => {
        console.error("Error loading posts:", error)
      },
    )
}

function countLikes(likes) {
  if (!likes) return 0
  return Object.keys(likes).length
}

function countComments(comments) {
  if (!comments) return 0
  return Object.keys(comments).length
}

function likePost(postId) {
  if (!currentUser) {
    showModal("Authentication Required", "You must be logged in to like a post.")
    return
  }

  const postRef = firebase.database().ref(`posts/${postId}/likes/${currentUser.uid}`)

  // First, check if the post belongs to someone else (to avoid self-notifications)
  firebase
    .database()
    .ref(`posts/${postId}`)
    .once("value")
    .then((postSnapshot) => {
      const postData = postSnapshot.val()
      if (!postData) return

      // Don't notify if liking your own post
      const shouldNotify = postData.userId !== currentUser.uid

      postRef.once("value").then((snapshot) => {
        if (snapshot.exists()) {
          // User is unliking the post
          postRef
            .remove()
            .then(() => {
              console.log("Post unliked successfully.")
            })
            .catch((error) => {
              console.error("Error unliking post:", error)
            })
        } else {
          // User is liking the post
          postRef
            .set(true)
            .then(() => {
              console.log("Post liked successfully.")

              // Add notification if it's not the user's own post
              if (shouldNotify) {
                // Store notification under recipient's notifications
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
            })
        }
      })
    })
}

// Updated commentPost function to ensure notifications are properly created
function commentPost(postId, commentText, mediaFile = null, parentCommentId = null) {
  if (!currentUser) {
    showModal("Authentication Required", "You must be logged in to comment on a post.")
    return Promise.reject(new Error("Not logged in"))
  }

  // Check for profanity before posting comment
  if (commentText) {
    const profanityResult = checkForProfanity(commentText)
    if (profanityResult.isProfane) {
      showProfanityWarning(profanityResult.matches)
      return Promise.reject(new Error("Comment contains inappropriate language"))
    }
  }

  // Create a reference for the new comment
  const commentRef = firebase.database().ref(`posts/${postId}/comments`).push()
  const commentId = commentRef.key

  return firebase
    .database()
    .ref(`users/${currentUser.uid}`)
    .once("value")
    .then((userSnapshot) => {
      const userData = userSnapshot.val()

      // Create comment data object
      const commentData = {
        id: commentId,
        userId: currentUser.uid,
        userFirstName: userData.firstName,
        userLastName: userData.lastName,
        text: commentText,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      }

      // If this is a reply to another comment, add the parent comment ID
      if (parentCommentId) {
        commentData.parentCommentId = parentCommentId
      }

      // Add media data if available
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
      // Save the comment to the posts node
      return commentRef.set(commentData).then(() => commentData)
    })
    .then((commentData) => {
      // Get post data to check if we need to create a notification
      return firebase
        .database()
        .ref(`posts/${postId}`)
        .once("value")
        .then((postSnapshot) => {
          const postData = postSnapshot.val()

          // Update comment count in the UI
          const postCard = document.querySelector(`[data-post-id="${postId}"]`)
          if (postCard) {
            const commentCount = postCard.querySelector(".comment-count")
            if (commentCount) {
              const currentCount = Number.parseInt(commentCount.textContent) || 0
              commentCount.textContent = currentCount + 1
            }
          }

          // Don't create notification if commenting on own post
          if (postData && postData.userId !== currentUser.uid) {
            // Create notification for post owner
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

          // If this is a reply to another comment, also notify the comment owner
          if (parentCommentId && postData && postData.comments && postData.comments[parentCommentId]) {
            const parentComment = postData.comments[parentCommentId]

            // Don't notify if replying to your own comment
            if (parentComment.userId !== currentUser.uid) {
              const replyNotifRef = firebase.database().ref(`notifications/${parentComment.userId}`).push()
              return replyNotifRef.set({
                type: "reply",
                userId: currentUser.uid,
                postId: postId,
                commentId: commentData.id,
                parentCommentId: parentCommentId,
                commentText: commentText,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                read: false,
              })
            }
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

// New function to reply to a comment
function replyToComment(postId, parentCommentId, replyText, mediaFile = null) {
  return commentPost(postId, replyText, mediaFile, parentCommentId)
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

      // Check for profanity in shared content
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

function searchPosts(query) {
  const postsFeed = document.getElementById("posts-feed")
  if (!postsFeed) return

  const allPosts = Array.from(postsFeed.getElementsByClassName("ursac-post-card"))

  // Filter posts based on the query
  allPosts.forEach((postElement) => {
    const postContent = postElement.querySelector(".ursac-post-content")?.textContent.toLowerCase() || ""

    if (postContent.includes(query.toLowerCase())) {
      postElement.style.display = "block" // Show matching posts
    } else {
      postElement.style.display = "none" // Hide non-matching posts
    }
  })
}

function loadFriends() {
  // Implementation for loading friends
}

function setupEventListeners() {
  const postInput = document.getElementById("post-input")
  const postButton = document.getElementById("post-button")
  const filePhoto = document.getElementById("file-photo")
  const fileVideo = document.getElementById("file-video")
  const fileAttachment = document.getElementById("file-attachment")
  const expandedPostArea = document.getElementById("expanded-post-area")

  if (postInput) {
    postInput.addEventListener("click", () => {
      if (expandedPostArea) {
        expandedPostArea.classList.add("ursac-expanded")
      }
    })

    postInput.addEventListener("input", () => {
      updatePostButton()
    })
  }

  document.addEventListener("click", (event) => {
    if (
      expandedPostArea &&
      expandedPostArea.classList.contains("ursac-expanded") &&
      !event.target.closest(".ursac-create-post") &&
      event.target !== postInput
    ) {
      expandedPostArea.classList.remove("ursac-expanded")
    }
  })

  // Prevent duplication by removing the button and creating a new one with a single event listener
  if (postButton) {
    // Remove any existing click listeners by cloning and replacing the button
    const newPostButton = postButton.cloneNode(true)
    postButton.parentNode.replaceChild(newPostButton, postButton)

    // Add a single click listener to the new button
    newPostButton.addEventListener("click", function () {
      if (!this.disabled) {
        createPostFunc()
      }
    })
  }

  if (filePhoto) {
    filePhoto.addEventListener("change", (e) => {
      handleFileSelect(e, "image")
    })
  }

  if (fileVideo) {
    fileVideo.addEventListener("change", (e) => {
      handleFileSelect(e, "video")
    })
  }

  if (fileAttachment) {
    fileAttachment.addEventListener("change", (e) => {
      handleFileSelect(e, "file")
    })
  }

  const tabs = document.querySelectorAll(".ursac-tab")
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      tabs.forEach((t) => {
        t.classList.remove("ursac-tab-active")
      })
      this.classList.add("ursac-tab-active")
    })
  })
}

function handleFileSelect(event, type) {
  const file = event.target.files[0]
  if (!file) return

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
        <img src="${e.target.result}" alt="Selected image">
        <div class="ursac-preview-remove" onclick="clearMediaPreview()">
          <i class="fas fa-times"></i>
        </div>
      `
      mediaPreview.appendChild(previewItem)
    }
    reader.readAsDataURL(file)
  } else if (type === "video") {
    const reader = new FileReader()
    reader.onload = (e) => {
      previewItem.innerHTML = `
        <video controls>
          <source src="${e.target.result}" type="${file.type}">
          Your browser does not support the video tag.
        </video>
        <div class="ursac-preview-remove" onclick="clearMediaPreview()">
          <i class="fas fa-times"></i>
        </div>
      `
      mediaPreview.appendChild(previewItem)
    }
    reader.readAsDataURL(file)
  } else if (type === "file") {
    previewItem.innerHTML = `
      <div class="ursac-preview-file">
        <i class="fas fa-file"></i>
        <span>${file.name}</span>
      </div>
      <div class="ursac-preview-remove" onclick="clearMediaPreview()">
        <i class="fas fa-times"></i>
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
  const fileVideo = document.getElementById("file-video")
  const fileAttachment = document.getElementById("file-attachment")

  if (filePhoto) filePhoto.value = ""
  if (fileVideo) fileVideo.value = ""
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

// First, let's complete the updatePostButton function that was cut off
function updatePostButton() {
  const postInput = document.getElementById("post-input")
  const postButton = document.getElementById("post-button")

  if (postInput && postButton) {
    // Enable post button if there's text content or media selected
    postButton.disabled = postInput.value.trim() === "" && !selectedMedia
  }
}

// This function should be updated to create post elements with thumbs up instead of heart
// Update the createPostElement function to handle profile images
function createPostElement(post, userData) {
  const postId = post.id
  const postTimestamp = new Date(post.timestamp)
  const timeAgo = formatTimeAgo(postTimestamp)
  const hasLiked = post.likes && post.likes[currentUser?.uid] === true
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

  // Add post actions (changed heart to thumbs up)
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
    </div>
    <div class="ursac-post-comments" style="display: none;">
      <div class="ursac-comment-input-wrapper">
        <div class="ursac-comment-avatar">
          <span>${getInitials(currentUser?.displayName || "", "")}</span>
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

// Function to toggle comments visibility
function toggleComments(element) {
  const postCard = element.closest(".ursac-post-card")
  if (!postCard) return

  const commentsSection = postCard.querySelector(".ursac-post-comments")
  if (commentsSection) {
    const isVisible = commentsSection.style.display === "block"
    commentsSection.style.display = isVisible ? "none" : "block"

    // Load comments if section is being displayed
    if (!isVisible) {
      const postId = postCard.getAttribute("data-post-id")
      if (postId) {
        loadComments(postId)
      }
    }
  }
}

// Updated function to load comments for a post, including replies
function loadComments(postId) {
  const postCard = document.querySelector(`[data-post-id="${postId}"]`)
  if (!postCard) return

  const commentsList = postCard.querySelector(".ursac-comments-list")
  if (!commentsList) return

  commentsList.innerHTML = '<div class="ursac-loading">Loading comments...</div>'

  firebase
    .database()
    .ref(`posts/${postId}/comments`)
    .once("value")
    .then((snapshot) => {
      const comments = snapshot.val()
      commentsList.innerHTML = ""

      if (comments) {
        // Convert to array and sort by timestamp
        const commentsArray = Object.entries(comments)
          .map(([id, comment]) => ({
            id,
            ...comment,
          }))
          .sort((a, b) => a.timestamp - b.timestamp)

        // Create a map of comments by ID for easy lookup
        const commentMap = {}
        commentsArray.forEach((comment) => {
          commentMap[comment.id] = comment
        })

        // Create a nested structure for comments and replies
        const nestedComments = []
        commentsArray.forEach((comment) => {
          if (comment.parentCommentId) {
            // This is a reply, add it to its parent's replies array
            const parent = commentMap[comment.parentCommentId]
            if (parent) {
              parent.replies = parent.replies || []
              parent.replies.push(comment)
            }
          } else {
            // This is a top-level comment
            nestedComments.push(comment)
          }
        })

        // Render the nested comments
        nestedComments.forEach((comment) => {
          const commentElement = createCommentElement(comment, postId)
          commentsList.appendChild(commentElement)
        })
      } else {
        commentsList.innerHTML = '<div class="ursac-no-comments">No comments yet. Be the first to comment!</div>'
      }
    })
    .catch((error) => {
      console.error("Error loading comments:", error)
      commentsList.innerHTML = '<div class="ursac-error">Failed to load comments.</div>'
    })
}

// Updated function to create a comment element with nested replies
function createCommentElement(comment, postId, depth = 0) {
  const wrapper = document.createElement("div")
  wrapper.className = "ursac-comment-thread"

  const commentElement = document.createElement("div")
  commentElement.className = "ursac-comment"
  commentElement.setAttribute("data-comment-id", comment.id)

  const commentUserInitials = getInitials(comment.userFirstName || "", comment.userLastName || "")
  const commentUserName = `${comment.userFirstName || ""} ${comment.userLastName || ""}`.trim()

  const commentHTML = `
    <div class="ursac-comment-avatar">
      <span>${commentUserInitials}</span>
    </div>
    <div class="ursac-comment-content">
      <div class="ursac-comment-author">${commentUserName}</div>
      <div class="ursac-comment-text">${comment.text}</div>
      <div class="ursac-comment-time">${formatTimeAgo(new Date(comment.timestamp))}</div>
      <div class="ursac-comment-actions">
        <button class="ursac-reply-button" onclick="showReplyInput('${postId}', '${comment.id}')">
          <i class="fas fa-reply"></i> Reply
        </button>
      </div>
    </div>
  `

  commentElement.innerHTML = commentHTML
  wrapper.appendChild(commentElement)

  // Add reply input container right after the comment
  const replyContainer = document.createElement("div")
  replyContainer.className = "ursac-reply-input-container"
  replyContainer.style.display = "none"
  replyContainer.setAttribute("data-for-comment", comment.id)
  replyContainer.innerHTML = `
    <div class="ursac-comment-input-wrapper">
      <div class="ursac-comment-avatar">
        <span>${getInitials(currentUser?.displayName || "", "")}</span>
      </div>
      <div class="ursac-comment-input-container">
        <input type="text" class="ursac-reply-input" placeholder="Write a reply...">
        <button class="ursac-reply-submit" onclick="submitReply('${postId}', '${comment.id}')">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  `

  wrapper.appendChild(replyContainer)

  // Handle replies if they exist
  if (comment.replies && comment.replies.length > 0) {
    const repliesContainer = document.createElement("div")
    repliesContainer.className = "ursac-reply-container"

    comment.replies.forEach((reply) => {
      const replyElement = createCommentElement(reply, postId, depth + 1)
      repliesContainer.appendChild(replyElement)
    })

    wrapper.appendChild(repliesContainer)
  }

  return wrapper
}

// Update the showReplyInput function to include event listeners for the input
function showReplyInputFunc(postId, commentId, asOwner = false) {
  // First hide all other reply inputs
  document.querySelectorAll(".ursac-reply-input-container").forEach((container) => {
    container.style.display = "none"
  })

  // Find the comment element
  const comment = document.querySelector(`.ursac-comment[data-comment-id="${commentId}"]`)
  if (!comment) return

  // Find the comment thread (parent container)
  const commentThread = comment.closest(".ursac-comment-thread")
  if (!commentThread) return

  // Find the reply container
  const replyContainer = commentThread.querySelector(`.ursac-reply-input-container[data-for-comment="${commentId}"]`)
  if (replyContainer) {
    // Show the reply container
    replyContainer.style.display = "block"

    // Focus the input field
    const replyInput = replyContainer.querySelector(".ursac-reply-input")
    if (replyInput) {
      replyInput.focus()

      // Add post owner prefix if needed
      if (asOwner) {
        replyInput.value = "[Post Owner] "
        replyInput.setSelectionRange(replyInput.value.length, replyInput.value.length)
      }

      // Add enter key event listener
      replyInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          const replyText = this.value.trim()
          if (replyText) {
            submitReply(postId, commentId)
          }
        }
      })

      // Enable/disable submit button based on input
      replyInput.addEventListener("input", function () {
        const submitBtn = replyContainer.querySelector(".ursac-reply-submit")
        if (submitBtn) {
          submitBtn.disabled = this.value.trim().length === 0
        }
      })
    }
  }
}

// Update the submitReply function to properly handle the submission
function submitReply(postId, parentCommentId) {
  if (!currentUser) {
    showModal("Authentication Required", "You must be logged in to reply.")
    return
  }

  const commentThread = document
    .querySelector(`.ursac-comment[data-comment-id="${parentCommentId}"]`)
    ?.closest(".ursac-comment-thread")
  if (!commentThread) return

  const replyContainer = commentThread.querySelector(
    `.ursac-reply-input-container[data-for-comment="${parentCommentId}"]`,
  )
  if (!replyContainer) return

  const replyInput = replyContainer.querySelector(".ursac-reply-input")
  if (!replyInput) return

  const replyText = replyInput.value.trim()
  if (!replyText) return

  // Check for profanity before posting reply
  const profanityResult = checkForProfanity(replyText)
  if (profanityResult.isProfane) {
    showProfanityWarning(profanityResult.matches)
    return
  }

  // Disable input and button while submitting
  replyInput.disabled = true
  const submitBtn = replyContainer.querySelector(".ursac-reply-submit")
  if (submitBtn) submitBtn.disabled = true

  // Submit the reply to Firebase
  replyToComment(postId, parentCommentId, replyText)
    .then(() => {
      // Clear and reset the input
      replyInput.value = ""
      replyInput.disabled = false
      if (submitBtn) submitBtn.disabled = true

      // Hide the reply container
      replyContainer.style.display = "none"

      // Reload comments to show the new reply
      loadComments(postId)
    })
    .catch((error) => {
      console.error("Error posting reply:", error)
      showModal("Reply Failed", "Failed to post reply. Please try again.")
      replyInput.disabled = false
      if (submitBtn) submitBtn.disabled = false
    })
}

// Function to show reply input
function showReplyInput(postId, commentId, asOwner = false) {
  // First hide all other reply inputs
  document.querySelectorAll(".ursac-reply-input-container").forEach((container) => {
    container.style.display = "none"
  })

  // Find the comment element
  const comment = document.querySelector(`.ursac-comment[data-comment-id="${commentId}"]`)
  if (!comment) return

  // Find the comment thread (parent container)
  const commentThread = comment.closest(".ursac-comment-thread")
  if (!commentThread) return

  // Find the reply container
  const replyContainer = commentThread.querySelector(`.ursac-reply-input-container[data-for-comment="${commentId}"]`)
  if (replyContainer) {
    // Show the reply container
    replyContainer.style.display = "block"

    // Focus the input field
    const replyInput = replyContainer.querySelector(".ursac-reply-input")
    if (replyInput) {
      replyInput.focus()

      // Add post owner prefix if needed
      if (asOwner) {
        replyInput.value = "[Post Owner] "
        replyInput.setSelectionRange(replyInput.value.length, replyInput.value.length)
      }
    }
  }
}

// Initialize comment input listeners
function initializeCommentListeners() {
  // Use event delegation for comment inputs
  document.addEventListener("input", (e) => {
    if (e.target.matches(".ursac-comment-input")) {
      const input = e.target
      const button = input.nextElementSibling
      if (button) {
        button.disabled = input.value.trim().length === 0
      }
    }

    if (e.target.matches(".ursac-reply-input")) {
      const input = e.target
      const button = input.nextElementSibling
      if (button) {
        button.disabled = input.value.trim().length === 0
      }
    }
  })

  // Use event delegation for comment inputs (for Enter key)
  document.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && e.target.matches(".ursac-comment-input")) {
      const input = e.target
      const button = input.nextElementSibling
      if (button && !button.disabled) {
        button.click()
      }
    }

    if (e.key === "Enter" && e.target.matches(".ursac-reply-input")) {
      const input = e.target
      const button = input.nextElementSibling
      if (button && !button.disabled) {
        button.click()
      }
    }
  })
}

// Function to create a post
function createPostFunc() {
  if (!currentUser) {
    showModal("Authentication Required", "You must be logged in to post.")
    return
  }

  const postInput = document.getElementById("post-input")
  if (!postInput) return

  const content = postInput.value.trim()
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

  const postButton = document.getElementById("post-button")
  if (postButton) postButton.disabled = true

  // Current timestamp to ensure proper ordering
  const timestamp = firebase.database.ServerValue.TIMESTAMP

  // If there is media, upload it first
  if (selectedMedia) {
    uploadMedia(selectedMedia.file, selectedMedia.type)
      .then((mediaData) => {
        const newPostRef = firebase.database().ref("posts").push()
        return newPostRef.set({
          userId: currentUser.uid,
          content: content,
          timestamp: timestamp,
          mediaURL: mediaData.url,
          mediaType: mediaData.type,
          mediaName: mediaData.name,
          mediaSize: mediaData.size,
        })
      })
      .then(() => {
        console.log("Post with media created successfully.")
        postInput.value = ""
        clearMediaPreview()
        if (postButton) postButton.disabled = true

        // Collapse expanded post area
        const expandedPostArea = document.getElementById("expanded-post-area")
        if (expandedPostArea) {
          expandedPostArea.classList.remove("ursac-expanded")
        }
      })
      .catch((error) => {
        console.error("Error creating post with media:", error)
        showModal("Post Creation Failed", "Failed to create post: " + error.message)
        if (postButton) postButton.disabled = false
      })
  } else {
    // No media, just create the post
    const newPostRef = firebase.database().ref("posts").push()
    newPostRef
      .set({
        userId: currentUser.uid,
        content: content,
        timestamp: timestamp,
      })
      .then(() => {
        console.log("Post created successfully.")
        postInput.value = ""
        if (postButton) postButton.disabled = true

        // Collapse expanded post area
        const expandedPostArea = document.getElementById("expanded-post-area")
        if (expandedPostArea) {
          expandedPostArea.classList.remove("ursac-expanded")
        }
      })
      .catch((error) => {
        console.error("Error creating post:", error)
        showModal("Post Creation Failed", "Failed to create post: " + error.message)
        if (postButton) postButton.disabled = false
      })
  }
}

// Updated uploadMedia function to use ImgBB API for images
function uploadMedia(file, type) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"))
      return
    }

    // Show upload modal and progress
    const uploadModal = document.getElementById("upload-modal")
    const uploadProgress = document.getElementById("upload-progress")
    const uploadStatus = document.getElementById("upload-status")

    if (uploadModal) uploadModal.style.display = "flex"
    if (uploadStatus) uploadStatus.textContent = "0%"
    if (uploadProgress) uploadProgress.style.width = "0%"

    // For non-image files, we'll still use Firebase Storage
    if (type !== "image") {
      // Create storage reference
      const storageRef = firebase.storage().ref()
      const fileExtension = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`

      // Choose appropriate folder based on file type
      let fileRef
      if (type === "video") {
        fileRef = storageRef.child(`videos/${fileName}`)
      } else {
        fileRef = storageRef.child(`files/${fileName}`)
      }

      // Upload the file
      const uploadTask = fileRef.put(file)

      // Monitor upload progress
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
          // Upload completed successfully
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            if (uploadStatus) uploadStatus.textContent = "Upload complete!"

            // Hide modal after a short delay
            setTimeout(() => {
              if (uploadModal) uploadModal.style.display = "none"
            }, 1000)

            // Resolve with media data
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
    // First, convert the file to base64
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const base64data = reader.result.split(",")[1]

      // Get ImgBB API key from environment
      const apiKey = "fa517d5bab87e31f661cb28d7de365ba" // Using the ImgBB API key from .env

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

          // Store image metadata (without using Firestore FieldValue)
          const timestamp = Date.now()

          // Add to Firestore images collection if Firestore is available
          if (firebase.firestore) {
            const imageData = {
              url: data.data.url,
              display_url: data.data.display_url,
              delete_url: data.data.delete_url,
              timestamp: timestamp,
            }

            firebase
              .firestore()
              .collection("images")
              .add(imageData)
              .then((docRef) => {
                console.log("Image URL saved to Firestore with ID:", docRef.id)
              })
              .catch((error) => {
                console.error("Error saving image URL to Firestore:", error)
              })
          } else {
            console.log("Firestore not available, skipping image metadata storage")
          }

          // Resolve with media data
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

// Call setupEventListeners when the page loads
document.addEventListener("DOMContentLoaded", setupEventListeners)

// Make sure these functions are available globally
window.likePost = likePost
window.toggleComments = toggleComments
window.sharePost = sharePost
window.clearMediaPreview = clearMediaPreview
window.handleCommentInput = handleCommentInput
window.showReplyInput = showReplyInputFunc
window.submitReply = submitReply
window.submitComment = (postId) => {
  const postCard = document.querySelector(`[data-post-id="${postId}"]`)
  if (!postCard) return

  const input = postCard.querySelector(".ursac-comment-input")
  if (!input) return

  const commentText = input.value.trim()
  if (!commentText) return

  // Check for profanity before posting comment
  const profanityResult = checkForProfanity(commentText)
  if (profanityResult.isProfane) {
    showProfanityWarning(profanityResult.matches)
    return
  }

  // Disable input while submitting
  input.disabled = true
  const submitBtn = input.nextElementSibling
  if (submitBtn) submitBtn.disabled = true

  commentPost(postId, commentText)
    .then(() => {
      input.value = ""
      input.disabled = false
      if (submitBtn) submitBtn.disabled = true
      loadComments(postId)
    })
    .catch((error) => {
      console.error("Error posting comment:", error)
      input.disabled = false
      if (submitBtn) submitBtn.disabled = true
    })
}

// Initialize notifications when the page loads
document.addEventListener("DOMContentLoaded", () => {
  // Initial load of notifications
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      currentUser = user
      loadNotifications()
    }
  })
})

// Add CSS for comments and replies
function addCommentStyles() {
  const style = document.createElement("style")
  style.textContent = `
    .ursac-comments-list {
      margin-top: 15px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .ursac-comment-thread {
      margin-bottom: 10px;
    }

    .ursac-comment {
      display: flex;
      padding: 10px;
      gap: 10px;
      background: #f8f9fa;
      border-radius: 8px;
      width: 100%;
      box-sizing: border-box;
    }

    .ursac-comment-content {
      flex: 1;
      min-width: 0;
    }

    .ursac-comment-actions {
      margin-top: 8px;
    }

    .ursac-reply-button {
      background: none;
      border: none;
      color: #4a76a8;
      cursor: pointer;
      padding: 4px 8px;
      font-size: 12px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .ursac-reply-button:hover {
      background-color: #ebedf0;
    }

    .ursac-reply-input-container {
      margin-top: 8px;
      margin-left: 40px;
      margin-bottom: 8px;
    }

    .ursac-reply-container {
      margin-left: 40px;
      position: relative;
    }

    .ursac-reply-container::before {
      content: '';
      position: absolute;
      left: -20px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e1e4e8;
    }

    .ursac-comment-input-wrapper {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      background: white;
      padding: 8px;
      border-radius: 8px;
      border: 1px solid #e1e4e8;
    }

    .ursac-comment-avatar {
      width: 32px;
      height: 32px;
      background: #4a76a8;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      flex-shrink: 0;
    }

    .ursac-comment-input-container {
      flex: 1;
      position: relative;
    }

    .ursac-reply-input {
      width: 100%;
      padding: 8px 40px 8px 12px;
      border: 1px solid #ddd;
      border-radius: 20px;
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
    }

    .ursac-reply-submit {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #4a76a8;
      cursor: pointer;
    }

    .ursac-reply-submit:disabled {
      color: #ccc;
      cursor: not-allowed;
    }
  `
  document.head.appendChild(style)
}

// Call enhanceCommentInputs when the page loads
document.addEventListener("DOMContentLoaded", () => {
  // Add comment styles
  addCommentStyles()

  // Initialize comment listeners
  initializeCommentListeners()

  // Enhance comment inputs after a short delay to ensure DOM is ready
  setTimeout(enhanceCommentInputs, 1000)
})

// Generic modal function to replace alerts
function showModal(title, message) {
  // Create modal if it doesn't exist
  let modalElement = document.getElementById("generic-modal")

  if (!modalElement) {
    const modalHTML = `
      <div class="ursac-modal" id="generic-modal">
        <div class="ursac-modal-content">
          <div class="ursac-modal-header">
            <h3 id="modal-title"></h3>
            <button class="ursac-modal-close" id="close-generic-modal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="ursac-modal-body">
            <p id="modal-message"></p>
          </div>
          <div class="ursac-modal-footer">
            <button class="ursac-button ursac-button-primary" id="acknowledge-modal">OK</button>
          </div>
        </div>
      </div>
    `

    const modalContainer = document.createElement("div")
    modalContainer.innerHTML = modalHTML
    document.body.appendChild(modalContainer.firstElementChild)

    modalElement = document.getElementById("generic-modal")

    // Add event listeners
    document.getElementById("close-generic-modal").addEventListener("click", () => {
      modalElement.style.display = "none"
    })

    document.getElementById("acknowledge-modal").addEventListener("click", () => {
      modalElement.style.display = "none"
    })
  }

  // Update modal content
  document.getElementById("modal-title").textContent = title
  document.getElementById("modal-message").textContent = message

  // Show modal
  modalElement.style.display = "flex"
}

// Make showModal available globally
window.showModal = showModal

// Add CSS for the modal
document.addEventListener("DOMContentLoaded", () => {
  const style = document.createElement("style")
  style.textContent = `
   .custom-modal {
  display: none; /* Hidden by default */
  position: fixed;
  z-index: 9999;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent background */
}

/* Modal box */
.custom-modal-box {
  background-color: #fff;
  margin: 10% auto;
  padding: 20px 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.3s ease-in-out;
}

/* Close button */
.custom-close {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 28px;
  font-weight: bold;
  color: #888;
  cursor: pointer;
}

.custom-close:hover {
  color: #000;
}

/* Button */
.custom-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  padding: 10px 16px;
  font-size: 16px;
  border-radius: 5px;
  cursor: pointer;
  transition: 0.2s ease-in-out;
  gap: 8px;
}

.custom-button-primary {
  color: #0056b3;
  align:items: center;
  border: none;
}



.custom-button-primary:hover {
  background-color: #0056b3;
  color: #fff;
}

.custom-button-secondary {
  color: #0056b3;
}

.custom-button-secondary:hover {
  background-color: #0056b3;
  color: #fff;
}



/* Optional fade-in animation */
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
  `
  document.head.appendChild(style)
})

// Function to enhance comment inputs with additional features
function enhanceCommentInputs() {
  // Find all comment inputs
  document.querySelectorAll(".ursac-comment-input").forEach((input) => {
    const postCard = input.closest(".ursac-post-card")
    if (postCard) {
      const postId = postCard.getAttribute("data-post-id")
      if (postId) {
        // Add emoji picker
        addEmojiPickerToInput(input)

        // Add media button
        addMediaButtonToInput(input, postId)
      }
    }
  })
}

// Function to add emoji picker to comment input
function addEmojiPickerToInput(inputElement) {
  // Create emoji button
  const emojiButton = document.createElement("button")
  emojiButton.type = "button"
  emojiButton.className = "ursac-emoji-button"
  emojiButton.innerHTML = '<i class="far fa-smile"></i>'
  emojiButton.style.position = "absolute"
  emojiButton.style.right = "40px"
  emojiButton.style.top = "50%"
  emojiButton.style.transform = "translateY(-50%)"
  emojiButton.style.background = "none"
  emojiButton.style.border = "none"
  emojiButton.style.color = "#777"
  emojiButton.style.cursor = "pointer"

  // Add emoji button next to input
  const inputContainer = inputElement.parentNode
  inputContainer.insertBefore(emojiButton, inputElement.nextSibling)

  // Common emojis
  const commonEmojis = ["😊", "👍", "❤️", "😂", "🎉", "👏", "🙏", "🔥", "😍", "😎"]

  // Create emoji picker
  const emojiPicker = document.createElement("div")
  emojiPicker.className = "ursac-emoji-picker"
  emojiPicker.style.display = "none"
  emojiPicker.style.position = "absolute"
  emojiPicker.style.top = "-80px"
  emojiPicker.style.right = "0"
  emojiPicker.style.background = "white"
  emojiPicker.style.border = "1px solid #ddd"
  emojiPicker.style.borderRadius = "5px"
  emojiPicker.style.padding = "5px"
  emojiPicker.style.zIndex = "100"
  emojiPicker.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)"

  // Add emojis to picker
  commonEmojis.forEach((emoji) => {
    const emojiSpan = document.createElement("span")
    emojiSpan.textContent = emoji
    emojiSpan.style.cursor = "pointer"
    emojiSpan.style.padding = "5px"
    emojiSpan.style.fontSize = "16px"

    emojiSpan.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()

      // Insert emoji at cursor position
      const cursorPos = inputElement.selectionStart
      const textBefore = inputElement.value.substring(0, cursorPos)
      const textAfter = inputElement.value.substring(cursorPos)

      inputElement.value = textBefore + emoji + textAfter

      // Update cursor position
      const newCursorPos = cursorPos + emoji.length
      inputElement.setSelectionRange(newCursorPos, newCursorPos)

      // Focus back on input
      inputElement.focus()

      // Hide emoji picker
      emojiPicker.style.display = "none"

      // Trigger input event to update submit button state
      const event = new Event("input", { bubbles: true })
      inputElement.dispatchEvent(event)
    })

    emojiPicker.appendChild(emojiSpan)
  })

  // Add emoji picker to input container
  inputContainer.appendChild(emojiPicker)

  // Toggle emoji picker on button click
  emojiButton.addEventListener("click", (e) => {
    e.preventDefault()
    e.stopPropagation()

    const isVisible = emojiPicker.style.display === "block"
    emojiPicker.style.display = isVisible ? "none" : "block"
  })

  // Hide emoji picker when clicking outside
  document.addEventListener("click", (e) => {
    if (!emojiPicker.contains(e.target) && e.target !== emojiButton) {
      emojiPicker.style.display = "none"
    }
  })
}

// Function to add media button to comment input
function addMediaButtonToInput(inputElement, postId) {
  // Create media button
  const mediaButton = document.createElement("button")
  mediaButton.type = "button"
  mediaButton.className = "ursac-media-button"
  mediaButton.innerHTML = '<i class="far fa-image"></i>'
  mediaButton.style.position = "absolute"
  mediaButton.style.right = "70px"
  mediaButton.style.top = "50%"
  mediaButton.style.transform = "translateY(-50%)"
  mediaButton.style.background = "none"
  mediaButton.style.border = "none"
  mediaButton.style.color = "#777"
  mediaButton.style.cursor = "pointer"

  // Add media button next to input
  const inputContainer = inputElement.parentNode
  inputContainer.insertBefore(mediaButton, inputElement.nextSibling)

  // Handle media button click
  mediaButton.addEventListener("click", (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Open file input for image selection
    handleCommentMediaUploadToInput(postId, inputElement)
  })
}

// Function to handle comment media uploads
function handleCommentMediaUploadToInput(postId, commentInput) {
  const fileInput = document.createElement("input")
  fileInput.type = "file"
  fileInput.accept = "image/*"
  fileInput.style.display = "none"
  document.body.appendChild(fileInput)

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0]
    if (!file) {
      document.body.removeChild(fileInput)
      return
    }

    // Create a preview of the selected image
    const previewContainer = document.createElement("div")
    previewContainer.className = "ursac-comment-media-preview"
    previewContainer.style.marginTop = "10px"

    const reader = new FileReader()
    reader.onload = (e) => {
      previewContainer.innerHTML = `
        <img src="${e.target.result}" style="max-width: 100px; max-height: 100px; border-radius: 4px;">
        <button class="ursac-remove-media" style="background: none; border: none; color: #e74c3c; cursor: pointer; margin-left: 5px;">
          <i class="fas fa-times"></i>
        </button>
      `

      // Add the preview after the comment input
      const inputContainer = commentInput.closest(".ursac-comment-input-container")
      inputContainer.parentNode.insertBefore(previewContainer, inputContainer.nextSibling)

      // Add event listener to remove button
      previewContainer.querySelector(".ursac-remove-media").addEventListener("click", () => {
        previewContainer.remove()
        commentInput.dataset.mediaFile = ""
      })
    }
    reader.readAsDataURL(file)

    // Store the file in the input's dataset for later use
    commentInput.dataset.mediaFile = JSON.stringify({
      file: file,
      type: "image",
      name: file.name,
      size: file.size,
    })

    document.body.removeChild(fileInput)
  })

  fileInput.click()
}

// Function to submit a comment with media
function submitCommentWithMedia(postId) {
  const postCard = document.querySelector(`[data-post-id="${postId}"]`)
  if (!postCard) return

  const input = postCard.querySelector(".ursac-comment-input")
  if (!input) return

  const commentText = input.value.trim()
  if (!commentText) return

  // Check for profanity before posting comment
  const profanityResult = checkForProfanity(commentText)
  if (profanityResult.isProfane) {
    showProfanityWarning(profanityResult.matches)
    return
  }

  // Disable input while submitting
  input.disabled = true
  const submitBtn = input.nextElementSibling
  if (submitBtn) submitBtn.disabled = true

  // Check if there's media attached
  let mediaFile = null
  if (input.dataset.mediaFile) {
    try {
      mediaFile = JSON.parse(input.dataset.mediaFile)
    } catch (e) {
      console.error("Error parsing media file data:", e)
    }
  }

  commentPost(postId, commentText, mediaFile)
    .then(() => {
      input.value = ""
      input.disabled = false
      input.dataset.mediaFile = ""
      if (submitBtn) submitBtn.disabled = true

      // Remove any media preview
      const mediaPreview = postCard.querySelector(".ursac-comment-media-preview")
      if (mediaPreview) mediaPreview.remove()

      // Reload comments to show the new comment
      loadComments(postId)
    })
    .catch((error) => {
      console.error("Error posting comment:", error)
      input.disabled = false
      if (submitBtn) submitBtn.disabled = true
    })
}

// Declare deletePost and deleteComment functions
function deletePost(postId) {
  // Implementation for deleting a post
  console.log(`Deleting post with ID: ${postId}`)
}

function deleteComment(commentId) {
  // Implementation for deleting a comment
  console.log(`Deleting comment with ID: ${commentId}`)
}

// Make additional functions available globally
window.deletePost = deletePost
window.deleteComment = deleteComment
window.handleCommentMediaUpload = handleCommentMediaUploadToInput
window.submitCommentWithMedia = submitCommentWithMedia

// Add a debugging function to check post timestamps
function debugPostTimestamps() {
  const postsRef = firebase.database().ref("posts")
  postsRef.once("value", (snapshot) => {
    const postsData = snapshot.val()
    if (postsData) {
      const postsArray = Object.entries(postsData)
        .map(([id, post]) => ({
          id,
          timestamp: post.timestamp,
          content: post.content?.substring(0, 20) + "..." || "[No content]",
        }))
        .sort((a, b) => b.timestamp - a.timestamp)

      console.table(postsArray)
      console.log("Posts are sorted by timestamp (newest first)")
    } else {
      console.log("No posts found")
    }
  })
}

// Make the debug function available globally
window.debugPostTimestamps = debugPostTimestamps

// Call the debug function when the page loads
document.addEventListener("DOMContentLoaded", () => {
  // Wait for posts to load, then debug
  setTimeout(debugPostTimestamps, 2000)
})

// Add a visual indicator for new posts
function addNewPostIndicator() {
  const style = document.createElement("style")
  style.textContent = `
    @keyframes newPostHighlight {
      0% { background-color: rgba(0, 120, 255, 0.2); }
      100% { background-color: transparent; }
    }

    .new-post-highlight {
      animation: newPostHighlight 3s ease-out;
    }
  `
  document.head.appendChild(style)
}

// Call this function when the page loads
document.addEventListener("DOMContentLoaded", addNewPostIndicator)

// Update the createPostElement function to add the highlight class to new posts
function highlightNewPosts() {
  // Get the current timestamp
  const now = Date.now()

  // Find all posts
  const posts = document.querySelectorAll(".ursac-post-card")

  posts.forEach((post) => {
    // Get the post timestamp from a data attribute
    const timestamp = Number.parseInt(post.getAttribute("data-timestamp"))

    // If the post is less than 5 seconds old, highlight it
    if (timestamp && now - timestamp < 5000) {
      post.classList.add("new-post-highlight")
    }
  })
}

function highlightButton(button) {
    // Remove highlight from all buttons
    const buttons = document.querySelectorAll('[data-approval]');
    buttons.forEach(btn => btn.classList.remove('highlighted'));
    button.classList.add('highlighted');
    console.log("JS file is connected!");
    console.log("Button clicked:", button);
}

// Call this function after posts are loaded
document.addEventListener("DOMContentLoaded", () => {
  // Wait for posts to load, then highlight new ones
<<<<<<< HEAD
  setTimeout(highlightNewPosts, 2000);
});


document.addEventListener('DOMContentLoaded', function () {
  const forumListContainer = document.querySelector('.ursac-forum-list');

  // Inject CSS styles directly
  const style = document.createElement('style');
  document.head.appendChild(style);

  // Function to display forums the user has joined
  function displayUserForums(user) {
    const forumsRef = firebase.database().ref('forums');
     const forumListRoute = "{{ route('view', ['forum' => '']) }}";

    forumsRef.once('value')
      .then(snapshot => {
        const joinedForums = [];

        snapshot.forEach(forumSnap => {
          const forumData = forumSnap.val();
          if (forumSnap.child('members').hasChild(user.uid)) {
            joinedForums.push({
              id: forumSnap.key,
              name: forumData.name || 'Unnamed Forum'
            });
          }
        });

        if (forumListContainer) {
          forumListContainer.innerHTML = joinedForums.length > 0
            ? joinedForums.map(forum => `
                <div class="ursac-forum-item" onclick="redirectToForum('${forum.id}')">
                  <h3>${forum.name}</h3>
                </div>
              `).join('')
            : '<p>You have not joined any forums yet.</p>';
        }
      })
      .catch(error => {
        console.error('Error fetching forums:', error);
        if (forumListContainer) {
          forumListContainer.innerHTML = '<p>Failed to load forums. Please try again later.</p>';
        }
      });
  }

  // Check auth state and then display joined forums
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      displayUserForums(user);
    } else if (forumListContainer) {
      forumListContainer.innerHTML = '<p>Please log in to view your forums.</p>';
    }
  });
});
  // Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Get references to the necessary elements
    const openBtn = document.getElementById('add-forum-btn');
    const modal = document.getElementById('addForumModal');
    const closeBtn = document.getElementById('closeModalBtn');

    // Open modal when add-forum button is clicked
    if (openBtn) {
      openBtn.addEventListener('click', function () {
        console.log("Add Forum button clicked");
        if (modal) {
          modal.style.display = 'block';
        }
      });
    }

    // Close modal when X is clicked
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        if (modal) {
          modal.style.display = 'none';
        }
      });
    }

    // Close modal when clicking outside the modal content
    window.addEventListener('click', function (event) {
      if (event.target === modal) {
        if (modal) {
          modal.style.display = 'none';
        }
      }
    });

    // Inject CSS for the modal
    const styles = `
      /* Modal backdrop */
      .ursac-modal {
        display: none; /* Hidden by default */
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto; /* Enable scroll if needed */
        background-color: rgba(0, 0, 0, 0.6); /* Dark semi-transparent background */
      }

      /* Modal content box */
      .ursac-modal-content {
        background-color: #fff;
        margin: auto;
        top: 20%;
        position: relative;
        transform: translateY(20%);
        padding: 25px 30px;
        border-radius: 12px;
        width: 95%;
        max-width: 400px;
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
        animation: fadeIn 0.3s ease-out;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      
      /* Close button (X) */
      .ursac-close {
        position: absolute;
        top: 12px;
        right: 16px;
        font-size: 24px;
        font-weight: bold;
        color: #888;
        cursor: pointer;
      }

      .ursac-close:hover {
        color: #000;
      }

      /* Simple fade-in animation */
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;

    // Create a style element and append to the head
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
  });

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ✅ Auth check before calling your function
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is logged in:", user.uid);
    loadJoinableForums(user);
  } else {
    console.log("No user is signed in.");
  }
});


function loadJoinableForums(user) {
  const userId = user.uid;
  const forumsRef = ref(db, 'forums');

  onValue(forumsRef, (snapshot) => {
    const forums = snapshot.val();
    const joinableForums = [];

    for (const forumId in forums) {
      const forum = forums[forumId];
      const members = forum.members || {};

      // If user is NOT a member of this forum, show it in Join tab
      if (!members.hasOwnProperty(userId)) {
        joinableForums.push({
          id: forumId,
          ...forum
        });
      }
    }

    displayJoinableForums(joinableForums);
  });
}

// Sample function to render joinable forums
function displayJoinableForums(forums) {
  const forumList = document.getElementById('joinable-forums');
  forumList.innerHTML = '';

  forums.forEach(forum => {
    const item = document.createElement('div');
    item.textContent = `${forum.description}`;
    forumList.appendChild(item);
  });
}

// Call this on page load
loadJoinableForums();


// // Initialize Firebase (if not already done)
// firebase.initializeApp(firebaseConfig);

// Function to redirect based on Firebase data
function redirectToForum(forumId) {
  // Firebase check (optional)
  const forumUrl = `/view/${forumId}`; // Direct URL
  window.location.href = forumUrl;
}


// Example usag // Pass the forum ID dynamically
=======
  setTimeout(highlightNewPosts, 2000);
});


document.addEventListener('DOMContentLoaded', function () {
  const forumListContainer = document.querySelector('.ursac-forum-list');

  // Inject CSS styles directly
  const style = document.createElement('style');
  document.head.appendChild(style);

  // Function to display forums the user has joined
  function displayUserForums(user) {
    const forumsRef = firebase.database().ref('forums');
     const forumListRoute = "{{ route('view', ['forum' => '']) }}";

    forumsRef.once('value')
      .then(snapshot => {
        const joinedForums = [];

        snapshot.forEach(forumSnap => {
          const forumData = forumSnap.val();
          if (forumSnap.child('members').hasChild(user.uid)) {
            joinedForums.push({
              id: forumSnap.key,
              name: forumData.name || 'Unnamed Forum'
            });
          }
        });

        if (forumListContainer) {
          forumListContainer.innerHTML = joinedForums.length > 0
            ? joinedForums.map(forum => `
                <div class="ursac-forum-item" onclick="redirectToForum('${forum.id}')">
                  <h3>${forum.name}</h3>
                </div>
              `).join('')
            : '<p>You have not joined any forums yet.</p>';
        }
      })
      .catch(error => {
        console.error('Error fetching forums:', error);
        if (forumListContainer) {
          forumListContainer.innerHTML = '<p>Failed to load forums. Please try again later.</p>';
        }
      });
  }

  // Check auth state and then display joined forums
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      displayUserForums(user);
    } else if (forumListContainer) {
      forumListContainer.innerHTML = '<p>Please log in to view your forums.</p>';
    }
  });
});
  // Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Get references to the necessary elements
    const openBtn = document.getElementById('add-forum-btn');
    const modal = document.getElementById('addForumModal');
    const closeBtn = document.getElementById('closeModalBtn');

    // Open modal when add-forum button is clicked
    if (openBtn) {
      openBtn.addEventListener('click', function () {
        console.log("Add Forum button clicked");
        if (modal) {
          modal.style.display = 'block';
        }
      });
    }

    // Close modal when X is clicked
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        if (modal) {
          modal.style.display = 'none';
        }
      });
    }

    // Close modal when clicking outside the modal content
    window.addEventListener('click', function (event) {
      if (event.target === modal) {
        if (modal) {
          modal.style.display = 'none';
        }
      }
    });

    // Inject CSS for the modal
    const styles = `
      /* Modal backdrop */
      .ursac-modal {
        display: none; /* Hidden by default */
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto; /* Enable scroll if needed */
        background-color: rgba(0, 0, 0, 0.6); /* Dark semi-transparent background */
      }

      /* Modal content box */
      .ursac-modal-content {
        background-color: #fff;
        margin: auto;
        top: 20%;
        position: relative;
        transform: translateY(20%);
        padding: 25px 30px;
        border-radius: 12px;
        width: 95%;
        max-width: 400px;
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
        animation: fadeIn 0.3s ease-out;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      
      /* Close button (X) */
      .ursac-close {
        position: absolute;
        top: 12px;
        right: 16px;
        font-size: 24px;
        font-weight: bold;
        color: #888;
        cursor: pointer;
      }

      .ursac-close:hover {
        color: #000;
      }

      /* Simple fade-in animation */
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;

    // Create a style element and append to the head
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
  });

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ✅ Auth check before calling your function
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is logged in:", user.uid);
    loadJoinableForums(user);
  } else {
    console.log("No user is signed in.");
  }
});


function loadJoinableForums(user) {
  const userId = user.uid;
  const forumsRef = ref(db, 'forums');

  onValue(forumsRef, (snapshot) => {
    const forums = snapshot.val();
    const joinableForums = [];

    for (const forumId in forums) {
      const forum = forums[forumId];
      const members = forum.members || {};

      // If user is NOT a member of this forum, show it in Join tab
      if (!members.hasOwnProperty(userId)) {
        joinableForums.push({
          id: forumId,
          ...forum
        });
      }
    }

    displayJoinableForums(joinableForums);
  });
}

// Sample function to render joinable forums
function displayJoinableForums(forums) {
  const forumList = document.getElementById('joinable-forums');
  forumList.innerHTML = '';

  forums.forEach(forum => {
    const item = document.createElement('div');
    item.textContent = `${forum.description}`;
    forumList.appendChild(item);
  });
}

// Call this on page load
loadJoinableForums();


// // Initialize Firebase (if not already done)
// firebase.initializeApp(firebaseConfig);

// Function to redirect based on Firebase data
function redirectToForum(forumId) {
  // Firebase check (optional)
  const forumUrl = `/view/${forumId}`; // Direct URL
  window.location.href = forumUrl;
}


// Example usag // Pass the forum ID dynamically
>>>>>>> 466e93e0987f5db1fba918d3f155c0d7d54ea531
