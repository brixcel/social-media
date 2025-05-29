// Comments and replies functionality - REFACTORED for seamless integration
let currentUser = null
let isSubmittingComment = false

// Function to initialize comment system
function initializeCommentSystem(user) {
  currentUser = user
  addCommentStyles()
  initializeCommentListeners()
  console.log("Comment system initialized for user:", user.email)
}

// Function to load comments for a post
function loadComments(postId) {
  const postCard = document.querySelector(`[data-post-id="${postId}"]`)
  if (!postCard) return

  const commentsList = postCard.querySelector(".ursac-comments-list")
  if (!commentsList) return

  commentsList.innerHTML = '<div class="ursac-loading">Loading comments...</div>'

  if (typeof firebase === "undefined" || !firebase.database) {
    console.error("Firebase database not available")
    commentsList.innerHTML = '<div class="ursac-error">Firebase not available.</div>'
    return
  }

  firebase
    .database()
    .ref(`posts/${postId}/comments`)
    .once("value")
    .then((snapshot) => {
      const comments = snapshot.val()
      commentsList.innerHTML = ""

      if (comments) {
        const commentsArray = Object.entries(comments)
          .map(([id, comment]) => ({ id, ...comment }))
          .sort((a, b) => a.timestamp - b.timestamp)

        // FIXED: Only show top-level comments and their direct replies (Facebook-style)
        const topLevelComments = commentsArray.filter((comment) => !comment.parentCommentId)
        const replies = commentsArray.filter((comment) => comment.parentCommentId)

        const repliesByParent = {}
        replies.forEach((reply) => {
          if (!repliesByParent[reply.parentCommentId]) {
            repliesByParent[reply.parentCommentId] = []
          }
          repliesByParent[reply.parentCommentId].push(reply)
        })

        const fragment = document.createDocumentFragment()

        topLevelComments.forEach((comment) => {
          comment.replies = repliesByParent[comment.id] || []
          const commentElement = createCommentElement(comment, postId)
          fragment.appendChild(commentElement)
        })

        commentsList.appendChild(fragment)
      } else {
        commentsList.innerHTML = '<div class="ursac-no-comments">No comments yet. Be the first to comment!</div>'
      }
    })
    .catch((error) => {
      console.error("Error loading comments:", error)
      commentsList.innerHTML = '<div class="ursac-error">Failed to load comments.</div>'
    })
}

// FIXED: Create comment element with vertical layout (Facebook-style)
function createCommentElement(comment, postId, maxVisibleReplies = 3) {
  const wrapper = document.createElement("div")
  wrapper.className = "ursac-comment-thread"
  wrapper.setAttribute("data-user-id", comment.userId)

  const commentElement = document.createElement("div")
  commentElement.className = "ursac-comment"
  commentElement.setAttribute("data-comment-id", comment.id)

  const commentHTML = `
    <div class="ursac-comment-avatar">
      <span>${getInitials(comment.userFirstName || "", comment.userLastName || "")}</span>
    </div>
    <div class="ursac-comment-content">
      <div class="ursac-comment-author">${comment.userFirstName || ""} ${comment.userLastName || ""}</div>
      <div class="ursac-comment-text">${comment.text}</div>
      <div class="ursac-comment-time">${formatTimeAgo(new Date(comment.timestamp))}</div>
      <div class="ursac-comment-actions">
        <button class="ursac-reply-button" onclick="commentSystem.showReplyInput('${postId}', '${comment.id}')">
          <i class="fas fa-reply"></i> Reply
        </button>
      </div>
    </div>
  `

  commentElement.innerHTML = commentHTML
  wrapper.appendChild(commentElement)

  // Add reply input container
  wrapper.appendChild(createReplyInputContainer(postId, comment.id))

  // FIXED: Handle replies in vertical layout (only direct replies, no nesting)
  if (comment.replies && comment.replies.length > 0) {
    const repliesContainer = document.createElement("div")
    repliesContainer.className = "ursac-reply-container"

    const sortedReplies = comment.replies.sort((a, b) => a.timestamp - b.timestamp)
    const visibleReplies = sortedReplies.slice(0, maxVisibleReplies)
    const hiddenReplies = sortedReplies.slice(maxVisibleReplies)

    // Add visible replies
    visibleReplies.forEach((reply) => {
      const replyElement = createReplyElement(reply, postId)
      repliesContainer.appendChild(replyElement)
    })

    // Add "View more replies" button if there are hidden replies
    if (hiddenReplies.length > 0) {
      const viewMoreButton = createViewMoreButton(hiddenReplies, postId)
      repliesContainer.appendChild(viewMoreButton.button)
      repliesContainer.appendChild(viewMoreButton.container)
    }

    wrapper.appendChild(repliesContainer)
  }

  return wrapper
}

