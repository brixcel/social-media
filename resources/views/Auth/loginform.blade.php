<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login Page</title>
  <link rel="stylesheet" href="main.css" />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-auth.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-database.js"></script>
  <script>
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
    
    firebase.initializeApp(firebaseConfig);
  </script>
  
</head>
<body>
  <div class="login-logo">
    <h1><span class="bold">URSAC</span> Hub</h1>
  </div>

  <div class="login-main-ctn">
    <div class="login-container">
      <div class="form-card">
        <h2>Welcome GIANT!</h2>
        
        <form id="login-form">
          <div class="form-group" id="email-group">
            <label class="form-label" for="email-student-id">Email / Student-ID</label>
            <input type="text" class="form-control" id="email-student-id" required />
          </div>
          
          <div class="form-group" id="password-group">
            <label class="form-label" for="password">Password</label>
            <input type="password" class="form-control" id="password" required />
          </div>
          
          <div class="form-footer">
            <a href="#" class="forgot-password">Forgot Password?</a>
            <div class="remember-me">
              <label for="remember-me">Save Login</label>
              <input type="checkbox" id="remember-me" />
            </div>
          </div>
          
          <button type="submit" class="login-btn">Sign-In</button>
        </form>
        
        <div class="divider"></div>
        
        <button class="google-btn" id="google-signin">
          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="Google" class="google-icon">
          Sign-In with Google
        </button>
        
        <p class="register-text">
          Don't have an account yet?<br>
          <a href="#" class="register-link">REGISTER NOW!</a>
        </p>
      </div>
    </div>
  </div>

  <!-- Modal Template -->
  <div id="modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Message</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <p id="modal-message"></p>
      </div>
      <div class="modal-footer">
        <button id="modal-confirm" class="modal-button">OK</button>
      </div>
    </div>
  </div>
  
  <!-- Prompt Modal Template -->
  <div id="prompt-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Enter Information</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <p id="prompt-message"></p>
        <input type="text" id="prompt-input" class="form-control" />
      </div>
      <div class="modal-footer">
        <button id="prompt-cancel" class="modal-button secondary">Cancel</button>
        <button id="prompt-confirm" class="modal-button">OK</button>
      </div>
    </div>
  </div>
  
  <script>
    // Modal functions
    function showModal(message, title = "Message", type = "info", callback = null) {
      const modal = document.getElementById('modal');
      const modalTitle = document.querySelector('.modal-title');
      const modalMessage = document.getElementById('modal-message');
      const modalContent = document.querySelector('.modal-content');
      const modalConfirm = document.getElementById('modal-confirm');
      
      // Reset modal classes
      modalContent.classList.remove('modal-success', 'modal-error', 'modal-info');
      
      // Set modal content
      modalTitle.textContent = title;
      modalMessage.textContent = message;
      
      // Set modal type
      if (type === 'success') {
        modalContent.classList.add('modal-success');
      } else if (type === 'error') {
        modalContent.classList.add('modal-error');
      } else {
        modalContent.classList.add('modal-info');
      }
      
      // Show modal
      modal.style.display = 'flex';
      
      // Handle close button
      document.querySelector('.modal-close').onclick = function() {
        modal.style.display = 'none';
        if (callback) callback(false);
      };
      
      // Handle confirm button
      modalConfirm.onclick = function() {
        modal.style.display = 'none';
        if (callback) callback(true);
      };
      
      // Close when clicking outside
      modal.onclick = function(event) {
        if (event.target === modal) {
          modal.style.display = 'none';
          if (callback) callback(false);
        }
      };
    }
    
    function showPromptModal(message, defaultValue = "", callback) {
      const promptModal = document.getElementById('prompt-modal');
      const promptMessage = document.getElementById('prompt-message');
      const promptInput = document.getElementById('prompt-input');
      const promptCancel = document.getElementById('prompt-cancel');
      const promptConfirm = document.getElementById('prompt-confirm');
      
      // Set prompt content
      promptMessage.textContent = message;
      promptInput.value = defaultValue;
      
      // Show prompt
      promptModal.style.display = 'flex';
      promptInput.focus();
      
      // Handle close button
      document.querySelectorAll('#prompt-modal .modal-close').forEach(btn => {
        btn.onclick = function() {
          promptModal.style.display = 'none';
          callback(null);
        };
      });
      
      // Handle cancel button
      promptCancel.onclick = function() {
        promptModal.style.display = 'none';
        callback(null);
      };
      
      // Handle confirm button
      promptConfirm.onclick = function() {
        const value = promptInput.value.trim();
        promptModal.style.display = 'none';
        callback(value);
      };
      
      // Close when clicking outside
      promptModal.onclick = function(event) {
        if (event.target === promptModal) {
          promptModal.style.display = 'none';
          callback(null);
        }
      };
      
      // Handle Enter key
      promptInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
          const value = promptInput.value.trim();
          promptModal.style.display = 'none';
          callback(value);
        }
      });
    }
    
    const form = document.getElementById('login-form');
    const emailGroup = document.getElementById('email-group');
    const passwordGroup = document.getElementById('password-group');
    
    function showError(element, isError) {
      if (isError) {
        element.classList.add('error');
      } else {
        element.classList.remove('error');
      }
    }
    
    function isEmail(input) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(input);
    }
    
    async function authenticateUser(emailOrStudentId, password) {
      try {
        let userCredential, user, userData;

        if (isEmail(emailOrStudentId)) {
          // Sign in with email/password
          userCredential = await firebase.auth().signInWithEmailAndPassword(emailOrStudentId, password);
          user = userCredential.user;

          // Check if user exists in Realtime Database
          const snapshot = await firebase.database().ref('users/' + user.uid).once('value');
          userData = snapshot.val();

          if (!userData) {
            // User does not exist in database, sign out and block login
            await firebase.auth().signOut();
            return { success: false, error: "Your account has been removed. Please register first." };
          }

          return { success: true, user, userData };
        } else {
          // Lookup by student ID
          const snapshot = await firebase.database()
            .ref('users')
            .orderByChild('studentId')
            .equalTo(emailOrStudentId)
            .once('value');
          const data = snapshot.val();

          if (!data) {
            return { success: false, error: "No user found with this Student ID" };
          }

          const userId = Object.keys(data)[0];
          userData = data[userId];

          if (!userData.email) {
            return { success: false, error: "User email not found" };
          }

          // Sign in with email/password
          userCredential = await firebase.auth().signInWithEmailAndPassword(userData.email, password);
          user = userCredential.user;

          // Double-check user still exists in DB
          const dbCheck = await firebase.database().ref('users/' + user.uid).once('value');
          if (!dbCheck.exists()) {
            await firebase.auth().signOut();
            return { success: false, error: "Your account has been removed. Please register first." };
          }

          return { success: true, user, userData };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      showError(emailGroup, false);
      showError(passwordGroup, false);
      
      const emailStudentId = document.getElementById('email-student-id').value;
      const password = document.getElementById('password').value;
      const rememberMe = document.getElementById('remember-me').checked;
      
      if (!emailStudentId) {
        showError(emailGroup, true);
        return;
      }
      
      if (!password) {
        showError(passwordGroup, true);
        return;
      }
      
      const submitButton = form.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.textContent = "Signing in...";
      submitButton.disabled = true;
      
      const result = await authenticateUser(emailStudentId, password);
      
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
      
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('user', JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            ...result.userData
          }));
        }
        firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function(idToken) {
          fetch('/firebase-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({ idToken: idToken })
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              // Now backend session is set, you can redirect
              window.location.href = '/homepage';
            } else {
              showModal(
                'Session sync failed: ' + data.error, 
                'Error', 
                'error'
              );
            }
          });
        });
        
        showModal(
          'Login successful! Welcome, ' + (result.userData.firstName || 'User'), 
          'Success', 
          'success',
          () => {
            if (result.userData && result.userData.role === 'admin') {
              window.location.href = '/admin';
            } else {
              window.location.href = '/homepage';
            }
          }
        );
      } else {
        console.error('Login failed:', result.error);
        showModal(
          'Login failed: ' + result.error, 
          'Error', 
          'error'
        );
        showError(emailGroup, true);
        showError(passwordGroup, true);
      }
    });
    
    document.getElementById('google-signin').addEventListener('click', () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider)
        .then((result) => {
          const user = result.user;
          console.log('Google sign-in successful', user);

          // Check if the user's email exists in the users node of the database
          firebase.database().ref('users')
            .orderByChild('email')
            .equalTo(user.email)
            .once('value')
            .then((snapshot) => {
              if (snapshot.exists()) {
                // User is registered in the database
                const userData = Object.values(snapshot.val())[0];

                // Proceed with login
                localStorage.setItem('user', JSON.stringify({
                  uid: user.uid,
                  email: user.email,
                  ...userData
                }));
                firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function(idToken) {
                  fetch('/firebase-session', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify({ idToken: idToken })
                  })
                  .then(response => response.json())
                  .then(data => {
                    if (data.success) {
                      // Now backend session is set, you can redirect
                      window.location.href = '/homepage';
                    } else {
                      showModal(
                        'Session sync failed: ' + data.error, 
                        'Error', 
                        'error'
                      );
                    }
                  });
                });

                showModal(
                  'Google login successful! Welcome, ' + (userData.firstName || user.displayName || 'User'), 
                  'Success', 
                  'success',
                  () => {
                    if (userData && userData.role === 'admin') {
                      window.location.href = '/admin';
                    } else {
                      window.location.href = '/homepage';
                    }
                  }
                );
              } else {
                // User not registered in database
                showModal(
                  'Your Google account is not registered. Please register first.', 
                  'Registration Required', 
                  'info',
                  () => {
                    firebase.auth().signOut();
                    window.location.href = '/register';
                  }
                );
              }
            })
            .catch((error) => {
              console.error('Database error:', error);
              showModal(
                'An error occurred while checking registration: ' + error.message, 
                'Error', 
                'error'
              );
              firebase.auth().signOut();
            });
        })
        .catch((error) => {
          console.error('Google sign-in error', error);
          showModal(
            'Google sign-in failed: ' + error.message, 
            'Error', 
            'error'
          );
        });
    });
    
    document.querySelector('.register-link').addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/register';
    });
    
    document.querySelector('.forgot-password').addEventListener('click', (e) => {
      e.preventDefault();
      
      showPromptModal("Please enter your email address to reset your password:", "", function(email) {
        if (email) {
          firebase.auth().sendPasswordResetEmail(email)
            .then(() => {
              showModal(
                "Password reset email sent. Please check your inbox.", 
                "Password Reset", 
                "success"
              );
            })
            .catch((error) => {
              console.error("Error sending password reset:", error);
              showModal(
                "Error: " + error.message, 
                "Password Reset Failed", 
                "error"
              );
            });
        }
      });
    });
  </script>
</body>
</html>