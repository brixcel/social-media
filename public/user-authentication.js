/**
 * Updated User Authentication and Profile Management
 * Integrates with ProfileManager for consistent profile data
 */

// Global variables for user management
let userProfileBtn = null
let profileDropdown = null
let logoutBtn = null
let addAccountBtn = null

/**
 * Get current authenticated user
 * @returns {Object|null} - Current user object or null
 */
function getCurrentUser() {
  return window.currentUser || null
}

/**
 * Load and display user profile information using ProfileManager
 * @param {Object} user - Firebase user object
 */
function loadUserProfile(user) {
  if (!user) return

  // Initialize ProfileManager if not already done
  if (window.profileManager && !window.profileManager.getCurrentUserProfile()) {
    window.profileManager.initialize(user)
  }

  // Use ProfileManager if available
  if (window.profileManager) {
    const profile = window.profileManager.getCurrentUserProfile()
    if (profile) {
      updateProfileDisplay(profile, user.email)
      return
    }
  }

  // Fallback to direct Firebase fetch
  window.firebaseDatabase
    .ref("users/" + user.uid)
    .once("value")
    .then((snapshot) => {
      const userData = snapshot.val()
      updateProfileDisplay(userData, user.email)
    })
    .catch((error) => {
      console.error("Error loading user profile:", error)
    })
}

/**
 * Update profile display with user data
 * @param {Object} userData - User data object
 * @param {string} email - User email
 */
function updateProfileDisplay(userData, email) {
  if (userData && userProfileBtn) {
    // Use ProfileManager for consistent formatting
    const initials = window.profileManager
      ? window.profileManager.getInitials(userData.firstName, userData.lastName)
      : window.getInitials(userData.firstName, userData.lastName)

    const fullName = window.profileManager
      ? window.profileManager.getFormattedName(userData.firstName, userData.lastName)
      : `${userData.firstName || ""} ${userData.lastName || ""}`.trim()

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

    userProfileBtn.style.cursor = "pointer"

    // Update create post UI elements
    updateCreatePostUI(userData, initials, fullName)

    // Update all comment input avatars
    updateAllCommentInputAvatars(userData, initials)
  }
}

/**
 * Update create post UI with user information
 * @param {Object} userData - User data from Firebase
 * @param {string} initials - User initials
 * @param {string} fullName - User full name
 */
function updateCreatePostUI(userData, initials, fullName) {
  const createPostAvatar = document.getElementById("create-post-avatar")
  const createPostUsername = document.getElementById("create-post-username")

  if (createPostAvatar) {
    if (userData.profileImageUrl) {
      createPostAvatar.innerHTML = `<img src="${userData.profileImageUrl}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
    } else {
      createPostAvatar.innerHTML = `<span style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #4a76a8; color: white; border-radius: 50%; font-weight: bold; font-size: 14px;">${initials}</span>`
    }
  }

  if (createPostUsername) {
    createPostUsername.textContent = fullName || "User"
  }
}

/**
 * Initialize profile-related UI elements and event listeners
 */
function initializeProfileElements() {
  userProfileBtn = document.getElementById("user-profile-btn")
  profileDropdown = document.getElementById("user-profile-dropdown")
  logoutBtn = document.getElementById("logout-btn")
  addAccountBtn = document.getElementById("add-account-btn")

  // Profile dropdown toggle
  if (userProfileBtn) {
    userProfileBtn.onclick = function (e) {
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
    }
  }

  // Close dropdown when clicking outside
  document.onclick = (e) => {
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
  }

  // Logout functionality
  if (logoutBtn) {
    logoutBtn.innerHTML = `
      <i class="fas fa-sign-out-alt"></i>
      <span>Log out</span>
    `
    logoutBtn.onclick = () => {
      window.firebaseAuth
        .signOut()
        .then(() => {
          window.location.href = "/login"
        })
        .catch((error) => {
          console.error("Logout Error:", error)
        })
    }
  }

  // Add account functionality
  if (addAccountBtn) {
    addAccountBtn.innerHTML = `
      <i class="fas fa-user-plus"></i>
      <span>Add an existing account</span>
    `
    addAccountBtn.onclick = () => {
      window.firebaseAuth.signOut().then(() => {
        sessionStorage.setItem("addingAccount", "true")
        window.location.href = "/login"
      })
    }
  }
}

