import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── Auth Check & Sidebar Loader ──────────────────────────────────────────────
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

// ─── Populate Admin Info ──────────────────────────────────────────────────────
document.getElementById('adminAvatar').textContent = admin.name.charAt(0).toUpperCase();
document.getElementById('adminName').textContent = admin.name;
document.getElementById('adminRole').textContent = admin.role === 'superadmin' ? 'Super Admin' : 'Admin';

// ─── Active Link ──────────────────────────────────────────────────────────────
const currentPage = window.location.pathname.split('/').pop();
document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
        link.classList.add('active');
    }
});

// ─── Collapse Toggle ──────────────────────────────────────────────────────────
const sidebar = document.querySelector('.sidebar');

// Restore saved state
if (localStorage.getItem('sidebarCollapsed') === 'true') {
    sidebar.classList.add('collapsed');
}

document.getElementById('toggleSidebar').addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
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
    showLoading();
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login.html';
});

// ─── Inactivity Modal OK ──────────────────────────────────────────────────────
document.getElementById('inactiveOkBtn').addEventListener('click', () => {
    window.location.href = '/admin/login.html';
});

// ─── Export admin for page-specific use ──────────────────────────────────────
export { admin };