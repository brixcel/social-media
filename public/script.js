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

// Move loadUserProfile function here, outside DOMContentLoaded
function loadUserProfile(user) {
  if (!user) {
    console.log("No user provided to loadUserProfile");
    return;
  }

  console.log("Loading profile for user:", user.uid);
  
  firebase.database().ref("users/" + user.uid).once("value")
    .then(function(snapshot) {
      const userData = snapshot.val();
      console.log("User data:", userData);
      
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
      console.log("User is signed in:", user.uid);
      currentUser = user;
      initializeProfileElements(); // Initialize profile elements first
      loadUserProfile(user);      // Load user profile data
      loadPosts();               // Load posts after user is authenticated
      loadNotifications();       // Load notifications after user is authenticated
    } else {
      console.log("No user is signed in");
      window.location.href = '/login';
    }
  });

  // Update loadNotifications function with null checks
  function loadNotifications() {
    if (!currentUser) return;

    const notifBadge = document.querySelector('.ursac-notification-badge');
    if (!notifBadge) return; // Add null check

    const notifRef = firebase.database().ref('notifications');

    notifRef.orderByChild('recipientId')
      .equalTo(currentUser.uid)
      .on('value', function (snapshot) {
        let unreadCount = 0;

        if (snapshot.exists()) {
          snapshot.forEach(childSnapshot => {
            const notification = childSnapshot.val();
            if (notification.items) {
              Object.values(notification.items).forEach(item => {
                if (!item.read) unreadCount++;
              });
            }
          });
        }

        // Update all notification badges with null check
        document.querySelectorAll('.ursac-notification-badge').forEach(badge => {
          if (badge) {
            if (unreadCount > 0) {
              badge.style.display = 'flex';
              badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            } else {
              badge.style.display = 'none';
            }
          }
        });
      });
  }

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
        !userProfileBtn.contains(e.target)) {
        profileDropdown.style.display = 'none';
        const chevron = userProfileBtn.querySelector('.fa-chevron-down');
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

function loadPosts() {
  // Remove any existing listener to prevent duplicates
  if (postsListener) {
    const postsRef = firebase.database().ref("posts");
    postsRef.off("value", postsListener);
  }

  const postsRef = firebase.database().ref("posts");
  postsListener = postsRef
    .orderByChild("timestamp")
    .limitToLast(50) // Limit to last 50 posts for performance
    .on(
      "value",
      function (snapshot) {
        const postsData = snapshot.val();
        const postsFeed = document.getElementById("posts-feed");
        postsFeed.innerHTML = "";

        if (postsData) {
          // Convert to array and sort by timestamp in descending order (newest first)
          const postsArray = Object.entries(postsData)
            .map(([id, post]) => ({
              id,
              ...post,
            }))
            .sort((a, b) => b.timestamp - a.timestamp);

          const fragment = document.createDocumentFragment();
          const loadedPosts = new Set(); // Track loaded posts to prevent duplicates

          // Process posts in order - newest first
          Promise.all(
            postsArray.map((post) => {
              if (loadedPosts.has(post.id)) return Promise.resolve(); // Skip if already loaded
              loadedPosts.add(post.id);

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
            // Check if notifications node exists for this post
            firebase.database().ref(`notifications/${postId}`).once("value").then(function(notifSnapshot) {
              if (!notifSnapshot.exists()) {
                // Create the notifications node first
                firebase.database().ref(`notifications/${postId}`).set({
                  postId: postId,
                  recipientId: postData.userId
                }).then(() => {
                  // Now add the like notification
                  firebase.database().ref(`notifications/${postId}/items`).push({
                    type: "like",
                    userId: currentUser.uid,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    read: false  // Add this line to track read status
                  });
                });
              } else {
                // Notifications node already exists, just add the like
                firebase.database().ref(`notifications/${postId}/items`).push({
                  type: "like",
                  userId: currentUser.uid,
                  timestamp: firebase.database.ServerValue.TIMESTAMP,
                  read: false  // Add this line to track read status
                });
              }
            });
          }
        }).catch((error) => {
          console.error("Error liking post:", error);
        });
      }
    });
  });
}

