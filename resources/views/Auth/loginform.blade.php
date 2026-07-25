<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login - Social Media Demo</title>
  <link rel="stylesheet" href="{{ asset('main.css') }}" />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    .demo-notice {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      color: #92400e;
      padding: 12px 16px;
      margin-bottom: 20px;
      border-radius: 6px;
      font-size: 0.9rem;
      line-height: 1.4;
    }
    .demo-notice strong {
      display: block;
      margin-bottom: 4px;
    }
    .quick-login-container {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    .btn-quick-login {
      flex: 1;
      padding: 8px 12px;
      background: #e2e8f0;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
      transition: background 0.2s;
    }
    .btn-quick-login:hover {
      background: #cbd5e1;
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
  <div class="login-logo">
    <h1><span class="bold">URSAC</span> Hub</h1>
  </div>

  <div class="login-main-ctn">
    <div class="login-container">
      <div class="form-card">
        <h2>Welcome GIANT!</h2>

        <!-- DEMO NOTICE BANNER -->
        <div class="demo-notice">
          <strong>⚠️ DEMO PURPOSES ONLY</strong>
          This application is running in demonstration mode. Some live integrations may not work properly.
        </div>

        @if ($errors->any())
          <div class="error-box">
            @foreach ($errors->all() as $error)
              <p>{{ $error }}</p>
            @endforeach
          </div>
        @endif

        <!-- QUICK DEMO LOGINS -->
        <div class="quick-login-container">
          <button type="button" class="btn-quick-login" onclick="fillCredentials('admin@example.com', 'password123')">⚡ Demo Admin</button>
          <button type="button" class="btn-quick-login" onclick="fillCredentials('user@example.com', 'password123')">⚡ Demo User</button>
        </div>
        
        <form action="{{ route('login.process') }}" method="POST">
          @csrf
          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input type="email" class="form-control" name="email" id="email" required placeholder="admin@example.com" />
          </div>
          
          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input type="password" class="form-control" name="password" id="password" required placeholder="••••••••" />
          </div>
          
          <div class="form-footer">
            <a href="#" class="forgot-password" onclick="alert('Demo Mode: Use quick login buttons above.')">Forgot Password?</a>
            <div class="remember-me">
              <label for="remember-me">Save Login</label>
              <input type="checkbox" id="remember-me" name="remember" />
            </div>
          </div>
          
          <button type="submit" class="login-btn">Sign-In</button>
        </form>
        
        <div class="divider"></div>
        
        <p class="register-text">
          Don't have an account yet?<br>
          <a href="/register" class="register-link">REGISTER NOW!</a>
        </p>
      </div>
    </div>
  </div>

  <script>
    function fillCredentials(email, password) {
      document.getElementById('email').value = email;
      document.getElementById('password').value = password;
    }
  </script>
</body>
</html>