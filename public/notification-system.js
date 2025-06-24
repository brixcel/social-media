/**
 * Notification System
 * Handles notification loading and display
 */

let notificationsListener = null

/**
 * Load and display notification count
 */
function loadNotifications() {
  const currentUser = window.getCurrentUser()
  if (!currentUser) return

  const notifBadges = document.querySelectorAll(".ursac-notification-badge")
  if (notifBadges.length === 0) return

  const notifRef = window.firebaseDatabase.ref(`notifications/${currentUser.uid}`)

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

// Export functions to global scope
window.loadNotifications = loadNotifications
