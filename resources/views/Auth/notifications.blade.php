<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>URSAC Hub - Notifications</title>
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
        <a href="/homepage" class="ursac-menu-item">
          <i class="fas fa-home"></i>
          <span>Home</span>
        </a>
        <a href="{{ route('notifications') }}" class="ursac-menu-item">
          <i class="fas fa-bell ursac-notification-indicator">
            <span class="ursac-notification-badge"></span>
          </i>
          <span>Notifications</span>
        </a>
        <a href="{{ route('messages') }}" class="ursac-menu-item">
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
        <!-- Post Button (After Settings) -->
        <button class="ursac-sidebar-post-btn" id="open-post-modal">
          <i class="fas fa-plus"></i>
          <span>Post</span>
        </button>
        
        <!-- User Profile Button -->
        <div id="user-profile-btn" class="ursac-header-profile">
          <!-- Profile button content -->
        </div>
        
        <!-- User Profile Dropdown -->
        <div id="user-profile-dropdown" class="ursac-profile-dropdown">
          <div id="add-account-btn" class="ursac-profile-dropdown-item">
            <i class="fas fa-user-plus"></i>
            <span>Add an existing account</span>
          </div>
          <div class="ursac-profile-dropdown-divider"></div>
          <div id="logout-btn" class="ursac-profile-dropdown-item">
            <i class="fas fa-sign-out-alt"></i>
            <span>Log out</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="ursac-content-main">
      <div class="ursac-header-search">
        <input type="text" id="search-input" placeholder="Search notifications..." />
      </div>
      <!-- Tabs -->
      <div class="ursac-content-tabs">
        <div class="ursac-tab ursac-tab-active">Notifications</div>
      </div>
      
      <!-- Notification Filters -->
      <div class="ursac-notifications-filters">
        <div class="ursac-filter-options">
          <div class="ursac-filter-option active" data-filter="all">All</div>
          <div class="ursac-filter-option" data-filter="unread">Unread</div>
          <div class="ursac-filter-option" data-filter="mentions">Mentions</div>
        </div>
        <div class="ursac-mark-all-read" id="mark-all-read">
          <i class="fas fa-check-double"></i> Mark all as read
        </div>
      </div>
      
      <!-- Notifications Feed -->
      <div class="ursac-notifications-feed" id="notifications-feed">
        <!-- Empty state message that will be shown when there are no notifications -->
        <div class="ursac-notifications-empty" style="display: none;">
          <i class="fas fa-bell-slash"></i>
          <p>No notifications yet</p>
        </div>
        <!-- Notifications will be dynamically loaded here by notifications.js -->
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
  <script src="notifications.js"></script>
</body>
</html>