/**
 * ProfileManager - Centralized Profile Data Management
 *
 * PURPOSE:
 * - Manages all user profile data in one central location
 * - Provides consistent user information across all components
 * - Handles real-time profile updates and synchronization
 * - Caches profile data to improve performance
 *
 * INTEGRATION: Load this file FIRST before any other component files
 */

class ProfileManager {
  constructor() {
    this.profiles = new Map() // Cache for user profiles
    this.currentUserProfile = null
    this.updateListeners = []
    this.isInitialized = false
    this.currentUser = null
  }

  /**
   * Initialize ProfileManager with current user
   * @param {Object} user - Firebase user object
   * @returns {Promise} - Promise that resolves when initialization is complete
   */
  async initialize(user) {
    if (!user) {
      throw new Error("User is required for ProfileManager initialization")
    }

    this.currentUser = user
    console.log("Initializing ProfileManager for user:", user.email)

    try {
      // Load current user's profile
      await this.loadCurrentUserProfile(user.uid)

      // Setup real-time listeners
      this.setupProfileListeners()

      this.isInitialized = true
      console.log("ProfileManager initialized successfully")

      return Promise.resolve()
    } catch (error) {
      console.error("Error initializing ProfileManager:", error)
      throw error
    }
  }

  /**
   * Load current user's profile from Firebase
   * @param {string} userId - User ID
   * @returns {Promise} - Promise that resolves with user profile
   */
  async loadCurrentUserProfile(userId) {
    try {
      const snapshot = await window.firebaseDatabase.ref(`users/${userId}`).once("value")
      const userData = snapshot.val()

      if (userData) {
        this.currentUserProfile = {
          uid: userId,
          ...userData,
        }
        this.profiles.set(userId, this.currentUserProfile)
        console.log("Current user profile loaded:", this.currentUserProfile)
      } else {
        console.warn("No profile data found for current user")
        this.currentUserProfile = {
          uid: userId,
          firstName: "User",
          lastName: "",
          profileImageUrl: null,
        }
      }

      return this.currentUserProfile
    } catch (error) {
      console.error("Error loading current user profile:", error)
      throw error
    }
  }

  /**
   * Get current user's profile
   * @returns {Object|null} - Current user profile or null
   */
  getCurrentUserProfile() {
    return this.currentUserProfile
  }

