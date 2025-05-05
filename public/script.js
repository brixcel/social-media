const firebase = window.firebase;
let currentUser = null;
let selectedMedia = null;
let postsLoaded = false;
let postsListener = null;
let userProfileBtn = null;
let profileDropdown = null;
let logoutBtn = null;
let addAccountBtn = null;
let notificationsListener = null;

// Add this helper function at the top level of your script.js file
function getInitials(firstName, lastName) {
  let initials = '';
  if (firstName) initials += firstName.charAt(0).toUpperCase();
  if (lastName) initials += lastName.charAt(0).toUpperCase();
  return initials || '?';
}

// Define handleCommentInput function at the global scope
function handleCommentInput(e) {
  const inputValue = e.target.value.trim();
  const submitBtn = e.target.nextElementSibling;
  if (submitBtn) {
    submitBtn.disabled = inputValue.length === 0;
  }
}

// Updated loadNotifications function to properly display notification count
function loadNotifications() {
  if (!currentUser) return;

  // Get all notification badges
  const notifBadges = document.querySelectorAll('.ursac-notification-badge');
  if (notifBadges.length === 0) return;

  const notifRef = firebase.database().ref(`notifications/${currentUser.uid}`);

  // Remove any existing listener first to prevent duplicates
  if (notificationsListener) {
    notifRef.off('value', notificationsListener);
  }

  notificationsListener = notifRef.on('value', function (snapshot) {
    let unreadCount = 0;

    if (snapshot.exists()) {
      snapshot.forEach(childSnapshot => {
        const notification = childSnapshot.val();
        if (!notification.read) unreadCount++;
      });
    }

    // Update all notification badges with count
    notifBadges.forEach(badge => {
      if (unreadCount > 0) {
        badge.style.display = 'flex';
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      } else {
        badge.style.display = 'none';
      }
    });
  });
}

// Move loadUserProfile function here, outside DOMContentLoaded
function loadUserProfile(user) {
  if (!user) {
    return;
  }

  firebase.database().ref("users/" + user.uid).once("value")
    .then(function(snapshot) {
      const userData = snapshot.val();

      // Use the global userProfileBtn instead of creating a new local variable
      if (userData && userProfileBtn) {
        const initials = getInitials(userData.firstName, userData.lastName);
        const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim();

        // Update profile button
        userProfileBtn.innerHTML = `
          <div class="ursac-profile-avatar">
            <span>${initials}</span>
          </div>
          <div class="ursac-profile-info">
            <div class="ursac-profile-name">${fullName}</div>
            <div class="ursac-profile-email">${user.email}</div>
          </div>
          <i class="fas fa-chevron-down"></i>
        `;

        // Update create post area
        const createPostAvatar = document.getElementById("create-post-avatar");
        const createPostUsername = document.getElementById("create-post-username");

        if (createPostAvatar) {
          createPostAvatar.innerHTML = `<span>${initials}</span>`;
        }
        if (createPostUsername) {
          createPostUsername.textContent = fullName;
        }
      } else {
        console.error("User data or profile button not found");
      }
    })
    .catch(function(error) {
      console.error("Error loading user profile:", error);
    });
}

// Add document ready check at the beginning of the file
document.addEventListener('DOMContentLoaded', function () {
  const postInput = document.getElementById("post-input");
  const postButton = document.getElementById("post-button");
  const mediaPreview = document.getElementById("media-preview");
  const filePhoto = document.getElementById("file-photo");
  const fileVideo = document.getElementById("file-video");
  const fileAttachment = document.getElementById("file-attachment");
  const uploadModal = document.getElementById("upload-modal");
  const uploadProgress = document.getElementById("upload-progress");
  const uploadStatus = document.getElementById("upload-status");

  // Initialize Firebase listeners only after DOM is ready
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      currentUser = user;
      initializeProfileElements(); // Initialize profile elements first
      loadUserProfile(user);      // Load user profile data
      loadPosts();               // Load posts after user is authenticated
      loadNotifications();       // Load notifications after user is authenticated

      // Set up a periodic refresh of notifications
      setInterval(loadNotifications, 30000); // Refresh every 30 seconds
    } else {
      window.location.href = '/login';
    }
  });

  // Function to initialize profile elements
  function initializeProfileElements() {
    userProfileBtn = document.getElementById('user-profile-btn');
    profileDropdown = document.getElementById('user-profile-dropdown');
    logoutBtn = document.getElementById('logout-btn');
    addAccountBtn = document.getElementById('add-account-btn');

    // Toggle profile dropdown
    if (userProfileBtn) {
      userProfileBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (profileDropdown) {
          const isVisible = profileDropdown.style.display === 'block';

          // Toggle dropdown
          profileDropdown.style.display = isVisible ? 'none' : 'block';

          // Toggle chevron rotation
          const chevron = this.querySelector('.fa-chevron-down');
          if (chevron) {
            chevron.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
            chevron.style.transition = 'transform 0.2s';
          }

          // Position the dropdown above the button
          if (!isVisible) {
            const buttonRect = userProfileBtn.getBoundingClientRect();
            profileDropdown.style.bottom = `${buttonRect.height + 8}px`;
          }
        }
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
      if (profileDropdown &&
        !profileDropdown.contains(e.target) &&
        userProfileBtn && !userProfileBtn.contains(e.target)) {
        profileDropdown.style.display = 'none';
        const chevron = userProfileBtn?.querySelector('.fa-chevron-down');
        if (chevron) {
          chevron.style.transform = 'rotate(0deg)';
        }
      }
    });

    // Setup logout button
    if (logoutBtn) {
      logoutBtn.innerHTML = `
        <i class="fas fa-sign-out-alt"></i>
        <span>Log out</span>
      `;
      logoutBtn.addEventListener('click', function () {
        firebase.auth().signOut().then(() => {
          window.location.href = '/login';
        }).catch((error) => {
          console.error('Logout Error:', error);
        });
      });
    }

    // Setup add account button
    if (addAccountBtn) {
      addAccountBtn.innerHTML = `
        <i class="fas fa-user-plus"></i>
        <span>Add an existing account</span>
      `;
      addAccountBtn.addEventListener('click', function () {
        firebase.auth().signOut().then(() => {
          sessionStorage.setItem('addingAccount', 'true');
          window.location.href = '/login';
        });
      });
    }
  }

  // Add event listeners only if elements exist
  const setupEventListeners = () => {
    const userProfileBtn = document.getElementById('user-profile-btn');
    const profileDropdown = document.getElementById('user-profile-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const addAccountBtn = document.getElementById('add-account-btn');

    if (userProfileBtn) {
      userProfileBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (profileDropdown) {
          profileDropdown.classList.toggle('show');
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        firebase.auth().signOut().then(() => {
          window.location.href = '/login';
        });
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
      if (profileDropdown && !profileDropdown.contains(e.target) &&
        userProfileBtn && !userProfileBtn.contains(e.target)) {
        profileDropdown.classList.remove('show');
      }
    });
  };

  // Call setup function after DOM is ready
  setupEventListeners();

  // Setup search input event listener
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const query = searchInput.value.trim();
      if (query) {
        searchPosts(query);
      } else {
        // Reset the feed if the search input is cleared
        loadPosts();
      }
    });
  }

  // Modal elements
  const postModal = document.getElementById('post-modal');
  const openPostModalBtn = document.getElementById('open-post-modal');
  const closePostModalBtn = document.getElementById('close-post-modal');
  const modalPostContent = document.getElementById('modal-post-content');
  const modalPostButton = document.getElementById('modal-post-button');
  const modalMediaPreview = document.getElementById('modal-media-preview');
  let modalSelectedMedia = null;

  // Open modal
  if (openPostModalBtn) {
    openPostModalBtn.addEventListener('click', () => {
      postModal.style.display = 'flex';
      modalPostContent.value = '';
      modalMediaPreview.innerHTML = '';
      modalSelectedMedia = null;
      modalPostButton.disabled = true;
    });
  }

  // Close modal
  if (closePostModalBtn) {
    closePostModalBtn.addEventListener('click', () => {
      postModal.style.display = 'none';
    });
  }

  // Enable/disable post button based on input/media
  if (modalPostContent) {
    modalPostContent.addEventListener('input', () => {
      modalPostButton.disabled = modalPostContent.value.trim().length === 0 && !modalSelectedMedia;
    });
  }

  // Media file handlers for modal
  document.getElementById('modal-file-photo')?.addEventListener('change', function (e) {
    handleModalFileSelect(e, 'image');
  });
  document.getElementById('modal-file-video')?.addEventListener('change', function (e) {
    handleModalFileSelect(e, 'video');
  });
  document.getElementById('modal-file-attachment')?.addEventListener('change', function (e) {
    handleModalFileSelect(e, 'file');
  });

  function handleModalFileSelect(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    modalMediaPreview.innerHTML = '';
    modalSelectedMedia = { file, type, name: file.name, size: file.size };
    const previewItem = document.createElement('div');
    previewItem.className = 'ursac-preview-item';
    if (type === 'image') {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      previewItem.appendChild(img);
    } else if (type === 'video') {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.controls = true;
      previewItem.appendChild(video);
    } else {
      previewItem.innerHTML = `<i class="fas fa-paperclip"></i><span>${file.name}</span>`;
    }
    modalMediaPreview.appendChild(previewItem);
    modalPostButton.disabled = modalPostContent.value.trim().length === 0 && !modalSelectedMedia;
  }

  // Post creation logic for modal
  if (modalPostButton) {
    modalPostButton.addEventListener('click', function () {
      if (!currentUser) {
        alert("You must be logged in to post.");
        return;
      }
      const content = modalPostContent.value.trim();
      modalPostButton.disabled = true;

      // If there is media, upload it first
      if (modalSelectedMedia) {
        uploadMedia(modalSelectedMedia.file, modalSelectedMedia.type)
          .then((mediaData) => {
            const newPostRef = firebase.database().ref("posts").push();
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
                console.log("Post with media created successfully.");
              })
              .catch((error) => {
                console.error("Error creating post with media:", error);
                alert("Failed to create post: " + error.message);
              });
          })
          .catch((error) => {
            console.error("Media upload failed:", error);
            alert("Failed to upload media: " + error.message);
          })
          .finally(() => {
            modalPostButton.disabled = false;
          });
      } else {
        // No media, just create the post
        const newPostRef = firebase.database().ref("posts").push();
        newPostRef
          .set({
            userId: currentUser.uid,
            content: content,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
          })
          .then(() => {
            console.log("Post created successfully.");
          })
          .catch((error) => {
            console.error("Error creating post:", error);
            alert("Failed to create post: " + error.message);
          })
          .finally(() => {
            modalPostButton.disabled = false;
          });
      }

      postModal.style.display = 'none';
      // Reset modal state
      modalPostContent.value = '';
      modalMediaPreview.innerHTML = '';
      modalSelectedMedia = null;
      modalPostButton.disabled = true;
    });
  }

  initializeCommentListeners();
});

