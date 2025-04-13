<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>URSAC Hub - Home</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="main.css">
</head>
<body>
  <!-- Header -->
  <header class="ursac-header">
    <div class="ursac-header-logo">
      <a href="#">URSAC Hub</a>
    </div>
    <div class="ursac-header-search">
      <input type="text" id = "search-input" placeholder="Search..." />
    </div>
    <div class="ursac-header-profile" id="user-profile">
      <!-- User profile will be populated by JavaScript -->
    </div>
  </header>

  <div class="ursac-container">
    <!-- Left Sidebar -->
    <div class="ursac-sidebar-left">
      <div class="ursac-sidebar-menu">
        <a href="#" class="ursac-menu-item ursac-menu-active">
          <i class="fas fa-home"></i>
          <span>Home</span>
        </a>
        <a href="#" class="ursac-menu-item">
          <i class="fas fa-bell"></i>
          <span>Notifications</span>
        </a>
        <a href="#" class="ursac-menu-item">
          <i class="fas fa-comment"></i>
          <span>Messages</span>
        </a>
        <a href="#" class="ursac-menu-item">
          <i class="fas fa-users"></i>
          <span>Organizations</span>
        </a>
        <a href="#" class="ursac-menu-item">
          <i class="fas fa-user"></i>
          <span>Profile</span>
        </a>
        <a href="#" class="ursac-menu-item">
          <i class="fas fa-cog"></i>
          <span>Settings</span>
        </a>
      </div>
     
    </div>
    
    <!-- Main Content -->
    <div class="ursac-content-main">
      <!-- Tabs -->
      <div class="ursac-content-tabs">
        <div class="ursac-tab ursac-tab-active">Posts</div>
        <div class="ursac-tab">Questions</div>
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
        <!-- Posts will be loaded dynamically -->
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
      
      <!-- Events Section -->
      <div class="ursac-sidebar-section">
        <h3 class="ursac-sidebar-title">Upcoming Events</h3>
        <div class="ursac-event-list">
          <div class="ursac-event-item">
            <div class="ursac-event-date">
              <div class="ursac-event-month">SEP</div>
              <div class="ursac-event-day">15</div>
            </div>
            <div class="ursac-event-info">
              <div class="ursac-event-name">Freshmen Orientation</div>
              <div class="ursac-event-location">Main Auditorium</div>
            </div>
          </div>
          <div class="ursac-event-item">
            <div class="ursac-event-date">
              <div class="ursac-event-month">OCT</div>
              <div class="ursac-event-day">05</div>
            </div>
            <div class="ursac-event-info">
              <div class="ursac-event-name">Tech Symposium 2023</div>
              <div class="ursac-event-location">Engineering Building</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Friends Section -->
      <div class="ursac-sidebar-section">
        <h3 class="ursac-sidebar-title">Friends</h3>
        <div class="ursac-friend-list" id="friend-list">
          <!-- Friends will be loaded dynamically -->
          <div class="ursac-friend-item">
            <div class="ursac-friend-avatar">
              <div class="ursac-friend-status ursac-status-online"></div>
            </div>
            <div class="ursac-friend-info">
              <div class="ursac-friend-name">Maria Santos</div>
              <div class="ursac-friend-course">BS - IT</div>
            </div>
          </div>
          <div class="ursac-friend-item">
            <div class="ursac-friend-avatar">
              <div class="ursac-friend-status ursac-status-offline"></div>
            </div>
            <div class="ursac-friend-info">
              <div class="ursac-friend-name">John Reyes</div>
              <div class="ursac-friend-course">BS - CpE</div>
            </div>
          </div>
        </div>
      </div>
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
  <script src="script.js"></script>
</body>
</html>