// FIXED: Create reply element (NO NESTED REPLIES - only direct replies to main comments)
function createReplyElement(reply, postId) {
  const replyElement = document.createElement("div")
  replyElement.className = "ursac-comment ursac-reply"
  replyElement.setAttribute("data-comment-id", reply.id)
  replyElement.setAttribute("data-user-id", reply.userId)

  const replyHTML = `
    <div class="ursac-comment-avatar">
      <span>${getInitials(reply.userFirstName || "", reply.userLastName || "")}</span>
    </div>
    <div class="ursac-comment-content">
      <div class="ursac-comment-author">${reply.userFirstName || ""} ${reply.userLastName || ""}</div>
      <div class="ursac-comment-text">${reply.text}</div>
      <div class="ursac-comment-time">${formatTimeAgo(new Date(reply.timestamp))}</div>
    </div>
  `

  replyElement.innerHTML = replyHTML
  return replyElement
}

function createReplyInputContainer(postId, commentId) {
  const container = document.createElement("div")
  container.className = "ursac-reply-input-container"
  container.style.display = "none"
  container.setAttribute("data-for-comment", commentId)
  container.innerHTML = `
    <div class="ursac-comment-input-wrapper">
      <div class="ursac-comment-avatar">
        <span>${getInitials(currentUser?.firstName || "", currentUser?.lastName || "")}</span>
      </div>
      <div class="ursac-comment-input-container">
        <input type="text" class="ursac-reply-input" placeholder="Write a reply...">
        <button class="ursac-reply-submit" onclick="commentSystem.submitReply('${postId}', '${commentId}')" disabled>
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  `
  return container
}

function createViewMoreButton(hiddenReplies, postId) {
  const button = document.createElement("button")
  button.className = "ursac-view-more-replies"
  const replyCount = hiddenReplies.length
  button.innerHTML = `
    <i class="fas fa-chevron-down"></i>
    View ${replyCount} more ${replyCount === 1 ? "reply" : "replies"}
  `

  const container = document.createElement("div")
  container.className = "ursac-hidden-replies"
  container.style.display = "none"

  hiddenReplies.forEach((reply) => {
    container.appendChild(createReplyElement(reply, postId))
  })

  button.addEventListener("click", () => {
    const isExpanded = container.style.display === "block"
    container.style.display = isExpanded ? "none" : "block"
    button.innerHTML = isExpanded
      ? `<i class="fas fa-chevron-down"></i> View ${replyCount} more ${replyCount === 1 ? "reply" : "replies"}`
      : `<i class="fas fa-chevron-up"></i> Show less`
  })

  return { button, container }
}

