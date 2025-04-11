<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Register Page</title>
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
  <div class="container">
    <div class="logo">
      <h1><span class="bold">URSAC</span> Hub</h1>
    </div>
    <div class="form-card">
      <h2>Register now!</h2>
      <form id="register-form">
        <input type="text" placeholder="First Name" required id="first-name" />
        <input type="text" placeholder="Last Name" required id="last-name" />
        <input type="text" placeholder="Middle Name" id="middle-name" />
        <input type="text" placeholder="Student-ID" required id="student-id" />
        <button type="submit" class="submit-btn">→</button>
      </form>
      <p class="signin-text">
        Already have an account?
        <a href="{{ url('loginform') }}">SIGN-IN NOW!</a>
      </p>
    </div>
  </div>
  <script>
    const form = document.getElementById('register-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const firstName = document.getElementById('first-name').value;
      const lastName = document.getElementById('last-name').value;
      const middleName = document.getElementById('middle-name').value;
      const studentId = document.getElementById('student-id').value;
      firebase.database().ref('users').push({
        firstName,
        lastName,
        middleName,
        studentId
      }).then(() => {
        alert('Registration successful!');
        form.reset();
      }).catch((err) => {
        alert('Registration failed: ' + err.message);
      });
    });
  </script>
</body>
</html>

