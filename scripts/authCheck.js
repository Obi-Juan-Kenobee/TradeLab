// Check if user is logged in
function isLoggedIn() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    return currentUser && currentUser.loggedIn;
}

// Handle logout
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Protect dashboard route
if (window.location.pathname.includes('/pages/calendar-dashboard.html')) {
    if (!isLoggedIn()) {
        window.location.href = 'auth.html';
    }
}

// Update navigation based on auth state
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelector('.nav-links');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (currentUser && currentUser.loggedIn) {
        // Add user menu if logged in
        const userMenuItem = document.createElement('li');
        userMenuItem.innerHTML = `
            <div class="user-menu">
                <span>${currentUser.name} ▼</span>
                <div class="user-dropdown">
                    <a href="/pages/calendar-dashboard.html">Dashboard</a>
                    <a href="#" onclick="logout()">Logout</a>
                </div>
            </div>
        `;
        navLinks.appendChild(userMenuItem);
    }

    // Update CTA buttons to point to auth page if not logged in
    document.querySelectorAll('a[href="#"]').forEach(link => {
        if (link.classList.contains('btn-primary') || link.classList.contains('cta-button')) {
            link.href = currentUser && currentUser.loggedIn ? '/pages/calendar-dashboard.html' : 'auth.html';
        }
    });
});
