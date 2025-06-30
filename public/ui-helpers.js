/**
 * UI Helper Functions
 * Contains utility functions for UI interactions and formatting
 */

/**
 * Generate user initials from first and last name
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @returns {string} - User initials
 */
function getInitials(firstName, lastName) {
  let initials = ""
  if (firstName) initials += firstName.charAt(0).toUpperCase()
  if (lastName) initials += lastName.charAt(0).toUpperCase()
  return initials || "?"
}

/**
 * Show generic modal with title and message
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 */
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

    document.body.insertAdjacentHTML("beforeend", modalHTML)
    modalElement = document.getElementById("ursac-modal")

    document.getElementById("ursac-modal-close").onclick = () => {
      modalElement.style.display = "none"
    }

    document.getElementById("ursac-modal-ok").onclick = () => {
      modalElement.style.display = "none"
    }
  }

  const titleElement = document.getElementById("ursac-modal-title")
  const messageElement = document.getElementById("ursac-modal-message")

  if (titleElement) titleElement.textContent = title
  if (messageElement) messageElement.textContent = message

  modalElement.style.display = "flex"
}

/**
 * Format time ago from date
 * @param {Date} date - Date to format
 * @returns {string} - Formatted time string
 */
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

/**
 * Convert URLs in text to clickable links
 * @param {string} text - Text to process
 * @returns {string} - Text with clickable links
 */
function linkifyText(text) {
  if (!text) return ""
  return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
}

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * Count likes in a likes object
 * @param {Object} likes - Likes object from Firebase
 * @returns {number} - Number of likes
 */
function countLikes(likes) {
  if (!likes) return 0
  return Object.keys(likes).length
}

/**
 * Count comments in a comments object
 * @param {Object} comments - Comments object from Firebase
 * @returns {number} - Number of comments
 */
function countComments(comments) {
  if (!comments) return 0
  return Object.keys(comments).length
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
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

// Export functions to global scope
window.getInitials = getInitials
window.showModal = showModal
window.formatTimeAgo = formatTimeAgo
window.linkifyText = linkifyText
window.formatFileSize = formatFileSize
window.countLikes = countLikes
window.countComments = countComments
window.debounce = debounce
