<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>URSAC Hub - Profile</title>
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="{{ asset('main.css') }}">
  <style>
    .ursac-profile-container {
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
      overflow: hidden;
    }

    .ursac-profile-banner {
      height: 150px;
      background-color: #4a76a8;
      position: relative;
    }

    .ursac-profile-avatar-container {
      position: absolute;
      bottom: -50px;
      left: 30px;
    }

    .ursac-profile-avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 4px solid white;
      background-color: #e1e4e8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      color: white;
      overflow: hidden;
    }

    .ursac-profile-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .ursac-profile-info {
      padding: 60px 20px 20px;
    }

    .ursac-profile-name {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 5px;
    }

    .ursac-profile-email {
      color: #666;
      margin-bottom: 15px;
    }

    .ursac-profile-bio {
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .ursac-profile-edit-btn {
      background-color: #4a76a8;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }

    .ursac-profile-edit-btn:hover {
      background-color: #3d6593;
    }

    .ursac-profile-form {
      display: none;
      margin-top: 20px;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
    }

    .ursac-form-group {
      margin-bottom: 15px;
    }

    .ursac-form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
    }

    .ursac-form-group input,
    .ursac-form-group textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: inherit;
    }

    .ursac-form-group textarea {
      min-height: 100px;
      resize: vertical;
    }

    .ursac-form-actions {
      display: flex;
      gap: 10px;
    }

    .ursac-form-actions button {
      padding: 8px 16px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-weight: 500;
    }

    .ursac-form-submit {
      background-color: #4a76a8;
      color: white;
    }

    .ursac-form-cancel {
      background-color: #e1e4e8;
      color: #333;
    }

    .ursac-profile-tabs {
      display: flex;
      border-bottom: 1px solid #e1e4e8;
      margin-bottom: 20px;
    }

    .ursac-profile-tab {
      padding: 10px 20px;
      cursor: pointer;
      font-weight: 500;
      border-bottom: 2px solid transparent;
    }

    .ursac-profile-tab.active {
      border-bottom-color: #4a76a8;
      color: #4a76a8;
    }

    .ursac-profile-section {
      display: none;
    }

    .ursac-profile-section.active {
      display: block;
    }

    .ursac-image-upload {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
    }

    .ursac-image-preview {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background-color: #e1e4e8;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .ursac-image-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .ursac-image-upload-btn {
      background-color: #4a76a8;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }

    .ursac-image-upload-btn:hover {
      background-color: #3d6593;
    }

    .ursac-alert {
      padding: 10px 15px;
      border-radius: 4px;
      margin-bottom: 15px;
      display: none;
    }

    .ursac-alert-success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .ursac-alert-error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    /* User posts section */
    .ursac-user-posts {
      margin-top: 20px;
    }

    .ursac-user-posts-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
    }

    .ursac-no-posts {
      padding: 20px;
      text-align: center;
      background-color: #f8f9fa;
      border-radius: 8px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="ursac-container">
    <!-- Left Sidebar -->
    <div class="ursac-sidebar-left">
      <div class="ursac-header-logo">
        <a href="#">URSAC Hub</a>
      </div>
      <div class="ursac-sidebar-menu">
        <a href="{{ url('/homepage') }}" class="ursac-menu-item">
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
        <a href="{{ route('profile') }}" class="ursac-menu-item ursac-menu-active">
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
      
      <!-- Profile Container -->
      <div class="ursac-profile-container">
        <div class="ursac-profile-banner">
          <div class="ursac-profile-avatar-container">
            <div class="ursac-profile-avatar" id="profile-avatar">
              @if(isset($user['profileImageUrl']))
                <img src="{{ $user['profileImageUrl'] }}" alt="Profile Image" id="profile-image">
              @else
                <span>{{ isset($user['firstName']) ? substr($user['firstName'], 0, 1) : '' }}{{ isset($user['lastName']) ? substr($user['lastName'], 0, 1) : '' }}</span>
              @endif
            </div>
          </div>
        </div>
        
        <div class="ursac-profile-info">
          <div class="ursac-profile-name" id="profile-name">
            {{ isset($user['firstName']) ? $user['firstName'] : '' }} {{ isset($user['lastName']) ? $user['lastName'] : '' }}
          </div>
          <div class="ursac-profile-email" id="profile-email">
            {{ Session::get('firebaseUserEmail') }}
          </div>
          <div class="ursac-profile-bio" id="profile-bio">
            {{ isset($user['bio']) ? $user['bio'] : 'No bio available.' }}
          </div>
          
          <button class="ursac-profile-edit-btn" id="edit-profile-btn">
            <i class="fas fa-edit"></i> Edit Profile
          </button>
          
          <!-- Profile Edit Form -->
          <div class="ursac-profile-form" id="profile-form">
            <div class="ursac-alert ursac-alert-success" id="success-alert"></div>
            <div class="ursac-alert ursac-alert-error" id="error-alert"></div>
            
            <div class="ursac-image-upload">
              <div class="ursac-image-preview" id="image-preview">
                @if(isset($user['profileImageUrl']))
                  <img src="{{ $user['profileImageUrl'] }}" alt="Profile Image" id="preview-image">
                @else
                  <span>{{ isset($user['firstName']) ? substr($user['firstName'], 0, 1) : '' }}{{ isset($user['lastName']) ? substr($user['lastName'], 0, 1) : '' }}</span>
                @endif
              </div>
              <div>
                <input type="file" id="profile-image-input" accept="image/*" style="display: none;">
                <button class="ursac-image-upload-btn" id="upload-image-btn">
                  <i class="fas fa-upload"></i> Upload Image
                </button>
              </div>
            </div>
            
            <div class="ursac-form-group">
              <label for="first-name">First Name</label>
              <input type="text" id="first-name" value="{{ isset($user['firstName']) ? $user['firstName'] : '' }}">
            </div>
            
            <div class="ursac-form-group">
              <label for="last-name">Last Name</label>
              <input type="text" id="last-name" value="{{ isset($user['lastName']) ? $user['lastName'] : '' }}">
            </div>
            
            <div class="ursac-form-group">
              <label for="bio">Bio</label>
              <textarea id="bio">{{ isset($user['bio']) ? $user['bio'] : '' }}</textarea>
            </div>
            
            <div class="ursac-form-actions">
              <button class="ursac-form-submit" id="save-profile-btn">Save Changes</button>
              <button class="ursac-form-cancel" id="cancel-edit-btn">Cancel</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Profile Tabs -->
      <div class="ursac-profile-tabs">
        <div class="ursac-profile-tab active" data-tab="posts">My Posts</div>
      </div>
      
      <!-- User Posts Section -->
      <div class="ursac-profile-section active" id="posts-section">
        <div class="ursac-user-posts">
          <div class="ursac-user-posts-title">Your Posts</div>
          
          <div id="user-posts-feed">
            @if(count($posts) > 0)
              <!-- Posts will be populated by JavaScript -->
            @else
              <div class="ursac-no-posts">
                <p>You haven't created any posts yet.</p>
              </div>
            @endif
          </div>
        </div>
      </div>
    </div>
    
    <!-- Right Sidebar -->
    <div class="ursac-sidebar-right">
      <!-- Forums Section -->
      <div class="ursac-sidebar-section">
        <h3 class="ursac-sidebar-title">Forums</h3>
        <div class="ursac-forum-list">
          <div class="ursac-forum-item">
            <div class="ursac-forum-icon">
              <i class="fas fa-graduation-cap"></i>
            </div>
            <div class="ursac-forum-info">
              <div class="ursac-forum-name">Academic Discussions</div>
              <div class="ursac-forum-count">24 new posts</div>
            </div>
          </div>
          <div class="ursac-forum-item">
            <div class="ursac-forum-icon">
              <i class="fas fa-laptop-code"></i>
            </div>
            <div class="ursac-forum-info">
              <div class="ursac-forum-name">Tech Corner</div>
              <div class="ursac-forum-count">12 new posts</div>
            </div>
          </div>
          <div class="ursac-forum-item">
            <div class="ursac-forum-icon">
              <i class="fas fa-bullhorn"></i>
            </div>
            <div class="ursac-forum-info">
              <div class="ursac-forum-name">Announcements</div>
              <div class="ursac-forum-count">5 new posts</div>
            </div>
          </div>
        </div>
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
  <script src="{{ asset('script.js') }}"></script>
  <script src="{{ asset('profile.js') }}"></script>
  
  <!-- Sync Firebase auth state with Laravel session -->
  <script>
    // Sync Firebase auth state with Laravel session
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in, get the ID token
        user.getIdToken().then(function(idToken) {
          // Store the token in a cookie
          document.cookie = "firebaseToken=" + idToken + "; path=/";
        });
      } else {
        // User is signed out, redirect to login
        window.location.href = "{{ route('login') }}";
      }
    });
  </script>
</body>
</html>