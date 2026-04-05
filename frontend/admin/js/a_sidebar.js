import checkAuth from './a_auth.js';

const loadSidebar = async () => {
    const admin = await checkAuth();
    if (!admin) return;

    const response = await fetch('/admin/a_sidebar.html');
    const html = await response.text();
    document.getElementById('sidebar-container').innerHTML = html;

    // Set avatar and admin details
    document.getElementById('adminAvatar').textContent = admin.name.charAt(0).toUpperCase();
    document.getElementById('adminName').textContent = admin.name;
    document.getElementById('adminRole').textContent = admin.role === 'superadmin' ? 'Super Admin' : 'Admin';

    // Set active link
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });

    // Toggle collapse
    document.getElementById('toggleSidebar').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('collapsed');
    });

    // Logout modal
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
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = 'a_login.html';
    });

    document.getElementById('inactiveOkBtn').addEventListener('click', () => {
        window.location.href = 'a_login.html';
    });
};

loadSidebar();