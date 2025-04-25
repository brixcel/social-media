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
  
  <script>
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
        if (isEmail(emailOrStudentId)) {
          const userCredential = await firebase.auth().signInWithEmailAndPassword(emailOrStudentId, password);
          const user = userCredential.user;
          
          const snapshot = await firebase.database().ref('users/' + user.uid).once('value');
          const userData = snapshot.val();
          
          if (userData && userData.role === 'admin') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/homepage';
          }

          return { success: true, user, userData }; 


        } else {
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
          const userData = data[userId];
          
          if (!userData.email) {
            return { success: false, error: "User email not found" };
          }
          
          const userCredential = await firebase.auth().signInWithEmailAndPassword(userData.email, password);
          return { success: true, user: userCredential.user, userData };
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
        
        alert('Login successful! Welcome, ' + (result.userData.firstName || 'User'));
        if (result.userData && result.userData.role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/homepage';
        }


      } else {
        console.error('Login failed:', result.error);
        alert('Login failed: ' + result.error);
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
          
          firebase.database().ref('users')
            .orderByChild('email')
            .equalTo(user.email)
            .once('value')
            .then((snapshot) => {
              if (snapshot.exists()) {
                const userData = Object.values(snapshot.val())[0];
                
                localStorage.setItem('user', JSON.stringify({
                  uid: user.uid,
                  email: user.email,
                  ...userData
                }));
                
                alert('Google login successful! Welcome, ' + (userData.firstName || user.displayName || 'User'));                
                if (userData && userData.role === 'admin') {
                  window.location.href = '/admin';
                } else {
                  window.location.href = '/homepage';
                }

              } else {
                firebase.database().ref('users/' + user.uid).set({
                  firstName: user.displayName ? user.displayName.split(' ')[0] : '',
                  lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
                  email: user.email,
                  createdAt: firebase.database.ServerValue.TIMESTAMP,
                  provider: 'google'
                })
                .then(() => {
                  alert('Google account registered successfully! Welcome!');
                })
                .catch((error) => {
                  console.error('Error creating user:', error);
                  alert('Failed to create user: ' + error.message);
                });
              }
            });
        })
        .catch((error) => {
          console.error('Google sign-in error', error);
          alert('Google sign-in failed: ' + error.message);
        });
    });
    
    document.querySelector('.register-link').addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/register';
    });
    
    document.querySelector('.forgot-password').addEventListener('click', (e) => {
      e.preventDefault();
      const email = prompt("Please enter your email address to reset your password:");
      
      if (email) {
        firebase.auth().sendPasswordResetEmail(email)
          .then(() => {
            alert("Password reset email sent. Please check your inbox.");
          })
          .catch((error) => {
            console.error("Error sending password reset:", error);
            alert("Error: " + error.message);
          });
      }
    });
  </script>
</body>
</html>