// The key function that needs modification is loadPosts()
// Here's the updated version to ensure latest posts are at the top

function loadPosts() {
  // Remove any existing listener to prevent duplicates
  if (postsListener) {
    const postsRef = firebase.database().ref("posts");
    postsRef.off("value", postsListener);
  }

  const postsRef = firebase.database().ref("posts");
  postsListener = postsRef
    .orderByChild("timestamp")
    .on(
      "value",
      function (snapshot) {
        const postsData = snapshot.val();
        const postsFeed = document.getElementById("posts-feed");

        if (!postsFeed) {
          console.error("Posts feed element not found");
          return;
        }

        postsFeed.innerHTML = "";

        if (postsData) {
          // Convert to array and sort by timestamp in descending order (newest first)
          const postsArray = Object.entries(postsData)
            .map(([id, post]) => ({
              id,
              ...post,
            }))
            .sort((a, b) => b.timestamp - a.timestamp); // Ensure newest posts are first

          console.log("Posts sorted by timestamp (newest first):",
            postsArray.map(p => ({ id: p.id, timestamp: p.timestamp })));

          // Create a new fragment to hold all posts
          const fragment = document.createDocumentFragment();

          // Process posts in order - newest first
          Promise.all(
            postsArray.map((post) => {
              return firebase
                .database()
                .ref("users/" + post.userId)
                .once("value")
                .then((userSnapshot) => {
                  const userData = userSnapshot.val();
                  const postElement = createPostElement(post, userData);

                  // Important: Insert each new post at the beginning of the fragment
                  // This ensures newest posts appear at the top
                  fragment.insertBefore(postElement, fragment.firstChild);
                })
                .catch((error) => {
                  console.error("Error loading user data for post:", error);
                });
            })
          ).then(() => {
            // Clear the feed and add all posts
            postsFeed.innerHTML = "";
            postsFeed.appendChild(fragment);
          });
        } else {
          postsFeed.innerHTML = `
            <div class="ursac-post-card">
              <div class="ursac-post-content" style="text-align: center;">
                No posts yet. Be the first to post something!
              </div>
            </div>
          `;
        }
        postsLoaded = true;
      },
      function (error) {
        console.error("Error loading posts:", error);
      }
    );
}

// Also update the createPost function to ensure new posts appear at the top immediately
function createPost() {
  if (!currentUser) {
    alert("You must be logged in to post.");
    return;
  }

  const postInput = document.getElementById("post-input");
  if (!postInput) return;

  const content = postInput.value.trim();
  if (!content && !selectedMedia) {
    alert("Please enter some content or add media to your post.");
    return;
  }

  const postButton = document.getElementById("post-button");
  if (postButton) postButton.disabled = true;

  // Current timestamp to ensure proper ordering
  const timestamp = firebase.database.ServerValue.TIMESTAMP;

  // If there is media, upload it first
  if (selectedMedia) {
    uploadMedia(selectedMedia.file, selectedMedia.type)
      .then((mediaData) => {
        const newPostRef = firebase.database().ref("posts").push();
        return newPostRef.set({
          userId: currentUser.uid,
          content: content,
          timestamp: timestamp, // Use server timestamp for accurate ordering
          mediaURL: mediaData.url,
          mediaType: mediaData.type,
          mediaName: mediaData.name,
          mediaSize: mediaData.size,
        });
      })
      .then(() => {
        console.log("Post with media created successfully.");
        postInput.value = "";
        clearMediaPreview();
        if (postButton) postButton.disabled = true;

        // Collapse expanded post area
        const expandedPostArea = document.getElementById("expanded-post-area");
        if (expandedPostArea) {
          expandedPostArea.classList.remove("ursac-expanded");
        }

        // Force refresh posts to ensure new post appears at the top
        loadPosts();
      })
      .catch((error) => {
        console.error("Error creating post with media:", error);
        alert("Failed to create post: " + error.message);
        if (postButton) postButton.disabled = false;
      });
  } else {
    // No media, just create the post
    const newPostRef = firebase.database().ref("posts").push();
    newPostRef
      .set({
        userId: currentUser.uid,
        content: content,
        timestamp: timestamp, // Use server timestamp for accurate ordering
      })
      .then(() => {
        console.log("Post created successfully.");
        postInput.value = "";
        if (postButton) postButton.disabled = true;

        // Collapse expanded post area
        const expandedPostArea = document.getElementById("expanded-post-area");
        if (expandedPostArea) {
          expandedPostArea.classList.remove("ursac-expanded");
        }

        // Force refresh posts to ensure new post appears at the top
        loadPosts();
      })
      .catch((error) => {
        console.error("Error creating post:", error);
        alert("Failed to create post: " + error.message);
        if (postButton) postButton.disabled = false;
      });
  }
}

