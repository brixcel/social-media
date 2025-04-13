const firebase = window.firebase;
let currentUser = null;
let selectedMedia = null;
let postsLoaded = false;
let postsListener = null; // Track the posts listener

document.addEventListener("DOMContentLoaded", function () {
  const postInput = document.getElementById("post-input");
  const postButton = document.getElementById("post-button");
  const mediaPreview = document.getElementById("media-preview");
  const filePhoto = document.getElementById("file-photo");
  const fileVideo = document.getElementById("file-video");
  const fileAttachment = document.getElementById("file-attachment");
  const uploadModal = document.getElementById("upload-modal");
  const uploadProgress = document.getElementById("upload-progress");
  const uploadStatus = document.getElementById("upload-status");

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      console.log("User is signed in:", user.uid);
      currentUser = user;
      loadUserProfile(user);
      loadPosts();
      loadFriends();
    } else {
      console.log("No user is signed in");
      window.location.href = "login.html";
    }
  });

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
});

function loadUserProfile(user) {
  firebase
    .database()
    .ref("users/" + user.uid)
    .once("value")
    .then(function (snapshot) {
      const userData = snapshot.val();
      if (userData) {
        const userProfileElement = document.getElementById("user-profile");
        const createPostAvatar = document.getElementById("create-post-avatar");
        const createPostUserName = document.getElementById("create-post-username");
        const initials = getInitials(userData.firstName, userData.lastName);
        const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim();
        userProfileElement.innerHTML = `
          <div class="ursac-user-avatar">${initials}</div>
          <div class="ursac-user-name">${userData.firstName || "User"}</div>
        `;
        createPostAvatar.innerHTML = `${initials}`;
        if (createPostUserName) {
          createPostUserName.textContent = fullName || "User";
        }
      }
    })
    .catch(function (error) {
      console.error("Error loading user profile:", error);
    });
}

function getInitials(firstName, lastName) {
  let initials = "";
  if (firstName) initials += firstName.charAt(0).toUpperCase();
  if (lastName) initials += lastName.charAt(0).toUpperCase();
  return initials || "?";
}

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
        postsFeed.innerHTML = "";

        if (postsData) {
          // Convert to array and sort by timestamp in descending order (newest first)
          const postsArray = Object.entries(postsData)
            .map(function ([id, post]) {
              return {
                id,
                ...post,
              };
            })
            .sort((a, b) => b.timestamp - a.timestamp); // Sort newest first

          const fragment = document.createDocumentFragment();

          // Process posts in order - newest first
          const postPromises = postsArray.map(function (post) {
            return new Promise(function (resolve) {
              firebase
                .database()
                .ref("users/" + post.userId)
                .once("value")
                .then(function (userSnapshot) {
                  const userData = userSnapshot.val();
                  const postElement = createPostElement(post, userData);

                  // Add the post element to the top of the fragment (stack-like behavior)
                  fragment.insertBefore(postElement, fragment.firstChild);
                  resolve();
                })
                .catch(function (error) {
                  console.error("Error loading user data for post:", error);
                  resolve();
                });
            });
          });

          Promise.all(postPromises).then(function () {
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
  const postElement = document.querySelector(`[data-post-id="${postId}"]`);
  const likeIcon = postElement.querySelector(".fa-thumbs-up");
  const likeCountElement = postElement.querySelector(".ursac-post-stat span");
  postRef.once("value").then(function (snapshot) {
    if (snapshot.exists()) {
      postRef.remove().then(() => {
        console.log("Post unliked successfully.");
        likeIcon.classList.remove("ursac-post-stat-active");
        likeCountElement.textContent = parseInt(likeCountElement.textContent) - 1;
      }).catch((error) => {
        console.error("Error unliking post:", error);
      });
    } else {
      postRef.set(true).then(() => {
        console.log("Post liked successfully.");
        likeIcon.classList.add("ursac-post-stat-active");
        likeCountElement.textContent = parseInt(likeCountElement.textContent) + 1;
      }).catch((error) => {
        console.error("Error liking post:", error);
      });
    }
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
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function updatePostButton() {
  const postInput = document.getElementById("post-input");
  const postButton = document.getElementById("post-button");
  const hasContent = postInput.value.trim().length > 0;
  const hasMedia = selectedMedia !== null;
  postButton.disabled = !hasContent && !hasMedia;
}

function createPost() {
  const postInput = document.getElementById("post-input");
  const postButton = document.getElementById("post-button");
  const expandedPostArea = document.getElementById("expanded-post-area");

  if (!currentUser) {
    alert("You must be logged in to post");
    return;
  }

  const content = postInput.value.trim();
  if (!content && !selectedMedia) {
    return;
  }

  // Disable the button to prevent multiple submissions
  postButton.disabled = true;
  postButton.textContent = "Posting...";

  const finishPosting = function (mediaData = null) {
    const newPostRef = firebase.database().ref("posts").push();
    // Create post data with current timestamp
    const postData = {
      userId: currentUser.uid,
      content: content || "",
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    };

    if (mediaData) {
      postData.mediaURL = mediaData.url;
      postData.mediaType = mediaData.type;
      postData.mediaName = mediaData.name;
      postData.mediaSize = mediaData.size;
      if (mediaData.imgBBId) {
        postData.imgBBId = mediaData.imgBBId;
      }
      if (mediaData.deleteUrl) {
        postData.mediaDeleteUrl = mediaData.deleteUrl;
      }
    }

    newPostRef
      .set(postData)
      .then(function () {
        console.log("Post created successfully with ID:", newPostRef.key);
        postInput.value = "";
        clearMediaPreview();
        postButton.disabled = false;
        postButton.textContent = "Post";
        if (expandedPostArea) {
          expandedPostArea.classList.remove("ursac-expanded");
        }
        // Firebase listener will automatically update the feed with the new post
      })
      .catch(function (error) {
        console.error("Error creating post:", error);
        alert("Failed to create post: " + error.message);
        postButton.disabled = false;
        postButton.textContent = "Post";
      });
  };

  if (selectedMedia) {
    uploadMedia(selectedMedia.file, selectedMedia.type)
      .then(function (mediaData) {
        console.log("Media uploaded successfully:", mediaData);
        finishPosting(mediaData);
      })
      .catch(function (error) {
        console.error("Error uploading media:", error);
        alert("Failed to upload media: " + error.message);
        postButton.disabled = false;
        postButton.textContent = "Post";
      });
  } else {
    finishPosting();
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
      <div class="ursac-post-stat">
        <i class="fas fa-comment"></i>
        <span>${countComments(post.comments)}</span>
      </div>
    </div>
  `;

  return postElement;
}

window.clearMediaPreview = clearMediaPreview;
window.likePost = likePost;
window.sharePost = sharePost;