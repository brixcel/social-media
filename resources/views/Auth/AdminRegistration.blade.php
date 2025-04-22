<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Registration - CMS</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
  <!-- Firebase App (the core Firebase SDK) -->
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-app.js"></script>
  <!-- Firebase Authentication -->
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-auth.js"></script>
  <!-- Firebase Realtime Database -->
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-database.js"></script>
  <!-- Initialize Firebase -->
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
    
    // Initialize Firebase with Firebase v8 syntax
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
  </script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Poppins', sans-serif;
    }
    
    body {
      background-color: #1672E3;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .container {
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
      position: relative;
    }
    
    .logo {
      color: white;
      font-size: 40px;
      font-weight: 800;
      margin-bottom: 20px;
      position: absolute;
      top: 20px;
      left: 40px;
    }
    
    .form-card {
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      padding: 40px;
      margin: 80px auto 0;
      max-width: 550px;
      position: relative;
    }
    
    h2 {
      color: #0A4B98;
      font-size: 24px;
      margin-bottom: 25px;
      text-align: center;
    }
    
    label {
      display: block;
      font-size: 14px;
      color: #666;
      margin-bottom: 6px;
      font-weight: 500;
    }
    
    input, select {
      width: 100%;
      padding: 12px 15px;
      margin-bottom: 20px;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 14px;
      transition: border 0.3s;
    }
    
    input:focus, select:focus {
      outline: none;
      border-color: #1672E3;
    }
    
    .submit-btn {
      background-color: #1672E3;
      color: white;
      border: none;
      border-radius: 30px;
      padding: 12px 20px;
      font-size: 16px;
      cursor: pointer;
      width: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 10px auto;
      transition: background-color 0.3s;
    }
    
    .submit-btn:hover {
      background-color: #0A4B98;
    }
    
    .signin-text {
      font-size: 14px;
      color: #666;
      text-align: center;
      margin-top: 20px;
    }
    
    #signin-link {
      color: #1672E3;
      text-decoration: none;
      font-weight: 600;
    }
    
    .form-step {
      display: none;
    }
    
    .form-step.active {
      display: block;
    }
    
    .arrow-btn {
      background-color: #1672E3;
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      cursor: pointer;
      margin: 0 auto;
    }
    
    .arrow-icon {
      border: solid white;
      border-width: 0 3px 3px 0;
      display: inline-block;
      padding: 3px;
      transform: rotate(-45deg);
    }
    
    .already-account {
      text-align: center;
      margin-top: 20px;
    }
    
    .sign-in-now {
      color: #1672E3;
      font-weight: bold;
      text-decoration: none;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">URSAC Hub</div>
    <div class="form-card">
      <h2>Register now!</h2>
      
      <!-- Step 1: First Name, Last Name, Position/Title -->
      <form id="step1-form" class="form-step active">
        <label for="first-name">First Name</label>
        <input type="text" required id="first-name" />
        
        <label for="last-name">Last Name</label>
        <input type="text" required id="last-name" />
        
        <label for="middle-name">Middle Name</label>
        <input type="text" id="middle-name" />
        
        <label for="admin-id">Admin ID</label>
        <input type="text" required id="admin-id" placeholder="Unique identifier for this admin" />
        
        <button type="button" class="arrow-btn" id="next-btn">
          <span class="arrow-icon"></span>
        </button>
      </form>
      
      <!-- Step 2: Email, Password, Confirm Password, Security Question -->
      <form id="step2-form" class="form-step">
        <label for="email">Email</label>
        <input type="email" required id="email" />
        
        <label for="password">Password</label>
        <input type="password" required id="password" minlength="8" />
        
        <label for="confirm-password">Confirm Password</label>
        <input type="password" required id="confirm-password" minlength="8" />

        <label for="user-type">User Type</label>
        <select id="user-type" required>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        
        <button type="button" class="arrow-btn" id="submit-btn">
          <span class="arrow-icon"></span>
        </button>
      </form>
      
      <p class="already-account">
        Already have an account?<br>
        <a href="#" id="signin-link" class="sign-in-now">SIGN-IN NOW!</a>
      </p>
    </div>
  </div>
  
  <script>
    // Get form elements
    const step1Form = document.getElementById('step1-form');
    const step2Form = document.getElementById('step2-form');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    // Store form data
    let formData = {};
    
    // Debug click events
    console.log("Script loaded");
    
    // Add click event listener to next button
    nextBtn.addEventListener('click', function() {
      console.log("Next button clicked");
      
      // Validate step 1 inputs
      const firstName = document.getElementById('first-name');
      const lastName = document.getElementById('last-name');
      const middleName = document.getElementById('middle-name');
      const adminId = document.getElementById('admin-id');
      
      if (!firstName.checkValidity()) {
        firstName.reportValidity();
        return;
      }
      
      if (!lastName.checkValidity()) {
        lastName.reportValidity();
        return;
      }
      
      if (!adminId.checkValidity()) {
        adminId.reportValidity();
        return;
      }
      
      // Store step 1 data
      formData.firstName = firstName.value;
      formData.lastName = lastName.value;
      formData.middleName = middleName.value;
      formData.adminId = adminId.value;
      
      // Move to step 2
      step1Form.classList.remove('active');
      step2Form.classList.add('active');
    });
    
    // Add click event listener to submit button
    submitBtn.addEventListener('click', function() {
      console.log("Submit button clicked");
      
      // Validate step 2 inputs
      const email = document.getElementById('email');
      const password = document.getElementById('password');
      const confirmPassword = document.getElementById('confirm-password');
      const userType = document.getElementById('user-type');
      
      if (!email.checkValidity()) {
        email.reportValidity();
        return;
      }
      
      if (!password.checkValidity()) {
        password.reportValidity();
        return;
      }
      
      if (!confirmPassword.checkValidity()) {
        confirmPassword.reportValidity();
        return;
      }
      
      if (password.value !== confirmPassword.value) {
        alert('Passwords do not match!');
        return;
      }
      
      // Validate password strength
      if (password.value.length < 8) {
        alert('Password must be at least 8 characters');
        return;
      }
      
      // Disable button to prevent multiple submissions
      submitBtn.disabled = true;
      
      // Get step 2 values
      const emailValue = email.value;
      const passwordValue = password.value;
      const userTypeValue = userType.value;
      
      console.log("Creating user with:", emailValue);
      
      try {
        // Create user with email and password
        firebase.auth().createUserWithEmailAndPassword(emailValue, passwordValue)
          .then((userCredential) => {
            console.log("User created successfully");
            // Get user ID from the authentication
            const userId = userCredential.user.uid;
            
            // Save additional user data to the database
            return firebase.database().ref('users/' + userId).set({
              firstName: formData.firstName,
              lastName: formData.lastName,
              middleName: formData.middleName,
              adminId: formData.adminId,
              email: emailValue,
              role: userTypeValue,
              createdAt: firebase.database.ServerValue.TIMESTAMP
            });
          })
          .then(() => {
            console.log("User data saved to database");
            alert('Registration successful! You can now login.');
            
            // Redirect to login page
            window.location.href = '/admin';
          })
          .catch((error) => {
            console.error("Error during registration:", error);
            alert('Registration failed: ' + error.message);
            
            // Re-enable button
            submitBtn.disabled = false;
          });
      } catch (e) {
        console.error("Exception caught:", e);
        alert('An error occurred: ' + e.message);
        
        // Re-enable button
        submitBtn.disabled = false;
      }
    });
    
    // Add console logs to debug
    document.addEventListener('DOMContentLoaded', function() {
      console.log("DOM fully loaded");
      
      // Verify Firebase is properly initialized
      if (firebase.apps.length > 0) {
        console.log("Firebase is initialized correctly");
      } else {
        console.error("Firebase initialization failed");
      }
    });
  </script>
</body>
</html>