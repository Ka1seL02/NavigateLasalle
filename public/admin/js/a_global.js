// Debounce Helper - delays execution of function until user stops typing
// Used in search bar
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Email masking
function maskEmail(email) {
    const [name, domain] = email.split('@');
    if (name.length <= 2) return email; // small emails stay as is
    const visibleChars = 2; // first 2 chars visible
    const masked = name.slice(0, visibleChars) + '*'.repeat(name.length - visibleChars);
    return masked + '@' + domain;
}

// Custom Date Formatting
function formatDateSpans(dateString) {
    if (!dateString) return { date: '—', time: '' };
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return {
        date: `${month} ${day}, ${year}`,
        time: `${hours}:${minutes}`
    };
}

// DOM Ready Utility
function onDOMReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

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