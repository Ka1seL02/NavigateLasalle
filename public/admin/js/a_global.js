// ==================== AUTH CHECK FUNCTIONS ==================== //
// Check if there is already a logged-in
async function checkAuth() {
    try {
        const response = await fetch('/api/accounts/check-session');
        const data = await response.json();
        return data.isAuthenticated;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}
// Redirect unauthorize/non-loggedin users
async function protectPage() {
    const isAuthenticated = await checkAuth();

    if (!isAuthenticated) {
        window.location.href = '/admin/a_login.html';
    }
}
// Redirect if already logged in
async function redirectIfAuthenticated() {
    const isAuthenticated = await checkAuth();

    if (isAuthenticated) {
        window.location.href = '/admin/a_dashboard.html';
    }
}

// ================= LOADING COMPONENTS TO HTML ================= //
// Load sidebar and logout modal dynamically on authenticated pages
function loadComponents() {
    const currentPage = window.location.pathname;
    const noSidebarPages = ['a_login.html', 'a_reset_password.html'];
    const shouldLoadSidebar = !noSidebarPages.some(page => currentPage.includes(page));

    if (!shouldLoadSidebar) return;

    // Fetch sidebar
    fetch('./component/a_sidebar.html')
        .then(res => res.text())
        .then(html => {
            document.body.insertAdjacentHTML('afterbegin', html);
            initializeSidebar();
        })
        .catch(error => {
            console.error('Error loading sidebar:', error);
        });

    // Fetch logout modal
    fetch('./component/m_logout.html')
        .then(res => res.text())
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
            initializeLogoutModal();
        });
}

// Show logout modal
function showLogoutModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (!overlay) return;
    overlay.classList.add('show');
}

// ================= INITIALIZING COMPONENTS TO HTML ================= //
// Initialize Sidebar
function initializeSidebar() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '').replace('a_', '');

    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        const page = item.getAttribute('data-page');
        if (page === currentPage) {
            item.classList.add('active');
        }

        // Add tooltips for collapsed state
        const text = item.querySelector('span')?.textContent;
        if (text) {
            item.setAttribute('data-tooltip', text);
        }

        // Add click handler for visual feedback
        item.addEventListener('click', function (e) {
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // ========== SIDEBAR COLLAPSE BUTTON ========== //
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');

    if (sidebarToggle && sidebar) {
        // Load saved state from localStorage
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
        }

        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            // Save state
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }

    // ========== LOGOUT BUTTON (SHOWS MODAL) ========== //
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLogoutModal();
        });
    }
}

function initializeLogoutModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (!overlay) return;

    const confirmBtn = document.getElementById('confirmLogoutBtn');
    const cancelBtn = document.getElementById('cancelLogoutBtn');

    function closeModal() {
        const modal = document.querySelector('.modal');
        if (!modal) return;
        modal.classList.add('closing');
        modal.addEventListener('animationend', () => {
            modal.classList.remove('closing');
            overlay.classList.remove('show');
        }, { once: true });
    }

    // Cancel button hides modal
    cancelBtn.addEventListener('click', closeModal);

    // Click outside to close
    overlay.addEventListener('click', e => {
        if (e.target === overlay) closeModal();
    });

    // Confirm logout
    confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Logging out...';

        try {
            const response = await fetch('/api/accounts/logout', { method: 'POST' });
            const data = await response.json();

            if (response.ok) {
                // 2️⃣ Redirect to login page
                window.location.href = '/admin/a_login.html';
            } else {
                console.error('Logout failed:', data.message);
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Yes, Logout';
            }
        } catch (err) {
            console.error('Logout error:', err);
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Yes, Logout';
        }
    });
}

// ========== LOAD USER INFO ========== //
async function loadUserInfo() {
    try {
        const response = await fetch('/api/accounts/check-session');
        const data = await response.json();

        const accountsMenu = document.getElementById('accountsMenu');
        if (accountsMenu && data.user?.role !== 'super-admin') {
            accountsMenu.style.display = 'none';
        }

        return data.user;

    } catch (error) {
        console.error('Error loading user info:', error);
        return null;
    }
}

// ==================== HANDLE BACK/FORWARD CACHE ==================== //
window.addEventListener('pageshow', function (event) {
    // event.persisted is true when page is loaded from bfcache
    if (event.persisted) {
        // Determine which check to run based on current page
        const currentPage = window.location.pathname;

        if (currentPage.includes('a_login.html')) {
            redirectIfAuthenticated();
        } else if (currentPage.includes('a_dashboard.html') ||
            currentPage.includes('a_accounts.html') ||
            currentPage.includes('a_')) {
            // Any admin page that requires auth
            if (!currentPage.includes('a_reset_password.html')) {
                protectPage();
            }
        }
    }
});

// ==================== LOAD ALL COMPONENTS ==================== //
// Automatically load the components when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    loadComponents();

    const user = await loadUserInfo();
    if (user) {
        const profileInitials = document.querySelector('.profile-initials');
        const profileName = document.querySelector('.profile-name');
        const profileRole = document.querySelector('.profile-role');

        if (profileInitials) {
            const initials = user.name.split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            profileInitials.textContent = initials;
        }

        if (profileName) { profileName.textContent = user.name; }
        if (profileRole) { profileRole.textContent = user.role; }
    }
});