// Update the Firebase query to ensure we're getting the most recent posts
// This is an alternative implementation that uses limitToLast with orderByChild
function loadPostsAlternative() {
  // Remove any existing listener to prevent duplicates
  if (postsListener) {
    const postsRef = firebase.database().ref("posts");
    postsRef.off("value", postsListener);
  }

  const postsRef = firebase.database().ref("posts");
  postsListener = postsRef
    .orderByChild("timestamp") // Order by timestamp
    .limitToLast(50) // Get the last 50 posts (most recent)
    .on(
      "value",
      function (snapshot) {
        const postsData = snapshot.val();
        const postsFeed = document.getElementById("posts-feed");

        if (!postsFeed) {
          console.error("Posts feed element not found");
          return;
        }

        postsFeed.innerHTML = "";

        if (postsData) {
          // Convert to array and sort by timestamp in descending order (newest first)
          const postsArray = Object.entries(postsData)
            .map(([id, post]) => ({
              id,
              ...post,
            }))
            .sort((a, b) => b.timestamp - a.timestamp); // Ensure newest posts are first

          const fragment = document.createDocumentFragment();

          // Process posts in order - newest first
          Promise.all(
            postsArray.map((post) => {
              return firebase
                .database()
                .ref("users/" + post.userId)
                .once("value")
                .then((userSnapshot) => {
                  const userData = userSnapshot.val();
                  const postElement = createPostElement(post, userData);
                  fragment.appendChild(postElement);
                })
                .catch((error) => {
                  console.error("Error loading user data for post:", error);
                });
            })
          ).then(() => {
            // Clear the feed and add all posts
            postsFeed.innerHTML = "";
            postsFeed.appendChild(fragment);
          });
        } else {
          postsFeed.innerHTML = `
            <div class="ursac-post-card">
              <div class="ursac-post-content" style="text-align: center;">
                No posts yet. Be the first to post something!
              </div>
            </div>
          `;
        }
        postsLoaded = true;
      },
      function (error) {
        console.error("Error loading posts:", error);
      }
    );
}

function countLikes(likes) {
  if (!likes) return 0;
  return Object.keys(likes).length;
}

function countComments(comments) {
  if (!comments) return 0;
  return Object.keys(comments).length;
}

function likePost(postId) {
  if (!currentUser) {
    alert("You must be logged in to like a post.");
    return;
  }

  const postRef = firebase.database().ref(`posts/${postId}/likes/${currentUser.uid}`);

  // First, check if the post belongs to someone else (to avoid self-notifications)
  firebase.database().ref(`posts/${postId}`).once("value").then(function(postSnapshot) {
    const postData = postSnapshot.val();
    if (!postData) return;

    // Don't notify if liking your own post
    const shouldNotify = postData.userId !== currentUser.uid;

    postRef.once("value").then(function (snapshot) {
      if (snapshot.exists()) {
        // User is unliking the post
        postRef.remove().then(() => {
          console.log("Post unliked successfully.");
        }).catch((error) => {
          console.error("Error unliking post:", error);
        });
      } else {
        // User is liking the post
        postRef.set(true).then(() => {
          console.log("Post liked successfully.");

          // Add notification if it's not the user's own post
          if (shouldNotify) {
            // Store notification under recipient's notifications
            const notifRef = firebase.database().ref(`notifications/${postData.userId}`).push();
            notifRef.set({
              type: "like",
              userId: currentUser.uid,
              postId: postId,
              timestamp: firebase.database.ServerValue.TIMESTAMP,
              read: false
            });
          }
        }).catch((error) => {
          console.error("Error liking post:", error);
        });
      }
    });
  });
}

// Updated commentPost function to ensure notifications are properly created
function commentPost(postId, commentText, mediaFile = null, parentCommentId = null) {
  if (!currentUser) {
    alert("You must be logged in to comment on a post.");
    return Promise.reject(new Error("Not logged in"));
  }

  // Create a reference for the new comment
  const commentRef = firebase.database().ref(`posts/${postId}/comments`).push();
  const commentId = commentRef.key;

  return firebase.database().ref(`users/${currentUser.uid}`).once('value')
    .then(function(userSnapshot) {
      const userData = userSnapshot.val();

      // Create comment data object
      const commentData = {
        id: commentId,
        userId: currentUser.uid,
        userFirstName: userData.firstName,
        userLastName: userData.lastName,
        text: commentText,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      };

      // If this is a reply to another comment, add the parent comment ID
      if (parentCommentId) {
        commentData.parentCommentId = parentCommentId;
      }

      // Add media data if available
      if (mediaFile) {
        return uploadMedia(mediaFile.file, mediaFile.type)
          .then(mediaData => {
            commentData.mediaURL = mediaData.url;
            commentData.mediaType = mediaData.type;
            commentData.mediaName = mediaData.name;
            commentData.mediaSize = mediaData.size;
            return commentData;
          });
      } else {
        return commentData;
      }
    })
    .then((commentData) => {
      // Save the comment to the posts node
      return commentRef.set(commentData)
        .then(() => commentData);
    })
    .then((commentData) => {
      // Get post data to check if we need to create a notification
      return firebase.database().ref(`posts/${postId}`).once('value')
        .then(postSnapshot => {
          const postData = postSnapshot.val();

          // Update comment count in the UI
          const postCard = document.querySelector(`[data-post-id="${postId}"]`);
          if (postCard) {
            const commentCount = postCard.querySelector('.comment-count');
            if (commentCount) {
              const currentCount = parseInt(commentCount.textContent) || 0;
              commentCount.textContent = currentCount + 1;
            }
          }

          // Don't create notification if commenting on own post
          if (postData && postData.userId !== currentUser.uid) {
            // Create notification for post owner
            const notifRef = firebase.database().ref(`notifications/${postData.userId}`).push();
            return notifRef.set({
              type: "comment",
              userId: currentUser.uid,
              postId: postId,
              commentId: commentData.id,
              commentText: commentText,
              timestamp: firebase.database.ServerValue.TIMESTAMP,
              read: false
            });
          }

          // If this is a reply to another comment, also notify the comment owner
          if (parentCommentId && postData && postData.comments && postData.comments[parentCommentId]) {
            const parentComment = postData.comments[parentCommentId];

            // Don't notify if replying to your own comment
            if (parentComment.userId !== currentUser.uid) {
              const replyNotifRef = firebase.database().ref(`notifications/${parentComment.userId}`).push();
              return replyNotifRef.set({
                type: "reply",
                userId: currentUser.uid,
                postId: postId,
                commentId: commentData.id,
                parentCommentId: parentCommentId,
                commentText: commentText,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                read: false
              });
            }
          }

          return Promise.resolve();
        });
    })
    .catch((error) => {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
      throw error;
    });
}

// New function to reply to a comment
function replyToComment(postId, parentCommentId, replyText, mediaFile = null) {
  return commentPost(postId, replyText, mediaFile, parentCommentId);
}

function sharePost(postId) {
  if (!currentUser) {
    alert("You must be logged in to share a post.");
    return;
  }
  firebase.database().ref(`posts/${postId}`).once("value").then(function (snapshot) {
    const postData = snapshot.val();
    if (!postData) {
      alert("Post not found.");
      return;
    }
    const sharedContent = `Shared from ${postData.userId}: ${postData.content}`;
    const newPostRef = firebase.database().ref("posts").push();
    const newPostData = {
      userId: currentUser.uid,
      content: sharedContent,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    };
    if (postData.mediaURL) {
      newPostData.mediaURL = postData.mediaURL;
      newPostData.mediaType = postData.mediaType;
      newPostData.mediaName = postData.mediaName;
      newPostData.mediaSize = postData.mediaSize;
    }
    newPostRef.set(newPostData).then(function () {
      console.log("Post shared successfully with ID:", newPostRef.key);
      alert("Post shared successfully!");
    }).catch(function (error) {
      console.error("Error sharing post:", error);
      alert("Failed to share post: " + error.message);
    });
  });
}

