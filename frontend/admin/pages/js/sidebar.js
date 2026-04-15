import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── Auth Check ───────────────────────────────────────────────────────────────
const meRes = await fetch('/api/auth/me', {
    headers: { 'Accept': 'application/json' }
});

if (!meRes.ok) {
    window.location.href = '/admin/login.html';
}

const { admin } = await meRes.json();

// ─── Load Sidebar HTML ────────────────────────────────────────────────────────
const sidebarRes = await fetch('/admin/pages/sidebar.html');
const html = await sidebarRes.text();
document.getElementById('sidebar-container').innerHTML = html;

// ─── Active Link ──────────────────────────────────────────────────────────────
const currentPage = window.location.pathname.split('/').pop();
document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
        link.classList.add('active');
    }
});

// ─── Logout Modal ─────────────────────────────────────────────────────────────
const logoutBtn = document.getElementById('logoutBtn');
const logoutModalOverlay = document.getElementById('logoutModalOverlay');
const cancelLogout = document.getElementById('cancelLogout');
const confirmLogout = document.getElementById('confirmLogout');

logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    logoutModalOverlay.classList.remove('hidden');
});

cancelLogout.addEventListener('click', () => {
    logoutModalOverlay.classList.add('hidden');
});

confirmLogout.addEventListener('click', async () => {
    await showLoading();
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login.html';
});

// ─── Inactivity Modal ─────────────────────────────────────────────────────────
document.getElementById('inactiveOkBtn').addEventListener('click', () => {
    window.location.href = '/admin/login.html';
});

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
const themeIcon = document.getElementById('themeIcon');
const themeToggle = document.querySelector('.theme-toggle');

const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
themeIcon.className = savedTheme === 'dark' ? 'bx bx-sun' : 'bx bx-moon';

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const theme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeIcon.className = isDark ? 'bx bx-moon' : 'bx bx-sun';
});

// ─── Export admin ─────────────────────────────────────────────────────────────
export { admin };