// FIXED: Enhanced CSS for vertical Facebook-like layout
function addCommentStyles() {
  if (document.getElementById("ursac-comment-styles")) return

  const style = document.createElement("style")
  style.id = "ursac-comment-styles"
  style.textContent = `
    /* FIXED: Vertical comment layout similar to Facebook */
    .ursac-comments-list {
      margin-top: 15px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
    }

    .ursac-comment-thread {
      margin-bottom: 12px;
      width: 100%;
    }

    .ursac-comment {
      display: flex;
      padding: 12px;
      gap: 10px;
      background: #f8f9fa;
      border-radius: 12px;
      width: 100%;
      box-sizing: border-box;
      margin-bottom: 8px;
    }

    .ursac-comment-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #4a76a8;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      flex-shrink: 0;
      font-size: 14px;
    }

    .ursac-comment-content {
      flex: 1;
      min-width: 0;
    }

    .ursac-comment-author {
      font-weight: bold;
      margin-bottom: 4px;
      font-size: 13px;
      color: #1c1e21;
    }

    .ursac-comment-text {
      margin-bottom: 6px;
      word-break: break-word;
      line-height: 1.4;
      font-size: 14px;
      color: #1c1e21;
    }

    .ursac-comment-time {
      font-size: 12px;
      color: #65676b;
      margin-bottom: 6px;
    }

    .ursac-comment-actions {
      display: flex;
      gap: 12px;
    }

    .ursac-reply-button {
      background: none;
      border: none;
      color: #65676b;
      font-size: 12px;
      padding: 4px 0;
      cursor: pointer;
      font-weight: 600;
      transition: color 0.2s;
    }

    .ursac-reply-button:hover {
      color: #4a76a8;
      text-decoration: underline;
    }

    /* FIXED: Reply container with proper indentation */
    .ursac-reply-container {
      margin-left: 42px;
      position: relative;
      padding-left: 12px;
      border-left: 2px solid #e4e6ea;
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ursac-reply {
      background: #f0f2f5;
      margin-bottom: 6px;
    }

    /* Reply input styles */
    .ursac-reply-input-container {
      margin-left: 42px;
      margin-top: 8px;
      margin-bottom: 8px;
    }

    .ursac-comment-input-wrapper {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      padding: 8px;
      background: #ffffff;
      border-radius: 20px;
      border: 1px solid #e4e6ea;
    }

    .ursac-comment-input-container {
      flex: 1;
      position: relative;
      display: flex;
    }

    .ursac-reply-input,
    .ursac-comment-input {
      width: 100%;
      padding: 8px 40px 8px 12px;
      border: none;
      border-radius: 18px;
      background: #f0f2f5;
      outline: none;
      font-size: 14px;
      resize: none;
      min-height: 20px;
    }

    .ursac-reply-input:focus,
    .ursac-comment-input:focus {
      background: #ffffff;
      box-shadow: 0 0 0 2px #4a76a8;
    }

    .ursac-reply-submit,
    .ursac-comment-submit {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #4a76a8;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      transition: background-color 0.2s;
    }

    .ursac-reply-submit:hover,
    .ursac-comment-submit:hover {
      background-color: #e4e6ea;
    }

    .ursac-reply-submit:disabled,
    .ursac-comment-submit:disabled {
      color: #bec3c9;
      cursor: not-allowed;
    }

    /* View more button styles */
    .ursac-view-more-replies {
      background: none;
      border: none;
      color: #4a76a8;
      font-size: 13px;
      padding: 8px 0;
      margin: 4px 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: color 0.2s;
      font-weight: 600;
    }

    .ursac-view-more-replies:hover {
      text-decoration: underline;
    }

    /* Hidden replies container */
    .ursac-hidden-replies {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all 0.3s ease-in-out;
    }

    /* Loading and error states */
    .ursac-loading,
    .ursac-error,
    .ursac-no-comments {
      padding: 12px;
      text-align: center;
      color: #65676b;
      font-style: italic;
    }

    .ursac-error {
      color: #dc3545;
    }

    /* Scrollbar styling for comments list */
    .ursac-comments-list::-webkit-scrollbar {
      width: 6px;
    }

    .ursac-comments-list::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    .ursac-comments-list::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    .ursac-comments-list::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `
  document.head.appendChild(style)
}

// FIXED: Initialize comment listeners with duplicate prevention
function initializeCommentListeners() {
  document.addEventListener("input", (e) => {
    if (e.target.matches(".ursac-comment-input, .ursac-reply-input")) {
      const button = e.target.nextElementSibling
      if (button) {
        button.disabled = e.target.value.trim().length === 0
      }
    }
  })

  document.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (e.target.matches(".ursac-comment-input")) {
        e.preventDefault()
        const postId = e.target.closest(".ursac-post-card")?.getAttribute("data-post-id")
        if (postId) {
          submitComment(postId)
        }
      } else if (e.target.matches(".ursac-reply-input")) {
        e.preventDefault()
        const button = e.target.nextElementSibling
        if (button && !button.disabled) {
          button.click()
        }
      }
    }
  })
}

// FIXED: Submit comment function with duplicate prevention
function submitComment(postId) {
  if (!currentUser) {
    if (typeof showModal === "function") {
      showModal("Authentication Required", "You must be logged in to comment.")
    }
    return
  }

  // FIXED: Prevent duplicate submissions
  if (isSubmittingComment) {
    return
  }

  const postCard = document.querySelector(`[data-post-id="${postId}"]`)
  if (!postCard) return

  const commentInput = postCard.querySelector(".ursac-comment-input")
  if (!commentInput) return

  const commentText = commentInput.value.trim()
  if (!commentText) return

  // Check for profanity
  if (typeof checkForProfanity === "function") {
    const profanityResult = checkForProfanity(commentText)
    if (profanityResult?.isProfane) {
      if (typeof showProfanityWarning === "function") {
        showProfanityWarning(profanityResult.matches)
      }
      return
    }
  }

  isSubmittingComment = true

  commentInput.disabled = true
  const submitButton = commentInput.nextElementSibling
  if (submitButton) submitButton.disabled = true

  if (typeof commentPost === "function") {
    commentPost(postId, commentText)
      .then(() => {
        commentInput.value = ""
        loadComments(postId)
      })
      .catch((error) => {
        console.error("Error posting comment:", error)
        if (typeof showModal === "function") {
          showModal("Comment Failed", "Failed to post comment. Please try again.")
        }
      })
      .finally(() => {
        commentInput.disabled = false
        if (submitButton) submitButton.disabled = true
        isSubmittingComment = false
      })
  } else {
    console.warn("commentPost function not available")
    commentInput.disabled = false
    if (submitButton) submitButton.disabled = true
    isSubmittingComment = false
  }
}