function searchPosts(query) {
  const postsFeed = document.getElementById("posts-feed");
  if (!postsFeed) return;

  const allPosts = Array.from(postsFeed.getElementsByClassName("ursac-post-card"));

  // Filter posts based on the query
  allPosts.forEach((postElement) => {
    const postContent = postElement
      .querySelector(".ursac-post-content")
      ?.textContent.toLowerCase() || "";

    if (postContent.includes(query.toLowerCase())) {
      postElement.style.display = "block"; // Show matching posts
    } else {
      postElement.style.display = "none"; // Hide non-matching posts
    }
  });
}

function loadFriends() {
  // Implementation for loading friends
}

function setupEventListeners() {
  const postInput = document.getElementById("post-input");
  const postButton = document.getElementById("post-button");
  const filePhoto = document.getElementById("file-photo");
  const fileVideo = document.getElementById("file-video");
  const fileAttachment = document.getElementById("file-attachment");
  const expandedPostArea = document.getElementById("expanded-post-area");

  if (postInput) {
    postInput.addEventListener("click", function () {
      if (expandedPostArea) {
        expandedPostArea.classList.add("ursac-expanded");
      }
    });

    postInput.addEventListener("input", function () {
      updatePostButton();
    });
  }

  document.addEventListener("click", function (event) {
    if (
      expandedPostArea &&
      expandedPostArea.classList.contains("ursac-expanded") &&
      !event.target.closest(".ursac-create-post") &&
      event.target !== postInput
    ) {
      expandedPostArea.classList.remove("ursac-expanded");
    }
  });

  // Prevent duplication by removing the button and creating a new one with a single event listener
  if (postButton) {
    // Remove any existing click listeners by cloning and replacing the button
    const newPostButton = postButton.cloneNode(true);
    postButton.parentNode.replaceChild(newPostButton, postButton);

    // Add a single click listener to the new button
    newPostButton.addEventListener("click", function () {
      if (!this.disabled) {
        createPost();
      }
    });
  }

  if (filePhoto) {
    filePhoto.addEventListener("change", function (e) {
      handleFileSelect(e, "image");
    });
  }

  if (fileVideo) {
    fileVideo.addEventListener("change", function (e) {
      handleFileSelect(e, "video");
    });
  }

  if (fileAttachment) {
    fileAttachment.addEventListener("change", function (e) {
      handleFileSelect(e, "file");
    });
  }

  const tabs = document.querySelectorAll(".ursac-tab");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        t.classList.remove("ursac-tab-active");
      });
      this.classList.add("ursac-tab-active");
    });
  });
}

function handleFileSelect(event, type) {
  const file = event.target.files[0];
  if (!file) return;

  clearMediaPreview();
  selectedMedia = {
    file: file,
    type: type,
    name: file.name,
    size: formatFileSize(file.size),
  };

  const mediaPreview = document.getElementById("media-preview");
  if (!mediaPreview) return;

  const previewItem = document.createElement("div");
  previewItem.className = "ursac-preview-item";

  if (type === "image") {
    const reader = new FileReader();
    reader.onload = function (e) {
      previewItem.innerHTML = `
        <img src="${e.target.result}" alt="Selected image">
        <div class="ursac-preview-remove" onclick="clearMediaPreview()">
          <i class="fas fa-times"></i>
        </div>
      `;
      mediaPreview.appendChild(previewItem);
    };
    reader.readAsDataURL(file);
  } else if (type === "video") {
    const reader = new FileReader();
    reader.onload = function (e) {
      previewItem.innerHTML = `
        <video controls>
          <source src="${e.target.result}" type="${file.type}">
          Your browser does not support the video tag.
        </video>
        <div class="ursac-preview-remove" onclick="clearMediaPreview()">
          <i class="fas fa-times"></i>
        </div>
      `;
      mediaPreview.appendChild(previewItem);
    };
    reader.readAsDataURL(file);
  } else if (type === "file") {
    previewItem.innerHTML = `
      <div class="ursac-preview-file">
        <i class="fas fa-file"></i>
        <span>${file.name}</span>
      </div>
      <div class="ursac-preview-remove" onclick="clearMediaPreview()">
        <i class="fas fa-times"></i>
      </div>
    `;
    mediaPreview.appendChild(previewItem);
  }

  updatePostButton();
  const expandedPostArea = document.getElementById("expanded-post-area");
  if (expandedPostArea) {
    expandedPostArea.classList.add("ursac-expanded");
  }
}

