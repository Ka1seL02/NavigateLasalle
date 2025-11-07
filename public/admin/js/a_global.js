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
    const masked = name[0] + '***' + name.slice(-1);
    return `${masked}@${domain}`;
}

// Custom Date Formatting
function formatDateSpans(dateString) {
    if (!dateString) return { date: '—', time: '' };
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const formattedDate = date.toLocaleDateString(undefined, options);
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { date: formattedDate, time: formattedTime };
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

// ====================================
// Global Pagination Utilities

let currentPage = 1;
let entriesPerPage = 8; // default, can be overridden

function getTotalPages(totalEntries) {
    return Math.ceil(totalEntries / entriesPerPage);
}

// Slice an array for current page
function paginateArray(array, customEntriesPerPage) {
    const perPage = customEntriesPerPage || entriesPerPage;
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    return array.slice(start, end);
}

// Update Pagination Buttons (requires buttons in DOM)
function updatePaginationUI(totalEntries, onPageChange) {
    const totalPages = getTotalPages(totalEntries);
    const buttons = document.querySelectorAll('.pagination .pagination-button');
    const pageNumberSpan = document.querySelector('.pagination .page-number');

    if (pageNumberSpan) pageNumberSpan.textContent = currentPage;

    buttons[0].disabled = currentPage === 1;
    buttons[1].disabled = currentPage === 1;
    buttons[2].disabled = currentPage === totalPages;
    buttons[3].disabled = currentPage === totalPages;

    if (buttons[0]) buttons[0].onclick = () => { currentPage = 1; onPageChange(); };
    if (buttons[1]) buttons[1].onclick = () => { if (currentPage > 1) { currentPage--; onPageChange(); } };
    if (buttons[2]) buttons[2].onclick = () => { if (currentPage < totalPages) { currentPage++; onPageChange(); } };
    if (buttons[3]) buttons[3].onclick = () => { currentPage = totalPages; onPageChange(); };
}

// Reset page when filtering/searching
function resetPagination() {
    currentPage = 1;
}
