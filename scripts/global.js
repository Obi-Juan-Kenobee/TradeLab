// Mobile Menu
const hamburgerMenu = document.querySelector('#hamburger');
const navLinks = document.querySelector('.nav-links');
const navbar = document.querySelector('.navbar');

hamburgerMenu.addEventListener('click', () => {
    if (navLinks.style.display === 'none') {
        navLinks.style.display = 'flex';
        navbar.style.height = 'fit-content';
    } else {
        navLinks.style.display = 'none';
    }
});

// redisplay menu on resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 992) {
        if (navLinks.style.display === 'none') {
            navLinks.style.display = 'flex';
            navbar.style.height = 'fit-content';
        }
    } else {
        navLinks.style.display = 'none';
    }
});