function clearMediaPreview() {
  const mediaPreview = document.getElementById("media-preview");
  if (mediaPreview) {
    mediaPreview.innerHTML = "";
  }
  selectedMedia = null;

  const filePhoto = document.getElementById("file-photo");
  const fileVideo = document.getElementById("file-video");
  const fileAttachment = document.getElementById("file-attachment");

  if (filePhoto) filePhoto.value = "";
  if (fileVideo) fileVideo.value = "";
  if (fileAttachment) fileAttachment.value = "";

  updatePostButton();
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// First, let's complete the updatePostButton function that was cut off
function updatePostButton() {
  const postInput = document.getElementById("post-input");
  const postButton = document.getElementById("post-button");

  if (postInput && postButton) {
    // Enable post button if there's text content or media selected
    postButton.disabled = postInput.value.trim() === "" && !selectedMedia;
  }
}

// This function should be updated to create post elements with thumbs up instead of heart
function createPostElement(post, userData) {
  const postId = post.id;
  const postTimestamp = new Date(post.timestamp);
  const timeAgo = formatTimeAgo(postTimestamp);
  const hasLiked = post.likes && post.likes[currentUser?.uid] === true;
  const likesCount = countLikes(post.likes);
  const commentsCount = countComments(post.comments);

  // Create post card element
  const postCard = document.createElement("div");
  postCard.className = "ursac-post-card";
  postCard.setAttribute("data-post-id", postId);
  postCard.setAttribute("data-user-id", post.userId);

  // Get user initials for avatar
  const userInitials = getInitials(userData?.firstName, userData?.lastName);
  const userName = userData ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim() : "Unknown User";

  // Create post HTML structure
  let postHTML = `
    <div class="ursac-post-header">
      <div class="ursac-profile-avatar">
        <span>${userInitials}</span>
      </div>
      <div class="ursac-post-meta">
        <div class="ursac-post-author">${userName}</div>
        <div class="ursac-post-time">${timeAgo}</div>
      </div>
    </div>
    <div class="ursac-post-content">
      ${post.content ? `<p>${linkifyText(post.content)}</p>` : ''}
  `;

  // Add media content if available
  if (post.mediaURL) {
    if (post.mediaType === "image") {
      postHTML += `
        <div class="ursac-post-media">
          <img src="${post.mediaURL}" alt="Post image" loading="lazy">
        </div>
      `;
    } else if (post.mediaType === "video") {
      postHTML += `
        <div class="ursac-post-media">
          <video controls>
            <source src="${post.mediaURL}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
      `;
    } else if (post.mediaType === "file") {
      postHTML += `
        <div class="ursac-post-attachment">
          <a href="${post.mediaURL}" target="_blank" class="ursac-attachment-link">
            <i class="fas fa-paperclip"></i>
            <span>${post.mediaName || "Attachment"}</span>
            ${post.mediaSize ? `<small>(${post.mediaSize})</small>` : ''}
          </a>
        </div>
      `;
    }
  }

  // Add post actions (changed heart to thumbs up)
  postHTML += `
    </div>
    <div class="ursac-post-footer">
      <div class="ursac-post-stat" onclick="likePost('${postId}')">
        <i class="${hasLiked ? 'fas' : 'far'} fa-thumbs-up"></i>
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
          <span>${getInitials(currentUser?.displayName || '', '')}</span>
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
  `;

  postCard.innerHTML = postHTML;
  return postCard;
}

// Helper function to format text with links
function linkifyText(text) {
  if (!text) return '';
  // Simple regex to convert URLs to clickable links
  return text.replace(
    /(https?:\/\/[^\s]+)/g, 
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
}

// Helper function to format timestamp to readable time
function formatTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

// Function to toggle comments visibility
function toggleComments(element) {
  const postCard = element.closest('.ursac-post-card');
  if (!postCard) return;

  const commentsSection = postCard.querySelector('.ursac-post-comments');
  if (commentsSection) {
    const isVisible = commentsSection.style.display === 'block';
    commentsSection.style.display = isVisible ? 'none' : 'block';

    // Load comments if section is being displayed
    if (!isVisible) {
      const postId = postCard.getAttribute('data-post-id');
      if (postId) {
        loadComments(postId);
      }
    }
  }
}

// Updated function to load comments for a post, including replies
function loadComments(postId) {
  const postCard = document.querySelector(`[data-post-id="${postId}"]`);
  if (!postCard) return;

  const commentsList = postCard.querySelector('.ursac-comments-list');
  if (!commentsList) return;

  commentsList.innerHTML = '<div class="ursac-loading">Loading comments...</div>';

  firebase.database().ref(`posts/${postId}/comments`).once('value')
    .then(function (snapshot) {
      const comments = snapshot.val();
      commentsList.innerHTML = '';

      if (comments) {
        // Convert to array and sort by timestamp
        const commentsArray = Object.entries(comments)
          .map(([id, comment]) => ({
            id,
            ...comment,
          }))
          .sort((a, b) => a.timestamp - b.timestamp);

        // Create a map of comments by ID for easy lookup
        const commentMap = {};
        commentsArray.forEach(comment => {
          commentMap[comment.id] = comment;
        });

        // Create a nested structure for comments and replies
        const nestedComments = [];
        commentsArray.forEach(comment => {
          if (comment.parentCommentId) {
            // This is a reply, add it to its parent's replies array
            const parent = commentMap[comment.parentCommentId];
            if (parent) {
              parent.replies = parent.replies || [];
              parent.replies.push(comment);
            }
          } else {
            // This is a top-level comment
            nestedComments.push(comment);
          }
        });

        // Render the nested comments
        nestedComments.forEach(comment => {
          const commentElement = createCommentElement(comment, postId);
          commentsList.appendChild(commentElement);
        });
      } else {
        commentsList.innerHTML = '<div class="ursac-no-comments">No comments yet. Be the first to comment!</div>';
      }
    })
    .catch(function (error) {
      console.error("Error loading comments:", error);
      commentsList.innerHTML = '<div class="ursac-error">Failed to load comments.</div>';
    });
}

// Updated function to create a comment element with nested replies
function createCommentElement(comment, postId, depth = 0) {
  const wrapper = document.createElement('div');
  wrapper.className = 'ursac-comment-thread';

  const commentElement = document.createElement('div');
  commentElement.className = 'ursac-comment';
  commentElement.setAttribute('data-comment-id', comment.id);

  const commentUserInitials = getInitials(comment.userFirstName || '', comment.userLastName || '');
  const commentUserName = `${comment.userFirstName || ''} ${comment.userLastName || ''}`.trim();

  let commentHTML = `
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
  `;

  commentElement.innerHTML = commentHTML;
  wrapper.appendChild(commentElement);

  // Add reply input container right after the comment
  const replyContainer = document.createElement('div');
  replyContainer.className = 'ursac-reply-input-container';
  replyContainer.style.display = 'none';
  replyContainer.setAttribute('data-for-comment', comment.id);
  replyContainer.innerHTML = `
    <div class="ursac-comment-input-wrapper">
      <div class="ursac-comment-avatar">
        <span>${getInitials(currentUser?.displayName || '', '')}</span>
      </div>
      <div class="ursac-comment-input-container">
        <input type="text" class="ursac-reply-input" placeholder="Write a reply...">
        <button class="ursac-reply-submit" onclick="submitReply('${postId}', '${comment.id}')">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  `;

  wrapper.appendChild(replyContainer);

  // Handle replies if they exist
  if (comment.replies && comment.replies.length > 0) {
    const repliesContainer = document.createElement('div');
    repliesContainer.className = 'ursac-reply-container';

    comment.replies.forEach(reply => {
      const replyElement = createCommentElement(reply, postId, depth + 1);
      repliesContainer.appendChild(replyElement);
    });

    wrapper.appendChild(repliesContainer);
  }

  return wrapper;
}

// Update the showReplyInput function to include event listeners for the input
function showReplyInput(postId, commentId, asOwner = false) {
  // First hide all other reply inputs
  document.querySelectorAll('.ursac-reply-input-container').forEach(container => {
    container.style.display = 'none';
  });

  // Find the comment element
  const comment = document.querySelector(`.ursac-comment[data-comment-id="${commentId}"]`);
  if (!comment) return;

  // Find the comment thread (parent container)
  const commentThread = comment.closest('.ursac-comment-thread');
  if (!commentThread) return;

  // Find the reply container
  const replyContainer = commentThread.querySelector(`.ursac-reply-input-container[data-for-comment="${commentId}"]`);
  if (replyContainer) {
    // Show the reply container
    replyContainer.style.display = 'block';

    // Focus the input field
    const replyInput = replyContainer.querySelector('.ursac-reply-input');
    if (replyInput) {
      replyInput.focus();

      // Add post owner prefix if needed
      if (asOwner) {
        replyInput.value = '[Post Owner] ';
        replyInput.setSelectionRange(replyInput.value.length, replyInput.value.length);
      }

      // Add enter key event listener
      replyInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const replyText = this.value.trim();
          if (replyText) {
            submitReply(postId, commentId);
          }
        }
      });

      // Enable/disable submit button based on input
      replyInput.addEventListener('input', function() {
        const submitBtn = replyContainer.querySelector('.ursac-reply-submit');
        if (submitBtn) {
          submitBtn.disabled = this.value.trim().length === 0;
        }
      });
    }
  }
}

// Update the submitReply function to properly handle the submission
function submitReply(postId, parentCommentId) {
  if (!currentUser) {
    alert("You must be logged in to reply.");
    return;
  }

  const commentThread = document.querySelector(`.ursac-comment[data-comment-id="${parentCommentId}"]`)?.closest('.ursac-comment-thread');
  if (!commentThread) return;

  const replyContainer = commentThread.querySelector(`.ursac-reply-input-container[data-for-comment="${parentCommentId}"]`);
  if (!replyContainer) return;

  const replyInput = replyContainer.querySelector('.ursac-reply-input');
  if (!replyInput) return;

  const replyText = replyInput.value.trim();
  if (!replyText) return;

  // Disable input and button while submitting
  replyInput.disabled = true;
  const submitBtn = replyContainer.querySelector('.ursac-reply-submit');
  if (submitBtn) submitBtn.disabled = true;

  // Submit the reply to Firebase
  replyToComment(postId, parentCommentId, replyText)
    .then(() => {
      // Clear and reset the input
      replyInput.value = '';
      replyInput.disabled = false;
      if (submitBtn) submitBtn.disabled = true;
      
      // Hide the reply container
      replyContainer.style.display = 'none';

      // Reload comments to show the new reply
      loadComments(postId);
    })
    .catch(error => {
      console.error("Error posting reply:", error);
      alert("Failed to post reply. Please try again.");
      replyInput.disabled = false;
      if (submitBtn) submitBtn.disabled = false;
    });
}

