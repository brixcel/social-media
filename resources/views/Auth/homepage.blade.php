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
      
      <!-- Posts Feed -->
      <div class="ursac-posts-feed" id="postsContainer">
        <!-- Posts will be dynamically loaded here via Firebase listeners -->
      </div>
    </div>
    
    <!-- Right Sidebar -->
    <!--  -->
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

  <!-- Scripts -->
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-auth.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-database.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-storage.js"></script>
  
  <!-- Load scripts in correct order -->
  <script src="user-data-utils.js"></script>
  <script src="firebase-config.js"></script>
  <script src="content-filter.js"></script>
  <script src="ui-helpers.js"></script>
  <script src="user-authentication.js"></script>
  <script src="media-handler.js"></script>
  <script src="post-manager.js"></script>
  <script src="post-interactions.js"></script>
  <script src="notification-system.js"></script>
  <script src="main-app.js"></script>
  <script src="comments.js"></script>
  
</body>
</html>