/**
 * Setup profile update listener for real-time updates with ProfileManager integration
 */
function setupProfileUpdateListener() {
  // Listen for ProfileManager updates
  if (window.profileManager) {
    window.profileManager.addProfileUpdateListener((profile) => {
      console.log("Profile updated via ProfileManager:", profile)
      const currentUser = getCurrentUser()
      if (profile.uid === currentUser?.uid) {
        updateProfileDisplay(profile, currentUser.email)
      }
    })
  }

  // Listen for custom profile update events
  document.addEventListener("profileUpdated", (event) => {
    const userId = event.detail.userId
    const currentUser = getCurrentUser()
    if (userId === currentUser?.uid) {
      loadUserProfile(currentUser)
    }
  })

  // Listen for Firebase profile updates
  if (!window.firebaseDatabase) {
    console.warn("Firebase database not available for profile updates")
    return
  }

  window.firebaseDatabase.ref("profileUpdates").on(
    "child_changed",
    (snapshot) => {
      const userId = snapshot.key
      const currentUser = getCurrentUser()
      if (userId !== currentUser?.uid) {
        const userElements = document.querySelectorAll(`[data-user-id="${userId}"]`)
        if (userElements.length > 0) {
          window.firebaseDatabase
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

/**
 * Update post element with new user data
 * @param {Element} postElement - Post DOM element
 * @param {Object} userData - Updated user data
 */
function updatePostWithUserData(postElement, userData) {
  const authorElement = postElement.querySelector(".ursac-post-author")
  if (authorElement) {
    const formattedName = window.profileManager
      ? window.profileManager.getFormattedName(userData.firstName, userData.lastName)
      : `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
    authorElement.textContent = formattedName
  }

  const avatarElement = postElement.querySelector(".ursac-profile-avatar")
  if (avatarElement) {
    if (userData.profileImageUrl) {
      avatarElement.innerHTML = `<img src="${userData.profileImageUrl}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
    } else {
      const initials = window.profileManager
        ? window.profileManager.getInitials(userData.firstName, userData.lastName)
        : window.getInitials(userData.firstName, userData.lastName)
      avatarElement.innerHTML = `<span>${initials}</span>`
    }
  }
}

/**
 * Update comment element with new user data
 * @param {Element} commentElement - Comment DOM element
 * @param {Object} userData - Updated user data
 */
function updateCommentWithUserData(commentElement, userData) {
  const authorElement = commentElement.querySelector(".ursac-comment-author")
  if (authorElement) {
    const formattedName = window.profileManager
      ? window.profileManager.getFormattedName(userData.firstName, userData.lastName)
      : `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
    authorElement.textContent = formattedName
  }

  const avatarElement = commentElement.querySelector(".ursac-comment-avatar span")
  if (avatarElement) {
    const initials = window.profileManager
      ? window.profileManager.getInitials(userData.firstName, userData.lastName)
      : window.getInitials(userData.firstName, userData.lastName)
    avatarElement.textContent = initials
  }
}

/**
 * Update all comment input avatars with current user data
 * @param {Object} userData - User data from Firebase
 * @param {string} initials - User initials
 */
function updateAllCommentInputAvatars(userData, initials) {
  const commentAvatars = document.querySelectorAll(".current-user-avatar")

  commentAvatars.forEach((avatar) => {
    if (userData.profileImageUrl) {
      avatar.innerHTML = `<img src="${userData.profileImageUrl}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
    } else {
      avatar.innerHTML = `<span style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #4a76a8; color: white; border-radius: 50%; font-weight: bold; font-size: 14px;">${initials}</span>`
    }
  })
}

// Export functions to global scope
window.getCurrentUser = getCurrentUser
window.loadUserProfile = loadUserProfile
window.initializeProfileElements = initializeProfileElements
window.setupProfileUpdateListener = setupProfileUpdateListener

console.log("Updated User Authentication with ProfileManager integration loaded successfully")