// Function to show reply input
function showReplyInput(postId, commentId, asOwner = false) {
  // First hide all other reply inputs
  document.querySelectorAll('.ursac-reply-input-container').forEach(container => {
    container.style.display = 'none';
  });

  // Find the comment element
  const comment = document.querySelector(`.ursac-comment[data-comment-id="${commentId}"]`);
  if (!comment) return;

  // Find the comment thread (parent container)
  const commentThread = comment.closest('.ursac-comment-thread');
  if (!commentThread) return;

  // Find the reply container
  const replyContainer = commentThread.querySelector(`.ursac-reply-input-container[data-for-comment="${commentId}"]`);
  if (replyContainer) {
    // Show the reply container
    replyContainer.style.display = 'block';

    // Focus the input field
    const replyInput = replyContainer.querySelector('.ursac-reply-input');
    if (replyInput) {
      replyInput.focus();

      // Add post owner prefix if needed
      if (asOwner) {
        replyInput.value = '[Post Owner] ';
        replyInput.setSelectionRange(replyInput.value.length, replyInput.value.length);
      }
    }
  }
}

// Initialize comment input listeners
function initializeCommentListeners() {
  // Use event delegation for comment inputs
  document.addEventListener('input', function(e) {
    if (e.target.matches('.ursac-comment-input')) {
      const input = e.target;
      const button = input.nextElementSibling;
      if (button) {
        button.disabled = input.value.trim().length === 0;
      }
    }

    if (e.target.matches('.ursac-reply-input')) {
      const input = e.target;
      const button = input.nextElementSibling;
      if (button) {
        button.disabled = input.value.trim().length === 0;
      }
    }
  });

  // Use event delegation for comment inputs (for Enter key)
  document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.target.matches('.ursac-comment-input')) {
      const input = e.target;
      const button = input.nextElementSibling;
      if (button && !button.disabled) {
        button.click();
      }
    }

    if (e.key === 'Enter' && e.target.matches('.ursac-reply-input')) {
      const input = e.target;
      const button = input.nextElementSibling;
      if (button && !button.disabled) {
        button.click();
      }
    }
  });
}

// Function to create a post
function createPost() {
  if (!currentUser) {
    alert("You must be logged in to post.");
    return;
  }

  const postInput = document.getElementById("post-input");
  if (!postInput) return;

  const content = postInput.value.trim();
  if (!content && !selectedMedia) {
    alert("Please enter some content or add media to your post.");
    return;
  }

  const postButton = document.getElementById("post-button");
  if (postButton) postButton.disabled = true;

  // Current timestamp to ensure proper ordering
  const timestamp = firebase.database.ServerValue.TIMESTAMP;

  // If there is media, upload it first
  if (selectedMedia) {
    uploadMedia(selectedMedia.file, selectedMedia.type)
      .then((mediaData) => {
        const newPostRef = firebase.database().ref("posts").push();
        return newPostRef.set({
          userId: currentUser.uid,
          content: content,
          timestamp: timestamp,
          mediaURL: mediaData.url,
          mediaType: mediaData.type,
          mediaName: mediaData.name,
          mediaSize: mediaData.size,
        });
      })
      .then(() => {
        console.log("Post with media created successfully.");
        postInput.value = "";
        clearMediaPreview();
        if (postButton) postButton.disabled = true;

        // Collapse expanded post area
        const expandedPostArea = document.getElementById("expanded-post-area");
        if (expandedPostArea) {
          expandedPostArea.classList.remove("ursac-expanded");
        }
      })
      .catch((error) => {
        console.error("Error creating post with media:", error);
        alert("Failed to create post: " + error.message);
        if (postButton) postButton.disabled = false;
      });
  } else {
    // No media, just create the post
    const newPostRef = firebase.database().ref("posts").push();
    newPostRef
      .set({
        userId: currentUser.uid,
        content: content,
        timestamp: timestamp,
      })
      .then(() => {
        console.log("Post created successfully.");
        postInput.value = "";
        if (postButton) postButton.disabled = true;

        // Collapse expanded post area
        const expandedPostArea = document.getElementById("expanded-post-area");
        if (expandedPostArea) {
          expandedPostArea.classList.remove("ursac-expanded");
        }
      })
      .catch((error) => {
        console.error("Error creating post:", error);
        alert("Failed to create post: " + error.message);
        if (postButton) postButton.disabled = false;
      });
  }
}

// Function to upload media
function uploadMedia(file, type) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    // Show upload modal and progress
    const uploadModal = document.getElementById("upload-modal");
    const uploadProgress = document.getElementById("upload-progress");
    const uploadStatus = document.getElementById("upload-status");

    if (uploadModal) uploadModal.style.display = "flex";
    if (uploadStatus) uploadStatus.textContent = "0%";
    if (uploadProgress) uploadProgress.style.width = "0%";

    // Create storage reference
    const storageRef = firebase.storage().ref();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;

    // Choose appropriate folder based on file type
    let fileRef;
    if (type === "image") {
      fileRef = storageRef.child(`images/${fileName}`);
    } else if (type === "video") {
      fileRef = storageRef.child(`videos/${fileName}`);
    } else {
      fileRef = storageRef.child(`files/${fileName}`);
    }

    // Upload the file
    const uploadTask = fileRef.put(file);

    // Monitor upload progress
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (uploadProgress) uploadProgress.style.width = progress + "%";
        if (uploadStatus) uploadStatus.textContent = `${Math.round(progress)}%`;
      },
      (error) => {
        console.error("Upload failed:", error);
        if (uploadModal) uploadModal.style.display = "none";
        reject(error);
      },
      () => {
        // Upload completed successfully
        uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
          if (uploadStatus) uploadStatus.textContent = "Upload complete!";

          // Hide modal after a short delay
          setTimeout(() => {
            if (uploadModal) uploadModal.style.display = "none";
          }, 1000);

          // Resolve with media data
          resolve({
            url: downloadURL,
            type: type,
            name: file.name,
            size: formatFileSize(file.size)
          });
        });
      }
    );
  });
}

// Call setupEventListeners when the page loads
document.addEventListener('DOMContentLoaded', setupEventListeners);

// Make sure these functions are available globally
window.likePost = likePost;
window.toggleComments = toggleComments;
window.sharePost = sharePost;
window.clearMediaPreview = clearMediaPreview;
window.handleCommentInput = handleCommentInput;
window.showReplyInput = showReplyInput;
window.submitReply = submitReply;
window.submitComment = function(postId) {
  const postCard = document.querySelector(`[data-post-id="${postId}"]`);
  if (!postCard) return;

  const input = postCard.querySelector('.ursac-comment-input');
  if (!input) return;

  const commentText = input.value.trim();
  if (!commentText) return;

  // Disable input while submitting
  input.disabled = true;
  const submitBtn = input.nextElementSibling;
  if (submitBtn) submitBtn.disabled = true;

  commentPost(postId, commentText)
    .then(() => {
      input.value = '';
      input.disabled = false;
      if (submitBtn) submitBtn.disabled = true;
      loadComments(postId);
    })
    .catch(error => {
      console.error("Error posting comment:", error);
      input.disabled = false;
      if (submitBtn) submitBtn.disabled = true;
    });
};

// Initialize notifications when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Initial load of notifications
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      currentUser = user;
      loadNotifications();
    }
  });
});

