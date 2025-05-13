<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>URSAC Hub - Messages</title>
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
            <span class="ursac-notification-badge" style="display: none;">0</span>
          </i>
          <span>Notifications</span>
        </a>
        <a href="{{ route('messages') }}" class="ursac-menu-item ursac-menu-active">
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
        <div class="ursac-header-profile" id="user-profile-btn">
          <!-- Will be populated by JS with user profile info -->
        </div>
        
        <!-- User Profile Dropdown -->
        <div class="ursac-profile-dropdown" id="user-profile-dropdown">
          <div class="ursac-profile-dropdown-item" id="add-account-btn">
            <i class="fas fa-user-plus"></i>
            <span>Add an existing account</span>
          </div>
          <div class="ursac-profile-dropdown-divider"></div>
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
        <input type="text" id="search-input" placeholder="Search messages..." />
      </div>
      
      <!-- Tabs -->
      <div class="ursac-content-tabs">
        <div class="ursac-tab ursac-tab-active">Messages</div>
      </div>
      
      <!-- Messages Container -->
      <div class="ursac-messages-container">
        <!-- Conversations List -->
        <div class="ursac-conversations-list" id="conversations-list">
          <!-- Loading state -->
          <div class="ursac-loading-state" id="loading-conversations">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading conversations...</p>
          </div>
          
          <!-- Empty state -->
          <div class="ursac-empty-state" id="empty-conversations" style="display: none;">
            <i class="fas fa-comments"></i>
            <p>No conversations yet</p>
            <button class="ursac-new-message-btn" id="new-message-btn">
              <i class="fas fa-plus"></i> Start a new conversation
            </button>
          </div>
          
          <!-- Conversation items will be added here dynamically -->
        </div>
        
        <!-- Active Conversation View -->
        <div class="ursac-conversation-view" id="conversation-view">
          <!-- Default state when no conversation is selected -->
          <div class="ursac-conversation-default" id="conversation-default">
            <div class="ursac-conversation-default-content">
              <i class="fas fa-comment-dots"></i>
              <h3>Your Messages</h3>
              <p>Select a conversation or start a new one</p>
              <button class="ursac-new-message-btn" id="new-message-btn-alt">
                <i class="fas fa-plus"></i> New Message
              </button>
            </div>
          </div>
          
          <!-- Conversation header -->
          <div class="ursac-conversation-header" id="conversation-header" style="display: none;">
            <div class="ursac-conversation-user">
              <div class="ursac-conversation-avatar">
                <span id="conversation-avatar-text">JS</span>
              </div>
              <div class="ursac-conversation-info">
                <div class="ursac-conversation-name" id="conversation-name">John Smith</div>
                <div class="ursac-conversation-status" id="conversation-status">Online</div>
              </div>
            </div>
            <div class="ursac-conversation-actions">
              <button class="ursac-conversation-action" title="Call">
                <i class="fas fa-phone"></i>
              </button>
              <button class="ursac-conversation-action" title="Video Call">
                <i class="fas fa-video"></i>
              </button>
              <button class="ursac-conversation-action" title="Info">
                <i class="fas fa-info-circle"></i>
              </button>
            </div>
          </div>
          
          <!-- Messages area -->
          <div class="ursac-messages-area" id="messages-area" style="display: none;">
            <!-- Messages will be added here dynamically -->
            <div class="ursac-message-date">Today</div>
            
            <div class="ursac-message ursac-message-received">
              <div class="ursac-message-avatar">
                <span>JS</span>
              </div>
              <div class="ursac-message-content">
                <div class="ursac-message-bubble">
                  Hi there! How are you doing today?
                </div>
                <div class="ursac-message-time">10:30 AM</div>
              </div>
            </div>
            
            <div class="ursac-message ursac-message-sent">
              <div class="ursac-message-content">
                <div class="ursac-message-bubble">
                  I'm doing great, thanks for asking! How about you?
                </div>
                <div class="ursac-message-time">10:32 AM</div>
              </div>
            </div>
            
            <div class="ursac-message ursac-message-received">
              <div class="ursac-message-avatar">
                <span>JS</span>
              </div>
              <div class="ursac-message-content">
                <div class="ursac-message-bubble">
                  I'm good too. Just wanted to check in about the project. Do you have any updates?
                </div>
                <div class="ursac-message-time">10:35 AM</div>
              </div>
            </div>
            
            <div class="ursac-message ursac-message-sent">
              <div class="ursac-message-content">
                <div class="ursac-message-bubble">
                  Yes, I've completed the first phase. I'll send you the documents later today.
                </div>
                <div class="ursac-message-time">10:36 AM</div>
              </div>
            </div>
          </div>
          
          <!-- Message input area -->
          <div class="ursac-message-input-area" id="message-input-area" style="display: none;">
            <button class="ursac-message-attachment-btn" title="Add attachment">
              <i class="fas fa-paperclip"></i>
            </button>
            <button class="ursac-message-media-btn" title="Add photo or video">
              <i class="fas fa-image"></i>
            </button>
            <input type="text" class="ursac-message-input" id="message-input" placeholder="Type a message...">
            <button class="ursac-message-send-btn" id="message-send-btn" disabled>
              <i class="fas fa-paper-plane"></i>
            </button>
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
        
        <div class="ursac-forum-list"">
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

  <!-- New Message Modal -->
  <div class="ursac-modal" id="new-message-modal">
    <div class="ursac-modal-content">
      <div class="ursac-modal-header">
        <h3>New Message</h3>
        <button class="ursac-modal-close" id="close-new-message-modal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="ursac-modal-body">
        <div class="ursac-form-group">
          <label for="recipient-search">To:</label>
          <input type="text" id="recipient-search" placeholder="Search for a friend...">
        </div>
        <div class="ursac-recipients-list" id="recipients-list">
          <!-- Recipients will be added here dynamically -->
        </div>
        <div class="ursac-form-group">
          <label for="new-message-text">Message:</label>
          <textarea id="new-message-text" placeholder="Type your message..."></textarea>
        </div>
      </div>
      <div class="ursac-modal-footer">
        <button class="ursac-button ursac-button-secondary" id="cancel-new-message">Cancel</button>
        <button class="ursac-button ursac-button-primary" id="send-new-message">Send</button>
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
  <script src="notifications.js"></script>
  <script src="messages.js"></script>
</body>
</html>
