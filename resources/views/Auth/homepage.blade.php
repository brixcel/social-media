<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>URSAC Hub - Home</title>
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="main.css">
  
</head>
<body>
  <div class="ursac-container">
    <!-- Left Sidebar -->
    <div class="ursac-sidebar-left">
      <div class="ursac-header-logo">
        <a href="#">URSAC Hub</a>
      </div>
      <div class="ursac-sidebar-menu">
        <a href="{{ route('homepage') }}" class="ursac-menu-item ursac-menu-active">
          <i class="fas fa-home"></i>
          <span>Home</span>
        </a>
        <a href="{{ route('notifications') }}" class="ursac-menu-item">
          <i class="fas fa-bell ursac-notification-indicator">
            <span class="ursac-notification-badge" style="display: none;">0</span>
          </i>
          <span>Notifications</span>
        </a>
        <a href="{{ route('messages') }}" class="ursac-menu-item">
          <i class="fas fa-comment"></i>
          <span>Messages</span>
        </a>

        <a href="{{ route('profile') }}" class="ursac-menu-item">
          <i class="fas fa-user"></i>
          <span>Profile</span>
        </a>
        
        
        <!-- Post Button (After Settings) -->
        <button class="ursac-sidebar-post-btn" id="open-post-modal">
          <i class="fas fa-plus"></i>
          <span>Post</span>
        </button>
        
        <!-- User Profile Button -->
        <div class="ursac-header-profile" id="user-profile-btn">
          <!-- Will be populated by JS with user profile info -->
        </div>
        
        <!-- User Profile Dropdown -->
        <div class="ursac-profile-dropdown" id="user-profile-dropdown">
          <div class="ursac-profile-dropdown-item" id="add-account-btn">
            <i class="fas fa-user-plus"></i>
            <span>Add an existing account</span>
          </div>
          <div class="ursac-profile-dropdown-item" id="logout-btn">
            <i class="fas fa-sign-out-alt"></i>
            <span>Log out</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="ursac-content-main">
      <div class="ursac-header-search">
        <input type="text" id="search-input" placeholder="Search..." />
      </div>
      
      <!-- Tabs -->
      <div class="ursac-content-tabs">
        <div class="ursac-tab ursac-tab-active">Posts</div>
      </div>
      
      
      <!-- Create Post -->
      <div class="ursac-create-post">
        <div class="ursac-create-post-header">
          <div class="ursac-create-post-avatar-container">
            <div class="ursac-create-post-avatar" id="create-post-avatar">
              <!-- Will be populated by JS -->
            </div>
            <div class="ursac-create-post-username" id="create-post-username">User</div>
          </div>
          <input type="text" class="ursac-post-input" id="post-input" placeholder="Write a Post" />
        </div>
        
        <!-- Expanded post area -->
        <div class="ursac-expanded-post-area" id="expanded-post-area">
          <!-- Media Preview -->
          <div class="ursac-media-preview" id="media-preview"></div>
          
          <div class="ursac-post-actions">
            <div class="ursac-post-action-group">
              <label for="file-photo" class="ursac-post-action">
                <i class="fas fa-image"></i>
                <span>Photo</span>
              </label>
              <input type="file" id="file-photo" accept="image/*" style="display: none;">
              
              <label for="file-video" class="ursac-post-action">
                <i class="fas fa-video"></i>
                <span>Video</span>
              </label>
              <input type="file" id="file-video" accept="video/*" style="display: none;">
              
              <label for="file-attachment" class="ursac-post-action">
                <i class="fas fa-paperclip"></i>
                <span>Attachment</span>
              </label>
              <input type="file" id="file-attachment" style="display: none;">
            </div>
            
            <button class="ursac-post-button" id="post-button" disabled>
              <span>Post</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Posts Feed -->
      <div class="ursac-posts-feed" id="posts-feed">
        <div class="ursac-post-card">
          <!-- ... existing post content ... -->
          
          <div class="ursac-post-footer">
            <div class="ursac-post-stat" onclick="likePost('${postId}')">
              <i class="far fa-thumbs-up"></i>
              <span class="like-count">0</span>
            </div>
            <div class="ursac-post-stat" onclick="toggleComments(this)">
              <i class="far fa-comment"></i>
              <span class="comment-count">0</span>
            </div>
            <div class="ursac-post-stat" onclick="sharePost('${postId}')">
              <i class="far fa-share-square"></i>
            </div>
          </div>

          <!-- Add comment section -->
          <div class="ursac-post-comments" style="display: none;">
            <!-- This div will be populated with the post owner's name -->
            <div class="ursac-comment-input-wrapper">
              <div class="ursac-comment-avatar">
                <!-- User initials will be added dynamically -->
              </div>
              <div class="ursac-comment-input-container">
                <input type="text" class="ursac-comment-input" placeholder="Write a comment...">
                <button class="ursac-comment-submit">
                  <i class="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
            
            <div class="ursac-comments-list">
              <div class="ursac-no-comments">
                No comments yet. Be the first to comment!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Right Sidebar -->
    <div class="ursac-sidebar-right">
      <!-- Forums Section -->
      <div class="ursac-sidebar-section" id="forum-section">
        <h3 class="ursac-sidebar-title">
          Forums
          <button class="ursac-add-forum-btn" id="add-forum-btn" style="float: right; background: none; border: none; cursor: pointer;">
        <i class="fas fa-plus-circle" style="color: var(--primary-color); font-size: 1.2em;"></i>
        </button>
        </h3>
        <div id="addForumModal" class="custom-modal">
          <div class="custom-modal-box">
            <span id="closeModalBtn" class="custom-close">&times;</span>
              <a href="{{ route('join') }}" class="custom-button custom-button-primary" id="join-forum-btn">
                <i class="fas fa-sign-in-alt"></i>
                <span>Join a Forum</span>
              </a>
            <a href="{{ route('create') }}" class="custom-button custom-button-secondary" id="create-forum-btn">
              <i class="fas fa-plus-circle"></i>
              <span>Create Your Forum</span>
            </a>
          </div>
        </div>
        
        <div class="ursac-forum-list"">
        </div>
      
      
      
      


  <!-- Post Modal -->
  <div class="ursac-upload-modal" id="post-modal" style="display:none;z-index:2000;">
    <div class="ursac-upload-content" style="max-width:400px;">
      <h3 style="margin-bottom:10px;">What's happening?</h3>
      <textarea id="modal-post-content" class="ursac-post-textarea" placeholder="What's happening?" style="margin-bottom:10px;"></textarea>
      <div class="ursac-media-preview" id="modal-media-preview"></div>
      <div class="ursac-post-actions">
        <div class="ursac-post-action-group">
          <label for="modal-file-photo" class="ursac-post-action"><i class="fas fa-image"></i></label>
          <input type="file" id="modal-file-photo" accept="image/*" style="display:none;">
          <label for="modal-file-video" class="ursac-post-action"><i class="fas fa-video"></i></label>
          <input type="file" id="modal-file-video" accept="video/*" style="display:none;">
          <label for="modal-file-attachment" class="ursac-post-action"><i class="fas fa-paperclip"></i></label>
          <input type="file" id="modal-file-attachment" style="display:none;">
        </div>
        <button class="ursac-post-button" id="modal-post-button" disabled>Post</button>
      </div>
      <button class="ursac-post-button" id="close-post-modal" style="background:var(--gray);margin-top:10px;">Cancel</button>
    </div>
  </div>
  
  <!-- File upload progress modal -->
  <div class="ursac-upload-modal" id="upload-modal">
    <div class="ursac-upload-content">
      <h3>Uploading...</h3>
      <div class="ursac-progress-container">
        <div class="ursac-progress-bar" id="upload-progress"></div>
      </div>
      <div class="ursac-upload-status" id="upload-status">0%</div>
    </div>
  </div>

  <!-- Scripts -->
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-auth.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-database.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-storage.js"></script>
  <script>
    // Your web app's Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyAZ6EzZLpBIUlTjFm7ZUBfMMkmslIOeMFg",
      authDomain: "social-media-8c5ba.firebaseapp.com",
      databaseURL: "https://social-media-8c5ba-default-rtdb.firebaseio.com",
      projectId: "social-media-8c5ba",
      storageBucket: "social-media-8c5ba.appspot.com",
      messagingSenderId: "25174929156",
      appId: "1:25174929156:web:edd2093c4b96f710262a51",
      measurementId: "G-SMRP4X0HPM"
    };
    
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
  </script>
  <script>
  // Debug functions
  function debugFirebaseConnection() {
    try {
      const app = firebase.app();
      console.log("Firebase successfully initialized");
      
      // Add this to check auth state
      firebase.auth().onAuthStateChanged(function(user) {
        console.log("Auth state changed:", user ? "User logged in" : "No user");
      });
    } catch (error) {
      console.error("Firebase initialization error:", error);
    }
  }

  // Run debug functions when page loads
  document.addEventListener("DOMContentLoaded", function() {
    console.log("Running diagnostics...");
    debugFirebaseConnection();
   
    
    // Test if DOM elements exist
    const elements = [
      "post-input", "post-button", "posts-feed", "media-preview", 
      "file-photo", "file-video", "file-attachment", "user-profile-btn",
      "user-profile-dropdown", "logout-btn", "add-account-btn", "open-post-modal"
    ];
    
    elements.forEach(id => {
      const el = document.getElementById(id);
      console.log(`Element #${id} ${el ? "exists" : "MISSING!"}`);
    });
  });
</script>
  <script src="script.js"></script>
<<<<<<< HEAD
  <script type="module" src="notifications.js"></script>
=======
  <script src="notifications.js"></script>
  <script src="messages.js"></script>
>>>>>>> 466e93e0987f5db1fba918d3f155c0d7d54ea531
</body>
</html>