// Update the existing commentPost function
function commentPost(postId, commentText) {
  if (!currentUser) {
    alert("You must be logged in to comment on a post.");
    return;
  }

  const commentRef = firebase.database().ref(`posts/${postId}/comments`).push();
  
  firebase.database().ref(`users/${currentUser.uid}`).once('value')
    .then(function(userSnapshot) {
      const userData = userSnapshot.val();
      
      return commentRef.set({
        userId: currentUser.uid,
        userFirstName: userData.firstName,
        userLastName: userData.lastName,
        text: commentText,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
    })
    .then(() => {
      // Update comment count
      const postCard = document.querySelector(`[data-post-id="${postId}"]`);
      const commentCount = postCard.querySelector('.comment-count');
      const currentCount = parseInt(commentCount.textContent) || 0;
      commentCount.textContent = currentCount + 1;
      
      // Add notification for comment
      const postRef = firebase.database().ref(`posts/${postId}`);
      return postRef.once('value');
    })
    .then((postSnapshot) => {
      const post = postSnapshot.val();
      // Don't create notification if commenting on own post
      if (post.userId !== currentUser.uid) {
        return firebase.database().ref(`notifications/${postId}/items`).push({
          type: 'comment',
          userId: currentUser.uid,
          postId: postId,
          commentText: commentText,
          timestamp: firebase.database.ServerValue.TIMESTAMP,
          read: false
        });
      }
    })
    .catch((error) => {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    });
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
  const allPosts = Array.from(postsFeed.getElementsByClassName("ursac-post-card"));

  // Filter posts based on the query
  allPosts.forEach((postElement) => {
    const postContent = postElement
      .querySelector(".ursac-post-content")
      .textContent.toLowerCase();

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

  postInput.addEventListener("click", function () {
    if (expandedPostArea) {
      expandedPostArea.classList.add("ursac-expanded");
    }
  });

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

  postInput.addEventListener("input", function () {
    updatePostButton();
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

  filePhoto.addEventListener("change", function (e) {
    handleFileSelect(e, "image");
  });

  fileVideo.addEventListener("change", function (e) {
    handleFileSelect(e, "video");
  });

  fileAttachment.addEventListener("change", function (e) {
    handleFileSelect(e, "file");
  });

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
  mediaPreview.innerHTML = "";
  selectedMedia = null;
  document.getElementById("file-photo").value = "";
  document.getElementById("file-video").value = "";
  document.getElementById("file-attachment").value = "";
  updatePostButton();
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i).toFixed(2))) + " " + sizes[i];
}

function updatePostButton() {
  const postInput = document.getElementById("post-input");
  const postButton = document.getElementById("post-button");
  const hasContent = postInput.value.trim().length > 0;
  const hasMedia = selectedMedia !== null;
  postButton.disabled = !hasContent && !hasMedia;
}

function createPost() {
  if (!currentUser) {
    alert("You must be logged in to post.");
    return;
  }
  
  const content = document.getElementById("post-input").value.trim();

  if (selectedMedia) {
    uploadMedia(selectedMedia.file, selectedMedia.type)
      .then((mediaData) => {
        const newPostRef = firebase.database().ref("posts").push();
        return newPostRef.set({
          userId: currentUser.uid,
          content: content,
          timestamp: firebase.database.ServerValue.TIMESTAMP,
          mediaURL: mediaData.url,
          mediaType: mediaData.type,
          mediaName: mediaData.name,
          mediaSize: mediaData.size,
        });
      })
      .then(() => {
        console.log("Post created successfully");
        clearPostForm();
      })
      .catch((error) => {
        console.error("Error creating post:", error);
        alert("Failed to create post: " + error.message);
      });
  } else {
    const newPostRef = firebase.database().ref("posts").push();
    newPostRef.set({
      userId: currentUser.uid,
      content: content,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    })
    .then(() => {
      console.log("Post created successfully");
      clearPostForm();
    })
    .catch((error) => {
      console.error("Error creating post:", error);
      alert("Failed to create post: " + error.message);
    });
  }
}

function clearPostForm() {
  document.getElementById("post-input").value = "";
  clearMediaPreview();
  updatePostButton();
  const expandedPostArea = document.getElementById("expanded-post-area");
  if (expandedPostArea) {
    expandedPostArea.classList.remove("ursac-expanded");
  }
}

function uploadMedia(file, type) {
  const uploadModal = document.getElementById("upload-modal");
  const uploadProgress = document.getElementById("upload-progress");
  const uploadStatus = document.getElementById("upload-status");

  return new Promise(function (resolve, reject) {
    uploadModal.style.display = "flex";
    uploadProgress.style.width = "0%";
    uploadStatus.textContent = "0%";
    console.log("Starting upload of file:", file.name, "type:", type);

    if (type === "image") {
      uploadStatus.textContent = "Processing...";
      const formData = new FormData();
      formData.append("image", file);
      const imgBBApiKey = "fa517d5bab87e31f661cb28d7de365ba";

      fetch(`https://api.imgbb.com/1/upload?key=${imgBBApiKey}`, {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          uploadProgress.style.width = "50%";
          uploadStatus.textContent = "50%";
          if (!response.ok) {
            throw new Error("ImgBB upload failed: " + response.statusText);
          }
          return response.json();
        })
        .then((result) => {
          if (result.success) {
            console.log("ImgBB upload successful:", result.data.url);
            uploadProgress.style.width = "100%";
            uploadStatus.textContent = "100%";
            const imgData = {
              url: result.data.display_url,
              type: type,
              name: file.name,
              size: formatFileSize(file.size),
              imgBBId: result.data.id,
              deleteUrl: result.data.delete_url || null,
            };
            setTimeout(function () {
              uploadModal.style.display = "none";
            }, 500);
            resolve(imgData);
          } else {
            throw new Error("ImgBB upload failed");
          }
        })
        .catch((error) => {
          console.error("Error uploading to ImgBB:", error);
          uploadModal.style.display = "none";
          reject(error);
        });
    } else {
      const storageRef = firebase.storage().ref();
      const timestamp = Date.now();
      const fileRef = storageRef.child(`posts/${currentUser.uid}/${timestamp}_${file.name}`);
      const uploadTask = fileRef.put(file);

      uploadTask.on(
        firebase.storage.TaskEvent.STATE_CHANGED,
        function (snapshot) {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload progress:", progress.toFixed(2) + "%");
          uploadProgress.style.width = progress + "%";
          uploadStatus.textContent = Math.round(progress) + "%";
        },
        function (error) {
          console.error("Upload failed:", error);
          uploadModal.style.display = "none";
          reject(error);
        },
        function () {
          console.log("Upload completed, getting download URL");
          uploadProgress.style.width = "100%";
          uploadStatus.textContent = "100%";
          uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
            console.log("File available at:", downloadURL);
            setTimeout(function () {
              uploadModal.style.display = "none";
            }, 500);
            resolve({
              url: downloadURL,
              type: type,
              name: file.name,
              size: formatFileSize(file.size),
            });
          });
        }
      );
    }
  });
}

function getContentType(file) {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop().toLowerCase();
  const types = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    mp4: "video/mp4",
    mov: "video/quicktime",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain",
  };
  return types[extension] || "application/octet-stream";
}

