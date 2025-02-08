// Handle tab switching
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and forms
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding form
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.tab}Form`).classList.add('active');
    });
});

// Toggle password visibility
document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        const input = e.target.previousElementSibling;
        if (input.type === 'password') {
            input.type = 'text';
            e.target.classList.remove('fa-eye');
            e.target.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            e.target.classList.remove('fa-eye-slash');
            e.target.classList.add('fa-eye');
        }
    });
});

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        // Store auth state
        localStorage.setItem('currentUser', JSON.stringify({
            name: user.name,
            email: user.email,
            loggedIn: true
        }));

        if (rememberMe) {
            localStorage.setItem('rememberMe', JSON.stringify({ email, password }));
        } else {
            localStorage.removeItem('rememberMe');
        }

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } else {
        alert('Invalid email or password');
    }
});

// Handle signup form submission
document.getElementById('signupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const termsAccepted = document.getElementById('termsAccept').checked;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    if (!termsAccepted) {
        alert('Please accept the Terms of Service and Privacy Policy');
        return;
    }

    // Get existing users
    const users = JSON.parse(localStorage.getItem('users')) || [];

    // Check if user already exists
    if (users.some(user => user.email === email)) {
        alert('An account with this email already exists');
        return;
    }

    // Add new user
    users.push({ name, email, password });
    localStorage.setItem('users', JSON.stringify(users));

    // Auto login after signup
    localStorage.setItem('currentUser', JSON.stringify({
        name,
        email,
        loggedIn: true
    }));

    // Redirect to dashboard
    window.location.href = 'dashboard.html';
});

// Check for remembered login
window.addEventListener('load', () => {
    const remembered = JSON.parse(localStorage.getItem('rememberMe'));
    if (remembered) {
        document.getElementById('loginEmail').value = remembered.email;
        document.getElementById('loginPassword').value = remembered.password;
        document.getElementById('rememberMe').checked = true;
    }
});

// Handle social login buttons (mock functionality)
document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        alert('Social login functionality will be implemented with actual OAuth providers');
    });
});
