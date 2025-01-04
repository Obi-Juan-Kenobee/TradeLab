const chevronRight = document.querySelector('.fa-chevron-right');
const chevronLeft = document.querySelector('.fa-chevron-left');
const sidebar = document.querySelector('.sidebar');
const sidebarLinkSpan = document.querySelectorAll('.sidebar-link span');
const sidebarHeaderSpan = document.querySelector('.sidebar-header span');
const sidebarCollapse = document.querySelector('.sidebar-collapse');

// Sidebar collapse menu

// sidebarCollapse.addEventListener('click', () => {
//     if (chevronRight.style.display === 'none' && window.innerWidth > 992) {
//         chevronRight.style.display = 'block';
//         chevronLeft.style.display = 'none';
//         sidebar.style.width = '7%';
//         sidebarCollapse.style.left = '70%';
//         for (let link of sidebarLinkSpan) {
//             link.style.display = 'none';
//         }
//         sidebarHeaderSpan.style.display = 'none';
//     } 

//     else if (chevronRight.style.display === 'none' && window.innerWidth < 992) {
//         chevronRight.style.display = 'block';
//         chevronLeft.style.display = 'none';
//         sidebar.style.width = '10%';
//         sidebarCollapse.style.left = '70%';
//         for (let link of sidebarLinkSpan) {
//             link.style.display = 'none';
//         }
//         sidebarHeaderSpan.style.display = 'none';
//     } 
//     else if (chevronRight.style.display === 'block' || window.innerWidth > 992) {
//         chevronRight.style.display = 'none';
//         chevronLeft.style.display = 'block';
//         sidebar.style.width = '250px';
//         sidebarCollapse.style.left = '224px';
//         for (let link of sidebarLinkSpan) {
//             link.style.display = 'inline-flex';
//             link.style.marginLeft = '15px';
//         }
//         sidebarHeaderSpan.style.display = 'block';
//    } else {
//         chevronRight.style.display = 'none';
//         chevronLeft.style.display = 'block';
//         sidebar.style.width = '210px';
//         sidebarCollapse.style.left = '190px';
//         for (let link of sidebarLinkSpan) {
//             link.style.display = 'inline-flex';
//             link.style.marginLeft = '15px';
//         }
//         sidebarHeaderSpan.style.display = 'block';
//         // sidebarHeaderSpan.style.fontSize = '1.2rem';
//     }
// });

document.addEventListener('DOMContentLoaded', () => {
    // Initialize sidebar state
    const sidebar = document.querySelector('.sidebar');
    const isMobile = window.innerWidth <= 992;
    const savedState = localStorage.getItem('sidebarState');

     // Add toggle button to sidebar
     const toggleButton = document.createElement('button');
     toggleButton.className = 'sidebar-toggle';
     toggleButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
     sidebar.appendChild(toggleButton);

    //set initial state
    if (savedState === 'collapsed' || (isMobile && savedState !== 'expanded')) {
        sidebar.classList.add('collapsed');
    }

    // Toggle sidebar function
    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebarState', sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded');
    }

    // Add click event listener to toggle button
    toggleButton.addEventListener('click', toggleSidebar);

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const wasCollapsed = sidebar.classList.contains('collapsed');
            const newIsMobile = window.innerWidth <= 992;

            // Reset classes when switching between mobile and desktop
            if (isMobile !== newIsMobile) {
                if (newIsMobile && !wasCollapsed) {
                    sidebar.classList.remove('collapsed');
                }
            }
        }, 300);
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (event) => {
        if (window.innerWidth <= 992 && 
            !sidebar.contains(event.target) &&
            !sidebar.classList.contains('collapsed')) {
            sidebar.classList.add('collapsed');
            localStorage.setItem('sidebarState', 'collapsed');
        }
    });
});