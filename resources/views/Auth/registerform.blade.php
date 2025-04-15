<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Register Page</title>
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
  <link rel="stylesheet" href="main.css" />
</head>
<body>
  <div class="container">
    <div class="logo">URSAC Hub</div>
    <div class="form-card">
      <h2>Register now!</h2>
      
      <!-- Step 1: First Name, Last Name, Middle Name, Student ID -->
      <form id="step1-form" class="form-step active">
        <label for="first-name">First Name</label>
        <input type="text" required id="first-name" />
        
        <label for="last-name">Last Name</label>
        <input type="text" required id="last-name" />
        
        <label for="middle-name">Middle Name</label>
        <input type="text" id="middle-name" />
        
        <label for="student-id">Student-ID</label>
        <input type="text" required id="student-id" />
        
        <button type="button" id="next-btn" class="submit-btn">→</button>
      </form>
      
      <!-- Step 2: Email, Password, Confirm Password -->
      <form id="step2-form" class="form-step">
        <label for="email">Email</label>
        <input type="email" required id="email" />
        
        <label for="password">Password</label>
        <input type="password" required id="password" minlength="6" />
        
        <label for="confirm-password">Confirm Password</label>
        <input type="password" required id="confirm-password" minlength="6" />
        <select name="role">
    <option value="user">User</option>
    <option value="admin">Admin</option>
</select>

        
        <button type="button" id="submit-btn" class="submit-btn">→</button>
      </form>
      
      <p class="signin-text">
        Already have an account?<br>
        <a href="{{ url('login') }}" id="signin-link">SIGN-IN NOW!</a>
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
      const studentId = document.getElementById('student-id');
      
      if (!firstName.checkValidity()) {
        firstName.reportValidity();
        return;
      }
      
      if (!lastName.checkValidity()) {
        lastName.reportValidity();
        return;
      }
      
      if (!studentId.checkValidity()) {
        studentId.reportValidity();
        return;
      }
      
      // Store step 1 data
      formData.firstName = firstName.value;
      formData.lastName = lastName.value;
      formData.middleName = document.getElementById('middle-name').value;
      formData.studentId = studentId.value;
      
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
      
      // Check if passwords match
      if (password.value !== confirmPassword.value) {
        alert('Passwords do not match!');
        return;
      }
      
      // Disable button to prevent multiple submissions
      submitBtn.disabled = true;
      submitBtn.textContent = "...";
      
      // Get step 2 values
      const emailValue = email.value;
      const passwordValue = password.value;
      
      console.log("Creating user with:", emailValue, passwordValue);
      
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
              studentId: formData.studentId,
              email: emailValue,
              createdAt: firebase.database.ServerValue.TIMESTAMP
            });
          })
          .then(() => {
            console.log("User data saved to database");
            alert('Registration successful! You can now login with your email and password.');
            
            // Reset forms
            step1Form.reset();
            step2Form.reset();
            
            // Reset to step 1
            step2Form.classList.remove('active');
            step1Form.classList.add('active');
            
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.textContent = "→";
          })
          .catch((error) => {
            console.error("Error during registration:", error);
            alert('Registration failed: ' + error.message);
            
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.textContent = "→";
          });
      } catch (e) {
        console.error("Exception caught:", e);
        alert('An error occurred: ' + e.message);
        
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = "→";
      }
    });
    
    // Add console logs to debug
    document.addEventListener('DOMContentLoaded', function() {
      console.log("DOM fully loaded");
      console.log("Next button:", nextBtn);
      console.log("Submit button:", submitBtn);
      
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