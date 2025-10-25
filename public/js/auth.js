function updateAuthUI() {
  fetch('/api/user')
    .then(response => response.json())
    .then(user => {
      if (user.id) {
        // User is logged in
        document.getElementById('userInfo').textContent = `Hello, ${user.username}`;
        document.getElementById('loginLink').style.display = 'none';
        document.getElementById('signupLink').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'inline';
        document.getElementById('cartLink').style.display = 'inline';
      } else {
        // User is not logged in
        document.getElementById('userInfo').textContent = '';
        document.getElementById('loginLink').style.display = 'inline';
        document.getElementById('signupLink').style.display = 'inline';
        document.getElementById('logoutBtn').style.display = 'none';
        document.getElementById('cartLink').style.display = 'none';
      }
    })
    .catch(error => {
      console.error('Error checking auth status:', error);
      // Assume not logged in on error
      document.getElementById('userInfo').textContent = '';
      document.getElementById('loginLink').style.display = 'inline';
      document.getElementById('signupLink').style.display = 'inline';
      document.getElementById('logoutBtn').style.display = 'none';
      document.getElementById('cartLink').style.display = 'none';
    });
}

function logout() {
  fetch('/api/logout', { method: 'POST' })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        updateAuthUI();
        window.location.href = 'index.html';
      }
    })
    .catch(error => console.error('Error logging out:', error));
}

// Login form handler
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    })
    .then(response => response.json())
    .then(data => {
      const messageDiv = document.getElementById('message');
      if (data.success) {
        messageDiv.className = 'alert alert-success';
        messageDiv.textContent = 'Login successful!';
        messageDiv.style.display = 'block';
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } else {
        messageDiv.className = 'alert alert-danger';
        messageDiv.textContent = data.error || 'Login failed';
        messageDiv.style.display = 'block';
      }
    })
    .catch(error => {
      console.error('Error logging in:', error);
      const messageDiv = document.getElementById('message');
      messageDiv.className = 'alert alert-danger';
      messageDiv.textContent = 'Login failed';
      messageDiv.style.display = 'block';
    });
  });
}

// Signup form handler
if (document.getElementById('signupForm')) {
  document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
      const messageDiv = document.getElementById('message');
      messageDiv.className = 'alert alert-danger';
      messageDiv.textContent = 'Passwords do not match';
      messageDiv.style.display = 'block';
      return;
    }

    fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    })
    .then(response => response.json())
    .then(data => {
      const messageDiv = document.getElementById('message');
      if (data.success) {
        messageDiv.className = 'alert alert-success';
        messageDiv.textContent = 'Registration successful!';
        messageDiv.style.display = 'block';
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } else {
        messageDiv.className = 'alert alert-danger';
        messageDiv.textContent = data.error || 'Registration failed';
        messageDiv.style.display = 'block';
      }
    })
    .catch(error => {
      console.error('Error registering:', error);
      const messageDiv = document.getElementById('message');
      messageDiv.className = 'alert alert-danger';
      messageDiv.textContent = 'Registration failed';
      messageDiv.style.display = 'block';
    });
  });
}

// Logout button handler
if (document.getElementById('logoutBtn')) {
  document.getElementById('logoutBtn').addEventListener('click', function(e) {
    e.preventDefault();
    logout();
  });
}