  /**
   * Get any user's profile by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Promise that resolves with user profile
   */
  async getUserProfile(userId) {
    if (!userId) {
      throw new Error("User ID is required")
    }

    // Check cache first
    if (this.profiles.has(userId)) {
      return this.profiles.get(userId)
    }

    try {
      // Fetch from Firebase
      const snapshot = await window.firebaseDatabase.ref(`users/${userId}`).once("value")
      const userData = snapshot.val()

      if (userData) {
        const profile = {
          uid: userId,
          ...userData,
        }

        // Cache the profile
        this.profiles.set(userId, profile)
        return profile
      } else {
        // Return default profile if no data found
        const defaultProfile = {
          uid: userId,
          firstName: "Unknown",
          lastName: "User",
          profileImageUrl: null,
        }
        this.profiles.set(userId, defaultProfile)
        return defaultProfile
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      throw error
    }
  }

  /**
   * Update current user's profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<boolean>} - Promise that resolves to success status
   */
  async updateCurrentUserProfile(profileData) {
    if (!this.currentUser) {
      throw new Error("No current user available")
    }

    try {
      // Update in Firebase
      await window.firebaseDatabase.ref(`users/${this.currentUser.uid}`).update({
        ...profileData,
        updatedAt: window.firebase.database.ServerValue.TIMESTAMP,
      })

      // Update local cache
      this.currentUserProfile = {
        ...this.currentUserProfile,
        ...profileData,
      }
      this.profiles.set(this.currentUser.uid, this.currentUserProfile)

      // Notify listeners
      this.notifyProfileUpdate(this.currentUserProfile)

      // Broadcast update for real-time sync
      await this.broadcastProfileUpdate(this.currentUser.uid)

      console.log("Profile updated successfully:", this.currentUserProfile)
      return true
    } catch (error) {
      console.error("Error updating profile:", error)
      return false
    }
  }

  /**
   * Get user initials from first and last name
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   * @returns {string} - User initials
   */
  getInitials(firstName, lastName) {
    let initials = ""
    if (firstName) initials += firstName.charAt(0).toUpperCase()
    if (lastName) initials += lastName.charAt(0).toUpperCase()
    return initials || "?"
  }

  /**
   * Get formatted full name
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   * @returns {string} - Formatted full name
   */
  getFormattedName(firstName, lastName) {
    const fullName = `${firstName || ""} ${lastName || ""}`.trim()
    return fullName || "Unknown User"
  }

  /**
   * Setup real-time profile listeners
   */
  setupProfileListeners() {
    if (!window.firebaseDatabase) {
      console.warn("Firebase database not available for profile listeners")
      return
    }

    // Listen for profile updates broadcast
    window.firebaseDatabase.ref("profileUpdates").on("child_changed", (snapshot) => {
      const userId = snapshot.key
      const timestamp = snapshot.val()

      console.log("Profile update detected for user:", userId)

      // Refresh cached profile data
      this.refreshUserProfile(userId)
    })

    // Listen for current user profile changes
    if (this.currentUser) {
      window.firebaseDatabase.ref(`users/${this.currentUser.uid}`).on("value", (snapshot) => {
        const userData = snapshot.val()
        if (userData) {
          const updatedProfile = {
            uid: this.currentUser.uid,
            ...userData,
          }

          this.currentUserProfile = updatedProfile
          this.profiles.set(this.currentUser.uid, updatedProfile)

          // Notify listeners
          this.notifyProfileUpdate(updatedProfile)
        }
      })
    }
  }

  /**
   * Refresh user profile from Firebase
   * @param {string} userId - User ID to refresh
   */
  async refreshUserProfile(userId) {
    try {
      const snapshot = await window.firebaseDatabase.ref(`users/${userId}`).once("value")
      const userData = snapshot.val()

      if (userData) {
        const updatedProfile = {
          uid: userId,
          ...userData,
        }

        this.profiles.set(userId, updatedProfile)

        // Notify listeners if this is the current user
        if (userId === this.currentUser?.uid) {
          this.currentUserProfile = updatedProfile
          this.notifyProfileUpdate(updatedProfile)
        }

        console.log("Profile refreshed for user:", userId)
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error)
    }
  }

  /**
   * Add profile update listener
   * @param {Function} callback - Callback function to call on profile updates
   */
  addProfileUpdateListener(callback) {
    if (typeof callback === "function") {
      this.updateListeners.push(callback)
    }
  }

  /**
   * Remove profile update listener
   * @param {Function} callback - Callback function to remove
   */
  removeProfileUpdateListener(callback) {
    const index = this.updateListeners.indexOf(callback)
    if (index > -1) {
      this.updateListeners.splice(index, 1)
    }
  }

  /**
   * Notify all listeners of profile updates
   * @param {Object} profile - Updated profile data
   */
  notifyProfileUpdate(profile) {
    this.updateListeners.forEach((callback) => {
      try {
        callback(profile)
      } catch (error) {
        console.error("Error in profile update listener:", error)
      }
    })
  }

  /**
   * Broadcast profile update for real-time sync
   * @param {string} userId - User ID that was updated
   */
  async broadcastProfileUpdate(userId) {
    try {
      await window.firebaseDatabase.ref("profileUpdates").update({
        [userId]: window.firebase.database.ServerValue.TIMESTAMP,
      })

      // Also dispatch custom event for local components
      document.dispatchEvent(
        new CustomEvent("profileUpdated", {
          detail: { userId: userId },
        }),
      )
    } catch (error) {
      console.error("Error broadcasting profile update:", error)
    }
  }

  /**
   * Clear all cached profiles (useful for logout)
   */
  clearCache() {
    this.profiles.clear()
    this.currentUserProfile = null
    this.updateListeners = []
    this.isInitialized = false
    this.currentUser = null
    console.log("ProfileManager cache cleared")
  }
}

// Create global instance
window.profileManager = new ProfileManager()

console.log("ProfileManager loaded successfully")