// FIXED: Export the comment system functions
if (!window.commentSystem) {
  window.commentSystem = {
    initialize: initializeCommentSystem,
    loadComments,
    showReplyInput: (postId, commentId) => {
      document.querySelectorAll(".ursac-reply-input-container").forEach((container) => {
        container.style.display = "none"
      })

      const replyContainer = document.querySelector(`.ursac-reply-input-container[data-for-comment="${commentId}"]`)
      if (replyContainer) {
        replyContainer.style.display = "block"
        const input = replyContainer.querySelector(".ursac-reply-input")
        if (input) input.focus()
      }
    },
    submitReply: (postId, commentId) => {
      if (!currentUser) {
        if (typeof showModal === "function") {
          showModal("Authentication Required", "You must be logged in to reply.")
        }
        return
      }

      // FIXED: Prevent duplicate submissions
      if (isSubmittingComment) {
        return
      }

      const replyContainer = document.querySelector(`.ursac-reply-input-container[data-for-comment="${commentId}"]`)
      if (!replyContainer) return

      const input = replyContainer.querySelector(".ursac-reply-input")
      if (!input) return

      const replyText = input.value.trim()
      if (!replyText) return

      if (typeof checkForProfanity === "function") {
        const profanityResult = checkForProfanity(replyText)
        if (profanityResult?.isProfane) {
          if (typeof showProfanityWarning === "function") {
            showProfanityWarning(profanityResult.matches)
          }
          return
        }
      }

      isSubmittingComment = true

      input.disabled = true
      const submitBtn = replyContainer.querySelector(".ursac-reply-submit")
      if (submitBtn) submitBtn.disabled = true

      if (typeof replyToComment === "function") {
        replyToComment(postId, commentId, replyText)
          .then(() => {
            input.value = ""
            replyContainer.style.display = "none"
            loadComments(postId)
          })
          .catch((error) => {
            console.error("Error posting reply:", error)
            if (typeof showModal === "function") {
              showModal("Reply Failed", "Failed to post reply. Please try again.")
            }
          })
          .finally(() => {
            input.disabled = false
            if (submitBtn) submitBtn.disabled = true
            isSubmittingComment = false
          })
      } else {
        console.warn("replyToComment function not available")
        input.disabled = false
        if (submitBtn) submitBtn.disabled = true
        isSubmittingComment = false
      }
    },
    submitComment: submitComment,
  }
}

// Helper functions - only define if they don't exist
if (typeof getInitials !== "function") {
  function getInitials(firstName, lastName) {
    return (firstName ? firstName[0].toUpperCase() : "") + (lastName ? lastName[0].toUpperCase() : "")
  }
}

if (typeof formatTimeAgo !== "function") {
  function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000)
    let interval = seconds / 31536000

    if (interval > 1) {
      return Math.floor(interval) + " years ago"
    }
    interval = seconds / 2592000
    if (interval > 1) {
      return Math.floor(interval) + " months ago"
    }
    interval = seconds / 86400
    if (interval > 1) {
      return Math.floor(interval) + " days ago"
    }
    interval = seconds / 3600
    if (interval > 1) {
      return Math.floor(interval) + " hours ago"
    }
    interval = seconds / 60
    if (interval > 1) {
      return Math.floor(interval) + " minutes ago"
    }
    return Math.floor(seconds) + " seconds ago"
  }
}

// Mock functions if they don't exist
if (typeof showModal !== "function") {
  function showModal(title, message) {
    console.warn(`Modal: ${title} - ${message}`)
    alert(`${title}: ${message}`)
  }
}

if (typeof checkForProfanity !== "function") {
  function checkForProfanity(text) {
    return { isProfane: false, matches: [] }
  }
}

if (typeof showProfanityWarning !== "function") {
  function showProfanityWarning(matches) {
    console.warn("Profanity warning:", matches)
  }
}

if (typeof commentPost !== "function") {
  function commentPost(postId, commentText) {
    return new Promise((resolve) => {
      console.log(`Comment posted to post ${postId} with text: ${commentText}`)
      setTimeout(resolve, 500)
    })
  }
}

if (typeof replyToComment !== "function") {
  function replyToComment(postId, commentId, replyText) {
    return new Promise((resolve) => {
      console.log(`Reply posted to comment ${commentId} on post ${postId} with text: ${replyText}`)
      setTimeout(resolve, 500)
    })
  }
}

console.log("Comments system loaded successfully")
