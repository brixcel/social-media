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
      apiKey: "{{ config('services.firebase.api_key') }}",
      authDomain: "{{ config('services.firebase.auth_domain') }}",
      databaseURL: "{{ config('services.firebase.database_url') }}",
      projectId: "{{ config('services.firebase.project_id') }}",
      storageBucket: "{{ config('services.firebase.storage_bucket') }}",
      messagingSenderId: "{{ config('services.firebase.messaging_sender_id') }}",
      appId: "{{ config('services.firebase.app_id') }}",
      measurementId: "{{ config('services.firebase.measurement_id') }}"
    };
    firebase.initializeApp(firebaseConfig);
  </script>
</head>
<body>
  <div class="logo">
    <h1><span class="bold">URSAC</span> Hub</h1>
  </div>
  
  <div class="container">
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
            <label for="remember-me">Remember Me</label>
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
    
    // Function to show error state
    function showError(element, isError) {
      if (isError) {
        element.classList.add('error');
      } else {
        element.classList.remove('error');
      }
    }
    
    // Function to check if user exists in Firebase
    async function checkUserCredentials(emailOrStudentId, password) {
      try {
        // First, try to find the user by student ID
        const studentIdSnapshot = await firebase.database()
          .ref('users')
          .orderByChild('studentId')
          .equalTo(emailOrStudentId)
          .once('value');
        
        const studentIdData = studentIdSnapshot.val();
        
        if (studentIdData) {
          // User found by student ID
          const userId = Object.keys(studentIdData)[0];
          const userData = studentIdData[userId];
          
          // Here you would normally check the password
          // For demo purposes, we're just checking if the user exists
          // In a real app, you would use Firebase Authentication or a secure password check
          
          return { success: true, userData };
        }
        
        // If not found by student ID, try email authentication
        try {
          // This is a simplified example - in a real app, you would use Firebase Authentication
          // For demo purposes, we're just checking if the user exists in the database
          const emailSnapshot = await firebase.database()
            .ref('users')
            .orderByChild('email')
            .equalTo(emailOrStudentId)
            .once('value');
          
          const emailData = emailSnapshot.val();
          
          if (emailData) {
            // User found by email
            const userId = Object.keys(emailData)[0];
            const userData = emailData[userId];
            
            return { success: true, userData };
          }
          
          // User not found
          return { success: false, error: 'Invalid email/student ID or password' };
        } catch (error) {
          console.error('Email auth error:', error);
          return { success: false, error: 'Authentication failed' };
        }
      } catch (error) {
        console.error('Database error:', error);
        return { success: false, error: 'Authentication failed' };
      }
    }
    
    // Form submission handler
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Reset error states
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
      
      // Check credentials against Firebase
      const result = await checkUserCredentials(emailStudentId, password);
      
      if (result.success) {
        // Successful login
        console.log('Login successful', result.userData);
        
        // Store in local storage if remember me is checked
        if (rememberMe) {
          localStorage.setItem('user', JSON.stringify(result.userData));
        }
        
        // Redirect to dashboard or home page
        // window.location.href = '/dashboard';
        alert('Login successful!');
      } else {
        // Failed login
        console.error('Login failed:', result.error);
        showError(emailGroup, true);
        showError(passwordGroup, true);
      }
    });
    
    // Google sign-in handler
    document.getElementById('google-signin').addEventListener('click', () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider)
        .then((result) => {
          // Check if the Google user exists in your database
          const user = result.user;
          console.log('Google sign-in successful', user);
          
          // You might want to check if this Google user is registered in your system
          firebase.database().ref('users')
            .orderByChild('email')
            .equalTo(user.email)
            .once('value')
            .then((snapshot) => {
              if (snapshot.exists()) {
                // User exists, proceed with login
                alert('Google login successful!');
                // window.location.href = '/dashboard';
              } else {
                // User doesn't exist, you might want to register them
                // or show an error message
                alert('This Google account is not registered. Please register first.');
              }
            });
        })
        .catch((error) => {
          console.error('Google sign-in error', error);
          alert('Google sign-in failed: ' + error.message);
        });
    });
    
    // Link to registration page
    document.querySelector('.register-link').addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/register';
    });
  </script>
</body>
</html>