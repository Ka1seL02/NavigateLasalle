// ==================== AUTH CHECK FUNCTIONS ==================== //
async function checkAuth() {
    try {
        const response = await fetch('/api/accounts/check-session');
        const data = await response.json();
        return data.isAuthenticated;
    } catch (err) {
        console.error('Auth check error:', err);
        return false;
    }
}
async function protectPage() {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) window.location.href = '/admin/a_login.html';
}
async function redirectIfAuthenticated() {
    const isAuthenticated = await checkAuth();
    if (isAuthenticated) window.location.href = '/admin/a_dashboard.html';
}

// ==================== UNIVERSAL MODAL HELPERS ==================== //
function openModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add("show");
}

function closeModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;

    const modal = overlay.querySelector(".modal");
    if (!modal) return;

    modal.classList.add("closing");

    modal.addEventListener(
        "animationend",
        () => {
            modal.classList.remove("closing");
            overlay.classList.remove("show");
        },
        { once: true }
    );
}

function initOverlayClick(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal(id);
    });
}

// ==================== UNIVERSAL CONFIRM MODAL ==================== //
let confirmModalCallback = null;

function initializeConfirmModal() {
    const confirmBtn = document.getElementById('confirmActionBtn');
    const cancelBtn = document.getElementById('cancelActionBtn');

    if (!confirmBtn || !cancelBtn) return;

    cancelBtn.addEventListener('click', () => {
        closeModal('confirmModal');
        confirmModalCallback = null;
    });

    confirmBtn.addEventListener('click', async () => {
        if (confirmModalCallback) {
            await confirmModalCallback(confirmBtn);
            closeModal('confirmModal');
            confirmModalCallback = null;
        }
    });

    initOverlayClick('confirmModal');
}

function showConfirmModal({ icon, iconColor, title, message, confirmText, confirmColor, onConfirm }) {
    const overlay = document.getElementById('confirmModal');
    if (!overlay) return;

    const iconElement = overlay.querySelector('#confirmIcon i');
    const iconContainer = overlay.querySelector('#confirmIcon');
    const titleElement = overlay.querySelector('#confirmTitle');
    const messageElement = overlay.querySelector('#confirmMessage');
    const confirmBtn = overlay.querySelector('#confirmActionBtn');

    if (iconElement) iconElement.className = `bx ${icon}`;
    if (iconContainer && iconColor) iconContainer.style.backgroundColor = iconColor;
    if (titleElement) titleElement.textContent = title;
    if (messageElement) messageElement.textContent = message;
    if (confirmBtn) {
        confirmBtn.textContent = confirmText;
        confirmBtn.style.backgroundColor = confirmColor || 'var(--green)';
    }

    confirmModalCallback = onConfirm;
    openModal('confirmModal');
}

// ==================== LOAD COMPONENTS ==================== //
function loadComponents() {
    const currentPage = window.location.pathname;
    const noSidebarPages = ['a_login.html', 'a_reset_password.html'];
    const shouldLoadSidebar = !noSidebarPages.some(page => currentPage.includes(page));

    if (!shouldLoadSidebar) return;

    // Sidebar
    fetch('./component/a_sidebar.html')
        .then(res => res.text())
        .then(html => {
            document.body.insertAdjacentHTML('afterbegin', html);
            initializeSidebar();
        })
        .catch(err => console.error('Error loading sidebar:', err));

    // Logout modal
    fetch('./component/m_logout.html')
        .then(res => res.text())
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
            initializeLogoutModal();
        });

    // Confirm modal (global)
    fetch('./component/m_confirm.html')
        .then(res => res.text())
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
            initializeConfirmModal();
        })
        .catch(err => console.error('Error loading confirm modal:', err));
}

// ==================== SIDEBAR INITIALIZATION ==================== //
function initializeSidebar() {
    const menuItems = document.querySelectorAll('.menu-item');
    const currentPage = window.location.pathname.split('/').pop().replace('.html','').replace('a_','');

    menuItems.forEach(item => {
        if (item.getAttribute('data-page') === currentPage) item.classList.add('active');

        const text = item.querySelector('span')?.textContent;
        if (text) item.setAttribute('data-tooltip', text);

        item.addEventListener('click', () => {
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    if (sidebarToggle && sidebar) {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) sidebar.classList.add('collapsed');

        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => openModal('logoutModal'));
}

// ==================== LOGOUT MODAL ==================== //
function initializeLogoutModal() {
    const confirmBtn = document.getElementById("confirmLogoutBtn");
    const cancelBtn = document.getElementById("cancelLogoutBtn");

    if (!confirmBtn || !cancelBtn) return;

    confirmBtn.addEventListener("click", async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = "Logging out...";

        try {
            const res = await fetch("/api/accounts/logout", { method: "POST" });
            if (res.ok) window.location.href = "/admin/a_login.html";
            else {
                confirmBtn.disabled = false;
                confirmBtn.textContent = "Yes, Logout";
            }
        } catch (err) {
            console.error("Logout error:", err);
            confirmBtn.disabled = false;
            confirmBtn.textContent = "Yes, Logout";
        }
    });

    cancelBtn.addEventListener("click", () => closeModal("logoutModal"));
    initOverlayClick("logoutModal");
}

// ==================== LOAD USER INFO ==================== //
async function loadUserInfo() {
    try {
        const res = await fetch("/api/accounts/check-session");
        const data = await res.json();

        const accountsMenu = document.getElementById("accountsMenu");
        if (accountsMenu && data.user?.role !== "super-admin") accountsMenu.style.display = "none";

        return data.user;
    } catch (err) {
        console.error("Error loading user info:", err);
        return null;
    }
}

// ==================== HANDLE BACK/FORWARD CACHE ==================== //
window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
        const currentPage = window.location.pathname;

        if (currentPage.includes("a_login.html")) redirectIfAuthenticated();
        else if (currentPage.includes("a_dashboard.html") ||
                 currentPage.includes("a_accounts.html") ||
                 currentPage.includes("a_")) {
            if (!currentPage.includes("a_reset_password.html")) protectPage();
        }
    }
});

// ==================== DOM READY ==================== //
document.addEventListener("DOMContentLoaded", async () => {
    loadComponents();

    const user = await loadUserInfo();
    if (!user) return;

    const profileInitials = document.querySelector('.profile-initials');
    const profileName = document.querySelector('.profile-name');
    const profileRole = document.querySelector('.profile-role');

    if (profileInitials) {
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2);
        profileInitials.textContent = initials;
    }
    if (profileName) profileName.textContent = user.name;
    if (profileRole) profileRole.textContent = user.role;
});