function createPostElement(post, userData) {
  const postElement = document.createElement("div");
  postElement.className = "ursac-post-card";
  postElement.setAttribute("data-post-id", post.id);

  const postDate = new Date(post.timestamp);
  const formattedDate =
    postDate.toLocaleDateString() +
    " Â· " +
    postDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const initials = userData ? getInitials(userData.firstName, userData.lastName) : "?";

  let mediaHTML = "";
  if (post.mediaURL) {
    if (post.mediaType === "image") {
      mediaHTML = `
        <div class="ursac-post-media">
          <img src="${post.mediaURL}" alt="Post image">
        </div>
      `;
    } else if (post.mediaType === "video") {
      mediaHTML = `
        <div class="ursac-post-media">
          <video controls>
            <source src="${post.mediaURL}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
      `;
    } else if (post.mediaType === "file") {
      mediaHTML = `
        <div class="ursac-post-attachment">
          <i class="fas fa-file"></i>
          <div class="ursac-post-attachment-info">
            <div class="ursac-post-attachment-name">${post.mediaName || "Attachment"}</div>
            <div class="ursac-post-attachment-size">${post.mediaSize || ""}</div>
          </div>
          <a href="${post.mediaURL}" target="_blank" class="ursac-post-attachment-download">
            <i class="fas fa-download"></i>
          </a>
        </div>
      `;
    }
  }

  postElement.innerHTML = `
    <div class="ursac-post-header">
      <div class="ursac-post-avatar">${initials}</div>
      <div class="ursac-post-user-info">
        <div class="ursac-post-username">
          ${userData ? userData.firstName + " " + userData.lastName : "Unknown User"}
          <span class="ursac-post-user-course">#${userData ? userData.course || "Student" : "Student"}</span>
        </div>
        <div class="ursac-post-meta">${formattedDate}</div>
      </div>
      <div class="ursac-post-options">
        <i class="fas fa-ellipsis-h"></i>
      </div>
    </div>
    <div class="ursac-post-content">
      ${post.content}
    </div>
    ${mediaHTML}
    <div class="ursac-post-footer">
      <div class="ursac-post-stat" onclick="likePost('${post.id}')">
        <i class="fas fa-thumbs-up ${post.likes && post.likes[currentUser?.uid] ? "ursac-post-stat-active" : ""}"></i>
        <span>${countLikes(post.likes)}</span>
      </div>
      <div class="ursac-post-stat" onclick="sharePost('${post.id}')">
        <i class="fas fa-share"></i>
        <span>Share</span>
      </div>
      <div class="ursac-post-stat" onclick="toggleComments(this)">
        <i class="fas fa-comment"></i>
        <span>${countComments(post.comments)}</span>
      </div>
    </div>
    <div class="ursac-post-comments" style="display: none;">
      <div class="ursac-comments-list"></div>
      <div class="ursac-comment-input-area">
        <input type="text" class="ursac-comment-input" placeholder="Write a comment...">
        <button class="ursac-comment-submit" disabled>Post</button>
      </div>
    </div>
  `;

  return postElement;
}

