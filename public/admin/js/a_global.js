// Email masking
function maskEmail(email) {
    const [name, domain] = email.split('@');
    const masked = name[0] + '***' + name.slice(-1);
    return `${masked}@${domain}`;
}

// Custom Date Formatting
function formatDate(dateString) {
    if (!dateString) return false; // Meaning user has not login yet
    const fetchDate = new Date(dateString);
    const currentDate = new Date();
    fetchDate.setHours(0,0,0,0);
    currentDate.setHours(0,0,0,0);

    const diffMs = currentDate - fetchDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Less than a year 
    if (diffDays < 365) {
        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays >= 2 && diffDays < 7) return `${diffDays} days ago`;
        
        const weeks = Math.floor(diffDays / 7);
        if (weeks >= 1 && weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;

        // For dates older than 3 weeks but less than a year
        return fetchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    return fetchDate.toLocaleDateString('en-GB'); // "dd/mm/yyyy" format
}

// DOM Ready Utility
function onDOMReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

// ====================================
// Sidebar Logic    
onDOMReady(() => {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return; // Failsafe just incase this script is used in pages with no a_sidebar element

    fetch('a_sidebar.html')
        .then(response => response.text())
        .then(data => {
            sidebarContainer.innerHTML = data;
            // Highlight active link
            const currentPage = window.location.pathname.split('/').pop();
            const links = document.querySelectorAll('.sidebar-menu li a');
            links.forEach(link => {
                if (link.getAttribute('href') === currentPage) {
                    link.classList.add('active');
                }
            });
            // Sidebar collapse logic
            const sidebar = document.querySelector('nav');
            const toggle = document.querySelector('.sidebar-toggle');
            if (sidebar && toggle) {
                toggle.addEventListener('click', () => {
                    sidebar.classList.toggle('collapsed');
                });
            }
        })
        .catch(err => console.error('Sidebar load failed:', err));
});