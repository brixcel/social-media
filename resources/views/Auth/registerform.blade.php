<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Register Page</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/main.css" />
  <!-- Firebase App (the core Firebase SDK) -->
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-auth.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.6.1/firebase-database.js"></script>
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <meta name="app-url" content="{{ url('/') }}">
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
  <div class="ursac-auth-bg">
    <div class="ursac-auth-logo">URSAC Hub</div>
    <div class="ursac-auth-card">
      <h2 class="ursac-auth-title">Register now!</h2>
      <!-- Step 1: Name and Email -->
      <form id="step1-form" class="form-step active">
        <label for="first-name">First Name</label>
        <input type="text" required id="first-name" />
        <label for="last-name">Last Name</label>
        <input type="text" required id="last-name" />
        <label for="middle-name">Middle Name</label>
        <input type="text" id="middle-name" />
        <label for="email">Email</label>
        <input type="email" required id="email" />
        <button type="button" id="next-btn" class="submit-btn">→</button>
      </form>
      <!-- Step 2: Student ID, Program, Password -->
      <form id="step2-form" class="form-step">
        <label for="student-id">Student-ID</label>
        <input type="text" required id="student-id" />
        <label for="program">Program</label>
        <input type="text" required id="program" />
        <label for="password">Password</label>
        <input type="password" required id="password" minlength="6" />
        <label for="confirm-password">Confirm Password</label>
        <input type="password" required id="confirm-password" minlength="6" />
        <button type="button" id="submit-btn" class="submit-btn">→</button>
      </form>
      <!-- Step 3: Email Verification Notice -->
      <div id="step3-verification" class="form-step">
        <div class="ursac-verification-title">
          Please verify your email address
        </div>
        <div>
          We've sent a verification link to:<br>
          <span id="verify-email" class="ursac-verification-email"></span>
        </div>
        <div style="margin: 18px 0;">
          <span>Didn't receive an email?</span>
          <a href="#" id="resend-link" class="ursac-resend-link">Resend Verification Email</a>
        </div>
        <div>
          <strong>After verifying, you can <a href="{{ url('login') }}">login here</a>.</strong>
        </div>
      </div>
      <p class="signin-text">
        Already have an account?<br>
        <a href="{{ url('login') }}" id="signin-link">SIGN-IN NOW!</a>
      </p>
    </div>
  </div>
  <script>
    // Step navigation
    const step1Form = document.getElementById('step1-form');
    const step2Form = document.getElementById('step2-form');
    const step3Verification = document.getElementById('step3-verification');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const resendLinkBtn = document.getElementById('resend-link');
    const verifyEmailSpan = document.getElementById('verify-email');

    let formData = {};
    let currentUser = null;

    // Step 1: Next
    nextBtn.addEventListener('click', function() {
      if (!step1Form.reportValidity()) return;
      formData.firstName = document.getElementById('first-name').value;
      formData.lastName = document.getElementById('last-name').value;
      formData.middleName = document.getElementById('middle-name').value;
      formData.email = document.getElementById('email').value;
      step1Form.classList.remove('active');
      step2Form.classList.add('active');
    });

    // Step 2: Submit and send verification email
    submitBtn.addEventListener('click', async function() {
      try {
        if (!step2Form.reportValidity()) return;
        
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (password !== confirmPassword) {
          alert('Passwords do not match!');
          return;
        }
        
        // Disable submit button to prevent double submission
        submitBtn.disabled = true;
        
        formData.studentId = document.getElementById('student-id').value;
        formData.program = document.getElementById('program').value;
        formData.password = password;

        // Check student ID first
        const idSnapshot = await firebase.database().ref('users')
          .orderByChild('studentId')
          .equalTo(formData.studentId)
          .once('value');

        if (idSnapshot.exists()) {
          alert('This Student ID is already registered. Please use another one.');
          submitBtn.disabled = false;
          return;
        }

        // Create user account
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(
          formData.email, 
          formData.password
        );
        
        currentUser = userCredential.user;

        // Wait for user to be fully created before continuing
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Save user data to database
        await firebase.database().ref('users/' + currentUser.uid).set({
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName,
          studentId: formData.studentId,
          program: formData.program,
          email: formData.email,
          emailVerified: false,
          createdAt: firebase.database.ServerValue.TIMESTAMP
        });

        // Send verification email
        await currentUser.sendEmailVerification({
          url: window.location.origin + '/login' // Add redirect URL
        });

        // Get fresh token and sync session
        const idToken = await currentUser.getIdToken(true);
        
        await fetch('/firebase-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
          },
          body: JSON.stringify({ idToken: idToken })
        });

        // Show verification screen
        verifyEmailSpan.textContent = formData.email;
        step2Form.classList.remove('active');
        step3Verification.classList.add('active');
        
        alert('Verification email sent! Please check your inbox and verify your email address.');

      } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed: ' + error.message);
        submitBtn.disabled = false;
      }
    });

    // Resend verification email
    resendLinkBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      
      try {
        const user = firebase.auth().currentUser;
        if (!user) {
          throw new Error('No user found to resend verification email.');
        }

        await user.sendEmailVerification({
          url: window.location.origin + '/login'
        });
        
        alert('Verification email resent! Please check your inbox.');
      } catch (error) {
        console.error('Resend verification error:', error);
        alert('Failed to resend verification email: ' + error.message);
      }
    });
  </script>
</body>
</html>