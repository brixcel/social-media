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
        <a href="{{ route('homepage') }}" class="ursac-menu-item">
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
          <span></span>
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
      <div class="ursac-content-header">
      <h1>Forums</h1>
      <div class="ursac-header-search">
        <input type="text" id="search-input" placeholder="Search a Forum" />
      </div>
      </div>
      <h5 style="font-weight: normal; color: white; font-size: 1.1rem;">Suggested Forums</h5>
      <div class="ursac-forum-card">
      <div class="ursac-forum-card-header" id="forum-card-header">
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
        <div id="addForumModal" class="ursac-modal">
          <div class="ursac-modal-content">
            <span id="closeModalBtn" class="ursac-close">&times;</span>
            <a href="{{ route('join') }}" class="ursac-button ursac-button-primary" id="join-forum-btn">
              <i class="fas fa-sign-in-alt"></i>
              <span>Join a Forum</span>
            </a>
            <a href="{{ route('create') }}" class="ursac-button ursac-button-secondary" id="create-forum-btn">
              <i class="fas fa-plus-circle"></i>
              <span>Create Your Forum</span>
            </a>
            <a href="{{ route('view') }}" class="ursac-button ursac-button-tertiary" id="view-forum-btn">
              <i class="fas fa-eye"></i>
              <span>View Your Forum</span>
            </a>
          </div>
        </div>
        
        <div class="ursac-forum-list"></div>
      
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
  <script src="join.js"></script>
  <script src="notification.js"></script>
</body>
</html>
