document.addEventListener('DOMContentLoaded', function() {
    const toc = document.querySelector('.table-of-contents');
    const tocHeader = toc.querySelector('h2');
    let lastScrollTop = 0;
    let isCollapsed = false;
    const body = document.body;

    // Add click handler to toggle
    tocHeader.addEventListener('click', function() {
        if (isCollapsed) {
            toc.classList.remove('collapsed');
            isCollapsed = false;
        } else {
            toc.classList.add('collapsed');
            isCollapsed = true;
        }
    });

    // Add scroll handler
    window.addEventListener('scroll', function() {
        const scrollTop = window.scrollY;
        
        // If we've scrolled past the initial content
        if (scrollTop <= 0) {
            body.classList.remove('scrollUp');
        } 
        if (scrollTop > lastScrollTop && !body.classList.contains('scrollDown')) {
            body.classList.remove('scrollUp');
            body.classList.add('scrollDown');
            toc.classList.add('collapsed');
            isCollapsed = true;
        }
        if (scrollTop < lastScrollTop && body.classList.contains('scrollDown')) {
            body.classList.remove('scrollDown');
            body.classList.add('scrollUp');
            toc.classList.remove('collapsed');
            isCollapsed = false;
        }
        
        lastScrollTop = scrollTop;
    });

    // Add click handler for navigation links
    const tocLinks = toc.querySelectorAll('a');
    tocLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Collapse the TOC after clicking a link
            toc.classList.add('collapsed');
            isCollapsed = true;
        });
    });
});