// Update the toggleComments function
function toggleComments(element) {
  if (!element) return;

  const postCard = element.closest('.ursac-post-card');
  if (!postCard) return;

  const commentSection = postCard.querySelector('.ursac-post-comments');
  if (!commentSection) return;

  const isVisible = commentSection.style.display === 'block';
  commentSection.style.display = isVisible ? 'none' : 'block';

  if (!isVisible) {
    const postId = postCard.dataset.postId;
    if (postId) {
      loadComments(postId);
    }

    const input = commentSection.querySelector('.ursac-comment-input');
    if (input) {
      // Remove any existing event listeners first
      input.removeEventListener('keypress', handleCommentKeyPress);
      input.removeEventListener('input', handleCommentInput);

      // Add event listeners
      input.addEventListener('keypress', handleCommentKeyPress);
      input.addEventListener('input', handleCommentInput);
      input.focus();
    }
  }
}

// Update the handleCommentKeyPress function
function handleCommentKeyPress(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const commentText = e.target.value.trim();
    if (commentText) {
      const postCard = e.target.closest('.ursac-post-card');
      if (postCard) {
        const postId = postCard.dataset.postId;
        if (postId) {
          commentPost(postId, commentText);
          // Clear input and disable button after successful comment
          e.target.value = '';
          const submitBtn = e.target.nextElementSibling;
          if (submitBtn) {
            submitBtn.disabled = true;
          }
        }
      }
    }
  }
}

function loadComments(postId) {
  if (!currentUser) return;

  const commentsRef = firebase.database().ref(`posts/${postId}/comments`);
  commentsRef.on('value', function(snapshot) {
    const commentsList = document.querySelector(`[data-post-id="${postId}"] .ursac-comments-list`);
    
    if (!snapshot.exists()) {
      commentsList.innerHTML = `
        <div class="ursac-no-comments">
          No comments yet. Be the first to comment!
        </div>
      `;
      return;
    }

    const comments = [];
    snapshot.forEach((childSnapshot) => {
      const comment = childSnapshot.val();
      comments.push({
        id: childSnapshot.key,
        ...comment
      });
    });

    // Sort comments by timestamp (newest first)
    comments.sort((a, b) => b.timestamp - a.timestamp);

    commentsList.innerHTML = comments.map(comment => createCommentElement(comment)).join('');
  });
}

function createCommentElement(comment) {
  return `
    <div class="ursac-comment" data-comment-id="${comment.id}">
      <div class="ursac-comment-avatar">
        ${getInitials(comment.userFirstName, comment.userLastName)}
      </div>
      <div class="ursac-comment-content">
        <div class="ursac-comment-header">
          <span class="ursac-comment-username">${comment.userFirstName} ${comment.userLastName}</span>
          <span class="ursac-comment-time">${formatTimestamp(comment.timestamp)}</span>
        </div>
        <div class="ursac-comment-text">${comment.text}</div>
      </div>
    </div>
  `;
}

// Add this initialization function
function initializeCommentListeners() {
  document.querySelectorAll('.ursac-comment-input').forEach(input => {
    if (input) {
      input.removeEventListener('keypress', handleCommentKeyPress);
      input.removeEventListener('input', handleCommentInput);
      input.addEventListener('keypress', handleCommentKeyPress);
      input.addEventListener('input', handleCommentInput);
    }
  });
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

window.clearMediaPreview = clearMediaPreview;
window.likePost = likePost;
window.sharePost = sharePost;
window.loadUserProfile = loadUserProfile;
window.loadNotifications = loadNotifications;
window.toggleComments = toggleComments;
window.commentPost = commentPost;