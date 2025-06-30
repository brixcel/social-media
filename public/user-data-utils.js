/**
 * Enhanced User Data Utilities
 * Provides robust user data fetching with retry logic and caching
 */

// Cache for user data to reduce Firebase calls
const userDataCache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Enhanced user data fetching with retry logic and caching
 * @param {string} userId - The user ID to fetch data for
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Object>} User data object
 */
window.fetchUserDataWithRetry = async (userId, maxRetries = 3) => {
  if (!userId) {
    throw new Error("User ID is required")
  }

  // Check cache first
  const cacheKey = userId
  const cachedData = userDataCache.get(cacheKey)

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    console.log("Returning cached user data for:", userId)
    return cachedData.data
  }

  // Firebase reference
  const firebase = window.firebase
  if (!firebase || !firebase.database) {
    throw new Error("Firebase is not available")
  }

  const database = firebase.database()

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching user data for ${userId}, attempt ${attempt}/${maxRetries}`)

      const snapshot = await database.ref(`users/${userId}`).once("value")

      if (snapshot.exists()) {
        const userData = snapshot.val()

        // Cache the result
        userDataCache.set(cacheKey, {
          data: userData,
          timestamp: Date.now(),
        })

        console.log("Successfully fetched user data for:", userId)
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

        // Cache the null result to prevent repeated Firebase calls
        userDataCache.set(cacheKey, {
          data: null,
          timestamp: Date.now(),
        })

        return null
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed for userId ${userId}:`, error)

      if (attempt === maxRetries) {
        console.error(`All ${maxRetries} attempts failed for userId: ${userId}`)
        throw error
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s...
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

/**
 * Get user initials from first and last name
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @returns {string} User initials
 */
window.getInitials = (firstName, lastName) => {
  if (!firstName && !lastName) return "?"

  let initials = ""
  if (firstName) initials += firstName.charAt(0).toUpperCase()
  if (lastName) initials += lastName.charAt(0).toUpperCase()
  return initials || "?"
}

/**
 * Clear user data cache
 */
window.clearUserDataCache = () => {
  userDataCache.clear()
  console.log("User data cache cleared")
}

/**
 * Get cache statistics
 */
window.getUserDataCacheStats = () => ({
  size: userDataCache.size,
  entries: Array.from(userDataCache.keys()),
})

console.log("User data utilities loaded successfully")

/**
 * Clean up posts from users that no longer exist
 * This should be called periodically or when needed
 */
window.cleanupOrphanedPosts = async () => {
  if (!window.firebase || !window.firebase.database) {
    console.error("Firebase not available for cleanup")
    return
  }

  const database = window.firebase.database()

  try {
    // Get all posts
    const postsSnapshot = await database.ref("posts").once("value")
    const posts = postsSnapshot.val()

    if (!posts) return

    // Get all users
    const usersSnapshot = await database.ref("users").once("value")
    const users = usersSnapshot.val() || {}

    const orphanedPosts = []

    // Find posts from non-existent users
    Object.entries(posts).forEach(([postId, post]) => {
      if (post.userId && !users[post.userId]) {
        orphanedPosts.push(postId)
      }
    })

    console.log(`Found ${orphanedPosts.length} orphaned posts`)

    // Optionally remove orphaned posts (uncomment if needed)
    // for (const postId of orphanedPosts) {
    //   await database.ref(`posts/${postId}`).remove()
    // }

    return orphanedPosts
  } catch (error) {
    console.error("Error cleaning up orphaned posts:", error)
  }
}
