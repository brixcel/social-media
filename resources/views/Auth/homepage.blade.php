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
        
        <!-- Post Button -->
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
          <!-- FIXED: Changed from post-input to postForm -->
          <input type="text" class="ursac-post-input" id="postForm" placeholder="Write a Post" />
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
      
      <!-- Posts Feed - FIXED: Changed from posts-feed to postsContainer -->
      <div class="ursac-posts-feed" id="postsContainer">
        <!-- Posts will be dynamically loaded here via Firebase listeners -->
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
        
        <!-- Forum Modal -->
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
        
        <div class="ursac-forum-list"></div>
      </div>
    </div>
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

  <!-- Profanity Warning Modal -->
  <div class="ursac-modal" id="profanity-warning-modal" style="display: none;">
    <div class="ursac-modal-content">
      <div class="ursac-modal-header">
        <h3>Inappropriate Language Detected</h3>
        <button class="ursac-modal-close" id="close-profanity-modal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="ursac-modal-body">
        <p>Your message contains inappropriate language that violates our community guidelines.</p>
        <p>Please revise your message before sending.</p>
        <div id="profanity-details" class="ursac-profanity-details"></div>
      </div>
      <div class="ursac-modal-footer">
        <button class="ursac-button ursac-button-primary" id="acknowledge-profanity">I Understand</button>
      </div>
    </div>
  </div>

  <!-- Generic Modal -->
  <div class="ursac-modal" id="generic-modal" style="display: none;">
    <div class="ursac-modal-content">
      <div class="ursac-modal-header">
        <h3 id="modal-title"></h3>
        <button class="ursac-modal-close" id="close-generic-modal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="ursac-modal-body">
        <p id="modal-message"></p>
      </div>
      <div class="ursac-modal-footer">
        <button class="ursac-button ursac-button-primary" id="acknowledge-modal">OK</button>
      </div>
    </div>
  </div>

  <!-- Post Template (Hidden) -->
  <template id="post-template">
    <div class="ursac-post-card" data-post-id="">
      <div class="ursac-post-header">
        <div class="ursac-profile-avatar">
          <span class="avatar-initials"></span>
        </div>
        <div class="ursac-post-meta">
          <div class="ursac-post-author"></div>
          <div class="ursac-post-time"></div>
        </div>
      </div>
      
      <div class="ursac-post-content">
        <p class="post-text"></p>
        <div class="ursac-post-media" style="display: none;"></div>
      </div>

      <div class="ursac-post-footer">
        <div class="ursac-post-stat like-button">
          <i class="far fa-thumbs-up"></i>
          <span class="like-count">0</span>
        </div>
        <div class="ursac-post-stat comment-button">
          <i class="far fa-comment"></i>
          <span class="comment-count">0</span>
        </div>
        <div class="ursac-post-stat share-button">
          <i class="far fa-share-square"></i>
        </div>
      </div>

      <!-- Comments Section -->
      <div class="ursac-post-comments" style="display: none;">
        <div class="ursac-comment-input-wrapper">
          <div class="ursac-comment-avatar">
            <span class="current-user-initials"></span>
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
  </template>

  <!-- Comment Template (Hidden) -->
  <template id="comment-template">
    <div class="ursac-comment-thread">
      <div class="ursac-comment" data-comment-id="">
        <div class="ursac-comment-avatar">
          <span class="comment-avatar-initials"></span>
        </div>
        <div class="ursac-comment-content">
          <div class="ursac-comment-bubble">
            <div class="ursac-comment-header">
              <span class="ursac-comment-username"></span>
              <span class="ursac-comment-time"></span>
            </div>
            <div class="ursac-comment-text"></div>
          </div>
          <div class="ursac-comment-actions">
            <button class="ursac-reply-button">
              <i class="fas fa-reply"></i> Reply
            </button>
          </div>
        </div>
      </div>
      
      <!-- Reply Input Container -->
      <div class="ursac-reply-input-container" style="display: none;">
        <div class="ursac-comment-input-wrapper">
          <div class="ursac-comment-avatar">
            <span class="current-user-initials"></span>
          </div>
          <div class="ursac-comment-input-container">
            <input type="text" class="ursac-reply-input" placeholder="Write a reply...">
            <button class="ursac-reply-submit">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Replies Container -->
      <div class="ursac-replies-container">
        <!-- Replies will be inserted here -->
      </div>

      <!-- View More Replies Button -->
      <div class="ursac-view-more-replies" style="display: none;">
        <button class="ursac-view-more-btn">
          <i class="fas fa-chevron-down"></i>
          View <span class="remaining-count">0</span> more replies
        </button>
      </div>
    </div>
  </template>

  <!-- Reply Template (Hidden) -->
  <template id="reply-template">
    <div class="ursac-reply" data-reply-id="">
      <div class="ursac-reply-connector"></div>
      <div class="ursac-comment-avatar">
        <span class="reply-avatar-initials"></span>
      </div>
      <div class="ursac-comment-content">
        <div class="ursac-comment-bubble">
          <div class="ursac-comment-header">
            <span class="ursac-comment-username"></span>
            <span class="ursac-comment-time"></span>
          </div>
          <div class="ursac-comment-text"></div>
        </div>
      </div>
    </div>
  </template>

  <!-- Scripts -->
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-auth.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-database.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-storage.js"></script>
  
  <script>
    // Firebase configuration
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
  
  <script src="comments.js"></script>
  <script src="script.js"></script>
  <script src="notifications.js"></script>
  <script src="messages.js"></script>
</body>
</html>
