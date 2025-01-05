// Sidebar
const chevronRight = document.querySelector('.fa-chevron-right');
const chevronLeft = document.querySelector('.fa-chevron-left');
const sidebar = document.querySelector('.sidebar');
const sidebarLinkSpan = document.querySelectorAll('.sidebar-link span');
const sidebarHeaderSpan = document.querySelector('.sidebar-header span');
const sidebarCollapse = document.querySelector('.sidebar-collapse');

// Sidebar collapse menu

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
// Cumulative PnL
function calculateCumulativePnL() {
    const trades = JSON.parse(localStorage.getItem('trades')) || [];
    let totalPnL = 0;
    let initialValue = 0;

    trades.forEach((trade) => {
        const pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity;
        if (!initialValue && pnl !== 0) {
            initialValue = trade.entryPrice * trade.quantity;
        }
        totalPnL += pnl;
    });

    const percentageChange = initialValue ? ((totalPnL / initialValue) * 100).toFixed(2) : 0;
    return { totalPnL, percentageChange };
}

function updateCumulativePnL() {
    const { totalPnL, percentageChange } = calculateCumulativePnL();
    const pnlElement = document.querySelector('.cumulative-pnl .value');
    const percentageElement = document.querySelector('.cumulative-pnl .percentage');

    if (pnlElement) {
        pnlElement.textContent = formatCurrency(totalPnL);
        pnlElement.className = `value ${totalPnL >= 0 ? 'positive' : 'negative'}`;
    }

    if (percentageElement) {
        percentageElement.textContent = `${percentageChange}%`;
    }
}

function formatCurrency(amount) {
    const formatted = Math.abs(amount).toFixed(2);
    return amount >= 0 ? `$${formatted}` : `-$${formatted}`;
}

// Update P/L display on page load
document.addEventListener('DOMContentLoaded', updateCumulativePnL);