// Add CSS for comments and replies
function addCommentStyles() {
  const style = document.createElement('style');
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
  `;
  document.head.appendChild(style);
}

// Add CSS for styling the comments and replies
function addCommentStylesLegacy() {
  const style = document.createElement('style');
  style.textContent = `
    .ursac-comments-list {
      margin-top: 15px;
    }
    
    .ursac-loading {
      text-align: center;
      padding: 10px;
      color: #777;
    }
    
    .ursac-no-comments {
      text-align: center;
      padding: 15px;
      color: #777;
      font-style: italic;
    }
    
    .ursac-error {
      text-align: center;
      padding: 10px;
      color: #e74c3c;
    }
    
    .ursac-comment-input-wrapper {
      display: flex;
      align-items: flex-start;
      margin-bottom: 10px;
      padding: 10px;
      background-color: #f9f9f9;
      border-radius: 8px;
    }
    
    .ursac-comment-input-container {
      display: flex;
      flex: 1;
      position: relative;
    }
    
    .ursac-comment-input, .ursac-reply-input {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 20px;
      padding: 8px 12px;
      padding-right: 40px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    
    .ursac-comment-input:focus, .ursac-reply-input:focus {
      border-color: #4a76a8;
    }
    
    .ursac-comment-submit, .ursac-reply-submit {
      position: absolute;
      right: 5px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #4a76a8;
      cursor: pointer;
      padding: 5px;
    }
    
    .ursac-comment-submit:disabled, .ursac-reply-submit:disabled {
      color: #ccc;
      cursor: not-allowed;
    }
    
    .ursac-comment-media {
      margin-top: 10px;
      max-width: 100%;
    }
    
    .ursac-comment-media img {
      max-width: 200px;
      max-height: 150px;
      border-radius: 8px;
    }
    
    .ursac-comment-attachment {
      margin-top: 10px;
    }
    
    .ursac-comment-attachment a {
      display: inline-flex;
      align-items: center;
      padding: 5px 10px;
      background-color: #f1f1f1;
      border-radius: 4px;
      text-decoration: none;
      color: #333;
    }
    
    .ursac-comment-attachment a i {
      margin-right: 5px;
    }
    
    .ursac-post-owner-badge {
      display: inline-block;
      background-color: #4a76a8;
      color: white;
      font-size: 10px;
      padding: 2px 5px;
      border-radius: 3px;
      margin-left: 5px;
      vertical-align: middle;
    }
    
    .ursac-reply-cancel {
      background: none;
      border: none;
      color: #777;
      cursor: pointer;
      margin-left: 5px;
    }
    
    .ursac-reply-options {
      display: flex;
      gap: 10px;
      margin-top: 5px;
    }
    
    .ursac-reply-options button {
      background: none;
      border: none;
      font-size: 12px;
      cursor: pointer;
      padding: 0;
    }
    
    .ursac-reply-options .reply-normal {
      color: #4a76a8;
    }
    
    .ursac-reply-options .reply-as-owner {
      color: #e74c3c;
    }
  `;
  document.head.appendChild(style);
}

// Function to handle comment media uploads
function handleCommentMediaUpload(postId, commentInput) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) {
      document.body.removeChild(fileInput);
      return;
    }

    // Create a preview of the selected image
    const previewContainer = document.createElement('div');
    previewContainer.className = 'ursac-comment-media-preview';
    previewContainer.style.marginTop = '10px';

    const reader = new FileReader();
    reader.onload = function(e) {
      previewContainer.innerHTML = `
        <img src="${e.target.result}" style="max-width: 100px; max-height: 100px; border-radius: 4px;">
        <button class="ursac-remove-media" style="background: none; border: none; color: #e74c3c; cursor: pointer; margin-left: 5px;">
          <i class="fas fa-times"></i>
        </button>
      `;

      // Add the preview after the comment input
      const inputContainer = commentInput.closest('.ursac-comment-input-container');
      inputContainer.parentNode.insertBefore(previewContainer, inputContainer.nextSibling);

      // Add event listener to remove button
      previewContainer.querySelector('.ursac-remove-media').addEventListener('click', function() {
        previewContainer.remove();
        commentInput.dataset.mediaFile = '';
      });
    };
    reader.readAsDataURL(file);

    // Store the file in the input's dataset for later use
    commentInput.dataset.mediaFile = JSON.stringify({
      file: file,
      type: 'image',
      name: file.name,
      size: file.size
    });

    document.body.removeChild(fileInput);
  });

  fileInput.click();
}

// Function to submit a comment with media
function submitCommentWithMedia(postId) {
  const postCard = document.querySelector(`[data-post-id="${postId}"]`);
  if (!postCard) return;

  const input = postCard.querySelector('.ursac-comment-input');
  if (!input) return;

  const commentText = input.value.trim();
  if (!commentText) return;

  // Disable input while submitting
  input.disabled = true;
  const submitBtn = input.nextElementSibling;
  if (submitBtn) submitBtn.disabled = true;

  // Check if there's media attached
  let mediaFile = null;
  if (input.dataset.mediaFile) {
    try {
      mediaFile = JSON.parse(input.dataset.mediaFile);
    } catch (e) {
      console.error("Error parsing media file data:", e);
    }
  }

  commentPost(postId, commentText, mediaFile)
    .then(() => {
      input.value = '';
      input.disabled = false;
      input.dataset.mediaFile = '';
      if (submitBtn) submitBtn.disabled = true;

      // Remove any media preview
      const mediaPreview = postCard.querySelector('.ursac-comment-media-preview');
      if (mediaPreview) mediaPreview.remove();

      // Reload comments to show the new comment
      loadComments(postId);
    })
    .catch(error => {
      console.error("Error posting comment:", error);
      input.disabled = false;
      if (submitBtn) submitBtn.disabled = true;
    });
}

// Function to handle mentions in comments
function handleMentions(text, postId) {
  // Simple regex to find @username mentions
  const mentionRegex = /@(\w+)/g;
  const mentions = text.match(mentionRegex);

  if (!mentions || !mentions.length) return Promise.resolve();

  // Get unique usernames (without the @)
  const usernames = [...new Set(mentions.map(m => m.substring(1)))];

  // Find users by username and create notifications
  const promises = usernames.map(username => {
    return firebase.database().ref('users')
      .orderByChild('username')
      .equalTo(username)
      .once('value')
      .then(snapshot => {
        if (snapshot.exists()) {
          snapshot.forEach(childSnapshot => {
            const userId = childSnapshot.key;

            // Don't notify yourself
            if (userId === currentUser.uid) return;

            // Create a mention notification
            const notifRef = firebase.database().ref(`notifications/${userId}`).push();
            return notifRef.set({
              type: "mention",
              userId: currentUser.uid,
              postId: postId,
              mentionText: text,
              timestamp: firebase.database.ServerValue.TIMESTAMP,
              read: false
            });
          });
        }
      });
  });

  return Promise.all(promises);
}

// Function to check if a user is mentioned in a comment
function isUserMentioned(text, userId) {
  // Get the username for the user ID
  return firebase.database().ref(`users/${userId}`).once('value')
    .then(snapshot => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.username) {
          const mentionRegex = new RegExp(`@${userData.username}\\b`, 'i');
          return mentionRegex.test(text);
        }
      }
      return false;
    });
}

// Function to get user data by ID
function getUserData(userId) {
  return firebase.database().ref(`users/${userId}`).once('value')
    .then(snapshot => {
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    });
}

// Function to format mentions in text with links
function formatMentions(text) {
  // Replace @username with linked username
  return text.replace(/@(\w+)/g, '<a href="#" class="ursac-mention">@$1</a>');
}

// Function to add emoji picker to comment input
function addEmojiPicker(inputElement) {
  // Create emoji button
  const emojiButton = document.createElement('button');
  emojiButton.type = 'button';
  emojiButton.className = 'ursac-emoji-button';
  emojiButton.innerHTML = '<i class="far fa-smile"></i>';
  emojiButton.style.position = 'absolute';
  emojiButton.style.right = '40px';
  emojiButton.style.top = '50%';
  emojiButton.style.transform = 'translateY(-50%)';
  emojiButton.style.background = 'none';
  emojiButton.style.border = 'none';
  emojiButton.style.color = '#777';
  emojiButton.style.cursor = 'pointer';

  // Add emoji button next to input
  const inputContainer = inputElement.parentNode;
  inputContainer.insertBefore(emojiButton, inputElement.nextSibling);

  // Common emojis
  const commonEmojis = ['😊', '👍', '❤️', '😂', '🎉', '👏', '🙏', '🔥', '😍', '😎'];

  // Create emoji picker
  const emojiPicker = document.createElement('div');
  emojiPicker.className = 'ursac-emoji-picker';
  emojiPicker.style.display = 'none';
  emojiPicker.style.position = 'absolute';
  emojiPicker.style.top = '-80px';
  emojiPicker.style.right = '0';
  emojiPicker.style.background = 'white';
  emojiPicker.style.border = '1px solid #ddd';
  emojiPicker.style.borderRadius = '5px';
  emojiPicker.style.padding = '5px';
  emojiPicker.style.zIndex = '100';
  emojiPicker.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';

  // Add emojis to picker
  commonEmojis.forEach(emoji => {
    const emojiSpan = document.createElement('span');
    emojiSpan.textContent = emoji;
    emojiSpan.style.cursor = 'pointer';
    emojiSpan.style.padding = '5px';
    emojiSpan.style.fontSize = '16px';

    emojiSpan.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      // Insert emoji at cursor position
      const cursorPos = inputElement.selectionStart;
      const textBefore = inputElement.value.substring(0, cursorPos);
      const textAfter = inputElement.value.substring(cursorPos);

      inputElement.value = textBefore + emoji + textAfter;

      // Update cursor position
      const newCursorPos = cursorPos + emoji.length;
      inputElement.setSelectionRange(newCursorPos, newCursorPos);

      // Focus back on input
      inputElement.focus();

      // Hide emoji picker
      emojiPicker.style.display = 'none';

      // Trigger input event to update submit button state
      const event = new Event('input', { bubbles: true });
      inputElement.dispatchEvent(event);
    });

    emojiPicker.appendChild(emojiSpan);
  });

  // Add emoji picker to input container
  inputContainer.appendChild(emojiPicker);

  // Toggle emoji picker on button click
  emojiButton.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();

    const isVisible = emojiPicker.style.display === 'block';
    emojiPicker.style.display = isVisible ? 'none' : 'block';
  });

  // Hide emoji picker when clicking outside
  document.addEventListener('click', function(e) {
    if (!emojiPicker.contains(e.target) && e.target !== emojiButton) {
      emojiPicker.style.display = 'none';
    }
  });
}

// Function to add media button to comment input
function addMediaButton(inputElement, postId) {
  // Create media button
  const mediaButton = document.createElement('button');
  mediaButton.type = 'button';
  mediaButton.className = 'ursac-media-button';
  mediaButton.innerHTML = '<i class="far fa-image"></i>';
  mediaButton.style.position = 'absolute';
  mediaButton.style.right = '70px';
  mediaButton.style.top = '50%';
  mediaButton.style.transform = 'translateY(-50%)';
  mediaButton.style.background = 'none';
  mediaButton.style.border = 'none';
  mediaButton.style.color = '#777';
  mediaButton.style.cursor = 'pointer';

  // Add media button next to input
  const inputContainer = inputElement.parentNode;
  inputContainer.insertBefore(mediaButton, inputElement.nextSibling);

  // Handle media button click
  mediaButton.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();

    // Open file input for image selection
    handleCommentMediaUpload(postId, inputElement);
  });
}

// Function to enhance comment inputs with additional features
function enhanceCommentInputs() {
  // Find all comment inputs
  document.querySelectorAll('.ursac-comment-input').forEach(input => {
    const postCard = input.closest('.ursac-post-card');
    if (postCard) {
      const postId = postCard.getAttribute('data-post-id');
      if (postId) {
        // Add emoji picker
        addEmojiPicker(input);

        // Add media button
        addMediaButton(input, postId);
      }
    }
  });
}

// Call enhanceCommentInputs when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Add comment styles
  addCommentStyles();

  // Initialize comment listeners
  initializeCommentListeners();

  // Enhance comment inputs after a short delay to ensure DOM is ready
  setTimeout(enhanceCommentInputs, 1000);
});

// Function to handle post deletion
function deletePost(postId) {
  if (!currentUser) {
    alert("You must be logged in to delete a post.");
    return;
  }

  // Confirm deletion
  if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
    return;
  }

  // Check if the user is the post owner
  firebase.database().ref(`posts/${postId}`).once('value')
    .then(snapshot => {
      const post = snapshot.val();

      if (!post) {
        alert("Post not found.");
        return;
      }

      if (post.userId !== currentUser.uid) {
        alert("You can only delete your own posts.");
        return;
      }

      // Delete the post
      return firebase.database().ref(`posts/${postId}`).remove();
    })
    .then(() => {
      console.log("Post deleted successfully.");

      // Remove the post from the UI
      const postElement = document.querySelector(`[data-post-id="${postId}"]`);
      if (postElement) {
        postElement.remove();
      }
    })
    .catch(error => {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
    });
}

// Function to handle comment deletion
function deleteComment(postId, commentId) {
  if (!currentUser) {
    alert("You must be logged in to delete a comment.");
    return;
  }

  // Confirm deletion
  if (!confirm("Are you sure you want to delete this comment? This action cannot be undone.")) {
    return;
  }

  // Check if the user is the comment owner or post owner
  Promise.all([
    firebase.database().ref(`posts/${postId}/comments/${commentId}`).once('value'),
    firebase.database().ref(`posts/${postId}`).once('value')
  ])
    .then(([commentSnapshot, postSnapshot]) => {
      const comment = commentSnapshot.val();
      const post = postSnapshot.val();

      if (!comment) {
        alert("Comment not found.");
        return;
      }

      // Allow deletion if user is comment owner or post owner
      if (comment.userId !== currentUser.uid && post.userId !== currentUser.uid) {
        alert("You can only delete your own comments or comments on your posts.");
        return;
      }

      // Delete the comment
      return firebase.database().ref(`posts/${postId}/comments/${commentId}`).remove();
    })
    .then(() => {
      console.log("Comment deleted successfully.");

      // Reload comments to reflect the deletion
      loadComments(postId);
    })
    .catch(error => {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment. Please try again.");
    });
}

// Make additional functions available globally
window.deletePost = deletePost;
window.deleteComment = deleteComment;
window.handleCommentMediaUpload = handleCommentMediaUpload;
window.submitCommentWithMedia = submitCommentWithMedia;

// Add a debugging function to check post timestamps
function debugPostTimestamps() {
  const postsRef = firebase.database().ref("posts");
  postsRef.once("value", function(snapshot) {
    const postsData = snapshot.val();
    if (postsData) {
      const postsArray = Object.entries(postsData)
        .map(([id, post]) => ({
          id,
          timestamp: post.timestamp,
          content: post.content?.substring(0, 20) + "..." || "[No content]"
        }))
        .sort((a, b) => b.timestamp - a.timestamp);

      console.table(postsArray);
      console.log("Posts are sorted by timestamp (newest first)");
    } else {
      console.log("No posts found");
    }
  });
}

// Make the debug function available globally
window.debugPostTimestamps = debugPostTimestamps;

// Call the debug function when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Wait for posts to load, then debug
  setTimeout(debugPostTimestamps, 2000);
});

// Add a visual indicator for new posts
function addNewPostIndicator() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes newPostHighlight {
      0% { background-color: rgba(0, 120, 255, 0.2); }
      100% { background-color: transparent; }
    }
    
    .new-post-highlight {
      animation: newPostHighlight 3s ease-out;
    }
  `;
  document.head.appendChild(style);
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', addNewPostIndicator);

// Update the createPostElement function to add the highlight class to new posts
function highlightNewPosts() {
  // Get the current timestamp
  const now = Date.now();

  // Find all posts
  const posts = document.querySelectorAll('.ursac-post-card');

  posts.forEach(post => {
    // Get the post timestamp from a data attribute
    const timestamp = parseInt(post.getAttribute('data-timestamp'));

    // If the post is less than 5 seconds old, highlight it
    if (timestamp && (now - timestamp < 5000)) {
      post.classList.add('new-post-highlight');
    }
  });
}

// Call this function after posts are loaded
document.addEventListener('DOMContentLoaded', function() {
  // Wait for posts to load, then highlight new ones
  setTimeout(highlightNewPosts, 2000);
});
