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
        <a href="{{ route('notifications') }}" class="ursac-menu-item ursac-menu-active">
          <i class="fas fa-bell ursac-notification-indicator">
            <span class="ursac-notification-badge" style="display: none;"></span>
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
        <!-- Loading state -->
        <div class="ursac-notifications-loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Loading notifications...</p>
        </div>
        
        <!-- Empty state message that will be shown when there are no notifications -->
        <div class="ursac-notifications-empty" style="display: none;">
          <i class="fas fa-bell-slash"></i>
          <p>No notifications yet</p>
        </div>
        
        <!-- Notification item template (will be populated dynamically) -->
        <div class="ursac-notification-item-template" style="display: none;">
          <div class="ursac-notification-icon">
            <!-- Icon will be inserted here -->
          </div>
          <div class="ursac-notification-content">
            <div class="ursac-notification-text">
              <!-- Notification text will be inserted here -->
            </div>
            <div class="ursac-notification-meta">
              <span class="ursac-notification-time">
                <!-- Time will be inserted here -->
              </span>
            </div>
          </div>
          <div class="ursac-notification-actions">
            <button class="ursac-view-button">View</button>
            <button class="ursac-mark-read-button">Mark as read</button>
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
        
        <div class="ursac-forum-list">
          
        <div class="ursac-forum-list"">
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
<<<<<<< HEAD
  <script type="module" src="notifications.js"></script>
=======
  <script src="notifications.js"></script>
  <script src="messages.js"></script>
</body>
>>>>>>> 466e93e0987f5db1fba918d3f155c0d7d54ea531
</html>