<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Register - Social Media Demo</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/main.css" />
  <style>
    .demo-notice {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      color: #92400e;
      padding: 12px 16px;
      margin-bottom: 20px;
      border-radius: 6px;
      font-size: 0.9rem;
    }
    .error-box {
      background-color: #fef2f2;
      border: 1px solid #f87171;
      color: #991b1b;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 15px;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <div class="ursac-auth-bg">
    <div class="ursac-auth-logo">URSAC Hub</div>
    <div class="ursac-auth-card">
      <h2 class="ursac-auth-title">Register now!</h2>

      <div class="demo-notice">
        <strong>⚠️ DEMO PURPOSES ONLY</strong>
        Registration creates a local demo account.
      </div>

      @if ($errors->any())
        <div class="error-box">
          @foreach ($errors->all() as $error)
            <p>{{ $error }}</p>
          @endforeach
        </div>
      @endif

      <form action="{{ url('register') }}" method="POST">
        @csrf
        <div class="form-group">
          <label for="first_name">First Name</label>
          <input type="text" name="first_name" required id="first_name" class="form-control" placeholder="John" />
        </div>
        
        <div class="form-group">
          <label for="last_name">Last Name</label>
          <input type="text" name="last_name" required id="last_name" class="form-control" placeholder="Doe" />
        </div>

        <div class="form-group">
          <label for="middlename">Middle Name</label>
          <input type="text" name="middlename" required id="middlename" class="form-control" placeholder="Smith" />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" name="email" required id="email" class="form-control" placeholder="john@example.com" />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" name="password" required id="password" minlength="6" class="form-control" placeholder="••••••••" />
        </div>

        <button type="submit" class="login-btn" style="margin-top: 15px; width: 100%;">Create Account</button>
      </form>

      <p class="signin-text" style="margin-top: 20px;">
        Already have an account?<br>
        <a href="{{ url('login') }}" id="signin-link">SIGN-IN NOW!</a>
      </p>
    </div>
  </div>
</body>
</html>