/**
 * Post Interactions System
 * Handles likes, comments, shares, and other post interactions
 */

/**
 * Like or unlike a post
 * @param {string} postId - ID of the post to like/unlike
 */
function likePost(postId) {
  const currentUser = window.getCurrentUser()
  if (!currentUser) {
    window.showModal("Authentication Required", "You must be logged in to like a post.")
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
  const postRef = window.firebaseDatabase.ref(`posts/${postId}/likes/${currentUser.uid}`)

  window.firebaseDatabase
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
                const notifRef = window.firebaseDatabase.ref(`notifications/${postData.userId}`).push()
                return notifRef.set({
                  type: "like",
                  userId: currentUser.uid,
                  postId: postId,
                  timestamp: window.firebase.database.ServerValue.TIMESTAMP,
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

/**
 * Share a post
 * @param {string} postId - ID of the post to share
 */
function sharePost(postId) {
  const currentUser = window.getCurrentUser()
  if (!currentUser) {
    window.showModal("Authentication Required", "You must be logged in to share a post.")
    return
  }

  window.firebaseDatabase
    .ref(`posts/${postId}`)
    .once("value")
    .then((snapshot) => {
      const postData = snapshot.val()
      if (!postData) {
        window.showModal("Error", "Post not found.")
        return
      }

      const sharedContent = `Shared from ${postData.userId}: ${postData.content}`

      const profanityResult = window.checkForProfanity(sharedContent)
      if (profanityResult.isProfane) {
        window.showProfanityWarning(profanityResult.matches)
        return
      }

      const newPostRef = window.firebaseDatabase.ref("posts").push()
      const newPostData = {
        userId: currentUser.uid,
        content: sharedContent,
        timestamp: window.firebase.database.ServerValue.TIMESTAMP,
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
          window.showModal("Success", "Post shared successfully!")
        })
        .catch((error) => {
          console.error("Error sharing post:", error)
          window.showModal("Share Failed", "Failed to share post: " + error.message)
        })
    })
}

/**
 * Toggle comments section visibility
 * @param {Element} element - The comment button element
 */
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

/**
 * Comment on a post (used by comments.js)
 * @param {string} postId - Post ID
 * @param {string} commentText - Comment text
 * @param {Object} mediaFile - Media file object (optional)
 * @param {string} parentCommentId - Parent comment ID for replies (optional)
 * @returns {Promise} - Promise resolving to comment data
 */
function commentPost(postId, commentText, mediaFile = null, parentCommentId = null) {
  const currentUser = window.getCurrentUser()
  if (!currentUser) {
    window.showModal("Authentication Required", "You must be logged in to comment on a post.")
    return Promise.reject(new Error("Not logged in"))
  }

  if (commentText) {
    const profanityResult = window.checkForProfanity(commentText)
    if (profanityResult.isProfane) {
      window.showProfanityWarning(profanityResult.matches)
      return Promise.reject(new Error("Comment contains inappropriate language"))
    }
  }

  const commentRef = window.firebaseDatabase.ref(`posts/${postId}/comments`).push()
  const commentId = commentRef.key

  return window.firebaseDatabase
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
        timestamp: window.firebase.database.ServerValue.TIMESTAMP,
      }

      if (parentCommentId) {
        commentData.parentCommentId = parentCommentId
      }

      if (mediaFile) {
        return window.uploadMedia(mediaFile.file, mediaFile.type).then((mediaData) => {
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
      return window.firebaseDatabase
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
            const notifRef = window.firebaseDatabase.ref(`notifications/${postData.userId}`).push()
            return notifRef.set({
              type: "comment",
              userId: currentUser.uid,
              postId: postId,
              commentId: commentData.id,
              commentText: commentText,
              timestamp: window.firebase.database.ServerValue.TIMESTAMP,
              read: false,
            })
          }

          return Promise.resolve()
        })
    })
    .catch((error) => {
      console.error("Error adding comment:", error)
      window.showModal("Comment Failed", "Failed to add comment. Please try again.")
      throw error
    })
}

/**
 * Reply to a comment
 * @param {string} postId - Post ID
 * @param {string} parentCommentId - Parent comment ID
 * @param {string} replyText - Reply text
 * @param {Object} mediaFile - Media file object (optional)
 * @returns {Promise} - Promise resolving to reply data
 */
function replyToComment(postId, parentCommentId, replyText, mediaFile = null) {
  return commentPost(postId, replyText, mediaFile, parentCommentId)
}

// Export functions to global scope
window.likePost = likePost
window.sharePost = sharePost
window.toggleComments = toggleComments
window.commentPost = commentPost
window.replyToComment = replyToComment
