// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggleIcon(newTheme);

    // If on settings page, update the theme selector
    const themeSelect = document.getElementById('theme');
    if (themeSelect) {
        themeSelect.value = newTheme;
    }
}

function updateThemeToggleIcon(theme) {
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Add theme toggle button to all pages
function addThemeToggle() {
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    themeToggle.addEventListener('click', toggleTheme);
    document.body.appendChild(themeToggle);
}

// Initialize theme when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    addThemeToggle();
});
