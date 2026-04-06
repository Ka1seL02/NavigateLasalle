import showToast from './a_toast.js';
import checkAuth from './a_auth.js';

const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let allAdmins = [];
let filteredAdmins = [];
let requesterRole = null;
let selectedAdminId = null;
let modalOverlay = null;
let deleteConfirmModal = null;

const formatLastLogin = (date) => {
    if (!date) return { label: 'Never', style: 'stale' };
    const now = new Date();
    const diff = now - new Date(date);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);

    if (diff < 24 * 60 * 60 * 1000) {
        return { label: 'Today', style: 'fresh' };
    } else if (days < 7) {
        return { label: `${days} days ago`, style: 'stale' };
    } else if (days < 30) {
        return { label: `${weeks} week${weeks > 1 ? 's' : ''} ago`, style: 'stale' };
    } else if (days < 60) {
        return { label: '1 month ago', style: 'stale' };
    } else {
        const d = new Date(date);
        return { label: `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`, style: 'stale' };
    }
};

const renderTable = () => {
    const tbody = document.getElementById('accountListBody');
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = filteredAdmins.slice(start, end);

    tbody.innerHTML = '';

    pageItems.forEach(admin => {
        const { label, style } = formatLastLogin(admin.lastLogin);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${admin.name}</td>
            <td>${admin.email}</td>
            <td><span class="role-badge ${admin.role}">${admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}</span></td>
            <td><span class="last-login ${style}">● ${label}</span></td>
            <td>${admin.role !== 'superadmin' && requesterRole === 'superadmin' ? `<button class="delete-btn" data-id="${admin._id}" data-name="${admin.name}"><i class='bx bx-trash'></i></button>` : '—'}</td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedAdminId = btn.dataset.id;
            document.getElementById('deleteTargetName').textContent = btn.dataset.name;
            modalOverlay.classList.remove('hidden');
            deleteConfirmModal.classList.remove('hidden');
        });
    });

    updatePagination();
};

const updatePagination = () => {
    const total = filteredAdmins.length;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const start = total === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(currentPage * ITEMS_PER_PAGE, total);

    document.getElementById('showingStart').textContent = start;
    document.getElementById('showingEnd').textContent = end;
    document.getElementById('totalEntries').textContent = total;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('pageInput').value = currentPage;
    document.getElementById('accountsCount').textContent = total;

    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages || totalPages === 0;
};

const fetchAdmins = async () => {
    try {
        const response = await fetch('/api/auth/admins', {
            credentials: 'include'
        });
        const data = await response.json();
        allAdmins = data.admins;
        filteredAdmins = [...allAdmins];
        requesterRole = data.requesterRole;
        renderTable();
    } catch (error) {
        showToast('error', 'Failed to load accounts.');
    }
};

const init = async () => {
    const admin = await checkAuth();
    if (!admin) return;

    const inviteBtn = document.getElementById('inviteBtn');
    modalOverlay = document.getElementById('modalOverlay');
    const sendInviteModal = document.getElementById('sendInviteModal');
    deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const cancelInvite = document.getElementById('cancelInvite');
    const confirmInvite = document.getElementById('confirmInvite');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDeleteAccount = document.getElementById('confirmDeleteAccount');

    if (admin.role === 'superadmin') {
        inviteBtn.classList.remove('hidden');
    }

    await fetchAdmins();

    document.getElementById('searchInput').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        filteredAdmins = allAdmins.filter(a =>
            a.name.toLowerCase().includes(query) ||
            a.email.toLowerCase().includes(query)
        );
        currentPage = 1;
        renderTable();
    });

    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });

    document.getElementById('pageInput').addEventListener('change', (e) => {
        const totalPages = Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE);
        let page = parseInt(e.target.value);
        if (isNaN(page) || page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        currentPage = page;
        renderTable();
    });

    inviteBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('hidden');
        sendInviteModal.classList.remove('hidden');
    });

    cancelInvite.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
        sendInviteModal.classList.add('hidden');
    });

    confirmInvite.addEventListener('click', async () => {
        const email = document.getElementById('inviteEmail').value.trim();
        if (!email) return;

        try {
            const response = await fetch('/api/invite/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                showToast('success', 'Invite sent successfully!');
                modalOverlay.classList.add('hidden');
                sendInviteModal.classList.add('hidden');
                document.getElementById('inviteEmail').value = '';
            } else {
                showToast('error', data.message);
            }

        } catch (error) {
            showToast('error', 'Something went wrong. Please try again.');
        }
    });

    cancelDelete.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
        deleteConfirmModal.classList.add('hidden');
        selectedAdminId = null;
    });

    confirmDeleteAccount.addEventListener('click', async () => {
        if (!selectedAdminId) return;

        try {
            const response = await fetch(`/api/auth/admins/${selectedAdminId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                showToast('success', 'Account deleted successfully!');
                modalOverlay.classList.add('hidden');
                deleteConfirmModal.classList.add('hidden');
                selectedAdminId = null;
                await fetchAdmins();
            } else {
                showToast('error', data.message);
            }

        } catch (error) {
            showToast('error', 'Something went wrong. Please try again.');
        }
    });
};

init();