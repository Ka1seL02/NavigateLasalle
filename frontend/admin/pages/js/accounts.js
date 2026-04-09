import showToast from './toast.js';
import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── Current Admin ────────────────────────────────────────────────────────────
const meRes = await fetch('/api/auth/me', { headers: { 'Accept': 'application/json' } });
const { admin: currentAdmin } = await meRes.json();

// ─── State ────────────────────────────────────────────────────────────────────
let allAdmins = [];
let filteredAdmins = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatLastLogin(date) {
    if (!date) return { text: 'Never', fresh: false };

    const now = new Date();
    const last = new Date(date);
    const diffMs = now - last;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const diffWeeks = diffDays / 7;
    const diffMonths = diffDays / 30;

    let text;
    if (diffHours < 24) {
        text = 'Today';
    } else if (diffDays < 7) {
        text = `${Math.floor(diffDays)} day${Math.floor(diffDays) > 1 ? 's' : ''} ago`;
    } else if (diffWeeks < 4) {
        text = `${Math.floor(diffWeeks)} week${Math.floor(diffWeeks) > 1 ? 's' : ''} ago`;
    } else if (diffMonths < 2) {
        text = '1 month ago';
    } else {
        const y = last.getFullYear();
        const m = String(last.getMonth() + 1).padStart(2, '0');
        const d = String(last.getDate()).padStart(2, '0');
        text = `${y}/${m}/${d}`;
    }

    return { text, fresh: diffHours < 24 };
}

function formatEmail(email) {
    if (currentAdmin.role === 'superadmin') return email;
    const [local, domain] = email.split('@');
    const visible = local.slice(0, 3);
    return `${visible}****@${domain}`;
}

// ─── Table & Pagination ───────────────────────────────────────────────────────
const accountListBody = document.getElementById('accountListBody');
const accountsCount = document.getElementById('accountsCount');
const showingStart = document.getElementById('showingStart');
const showingEnd = document.getElementById('showingEnd');
const totalEntries = document.getElementById('totalEntries');
const totalPagesEl = document.getElementById('totalPages');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInput = document.getElementById('pageInput');

function renderTable() {
    const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = Math.min(start + ITEMS_PER_PAGE, filteredAdmins.length);
    const pageAdmins = filteredAdmins.slice(start, end);

    accountsCount.textContent = allAdmins.length > 999 ? '999+' : allAdmins.length;
    totalEntries.textContent = filteredAdmins.length;
    showingStart.textContent = filteredAdmins.length === 0 ? 0 : start + 1;
    showingEnd.textContent = end;
    totalPagesEl.textContent = totalPages;
    pageInput.value = currentPage;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;

    accountListBody.innerHTML = '';

    if (pageAdmins.length === 0) {
        accountListBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--grey); padding: 2rem;">No accounts found.</td></tr>`;
        return;
    }

    pageAdmins.forEach(a => {
        const { text, fresh } = formatLastLogin(a.lastLogin);
        const isSuperAdmin = a.role === 'superadmin';
        const showDelete = currentAdmin.role === 'superadmin' && !isSuperAdmin;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${a.name}</td>
            <td>${formatEmail(a.email)}</td>
            <td><span class="role-badge ${isSuperAdmin ? 'superadmin' : 'admin'}">${isSuperAdmin ? 'Super Admin' : 'Admin'}</span></td>
            <td><span class="last-login ${fresh ? 'fresh' : 'stale'}"> ● ${text}</span></td>
            <td>${showDelete ? `<button class="delete-btn" data-id="${a._id}" data-name="${a.name}"><i class='bx bx-trash'></i></button>` : ''}</td>
        `;
        accountListBody.appendChild(tr);
    });

    accountListBody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, btn.dataset.name));
    });
}

async function fetchAdmins() {
    await showLoading();
    try {
        const res = await fetch('/api/accounts', { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        allAdmins = data.admins;
        filteredAdmins = [...allAdmins];
        renderTable();
    } catch (err) {
        showToast('error', 'Failed to load accounts.');
    } finally {
        hideLoading();
    }
}

prevBtn.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderTable(); }
});

nextBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE);
    if (currentPage < totalPages) { currentPage++; renderTable(); }
});

pageInput.addEventListener('change', () => {
    const totalPages = Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE);
    const val = parseInt(pageInput.value);
    if (val >= 1 && val <= totalPages) { currentPage = val; renderTable(); }
    else pageInput.value = currentPage;
});

// ─── Search ───────────────────────────────────────────────────────────────────
const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    filteredAdmins = allAdmins.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query)
    );
    currentPage = 1;
    renderTable();
});

// ─── Invite ───────────────────────────────────────────────────────────────────
const inviteBtn = document.getElementById('inviteBtn');
const inviteModalOverlay = document.getElementById('inviteModalOverlay');
const cancelInvite = document.getElementById('cancelInvite');
const sendInviteBtn = document.getElementById('sendInvite');
const inviteEmailInput = document.getElementById('inviteEmail');

if (currentAdmin.role === 'superadmin') {
    inviteBtn.classList.remove('hidden');
}

inviteBtn.addEventListener('click', () => {
    inviteEmailInput.value = '';
    inviteModalOverlay.classList.remove('hidden');
});

cancelInvite.addEventListener('click', () => {
    inviteModalOverlay.classList.add('hidden');
});

sendInviteBtn.addEventListener('click', async () => {
    const email = inviteEmailInput.value.trim();
    if (!email) return;

    inviteModalOverlay.classList.add('hidden');
    await showLoading();

    try {
        const res = await fetch('/api/accounts/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) {
            showToast('error', data.error || 'Failed to send invite.');
        } else {
            showToast('success', 'Invite sent successfully!');
        }
    } catch (err) {
        showToast('error', 'Failed to send invite.');
    } finally {
        hideLoading();
    }
});

// ─── Delete ───────────────────────────────────────────────────────────────────
const confirmDeleteModalOverlay = document.getElementById('confirmDeleteModalOverlay');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDeleteBtn = document.getElementById('confirmDeleteAccount');
const targetNameEl = document.getElementById('targetName');

let deleteTargetId = null;

function openDeleteModal(id, name) {
    deleteTargetId = id;
    targetNameEl.textContent = name;
    confirmDeleteModalOverlay.classList.remove('hidden');
}

cancelDelete.addEventListener('click', () => {
    confirmDeleteModalOverlay.classList.add('hidden');
    deleteTargetId = null;
});

confirmDeleteBtn.addEventListener('click', async () => {
    if (!deleteTargetId) return;

    confirmDeleteModalOverlay.classList.add('hidden');
    await showLoading();

    try {
        const res = await fetch(`/api/accounts/${deleteTargetId}`, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (!res.ok) {
            showToast('error', data.error || 'Failed to delete account.');
        } else {
            showToast('success', 'Account deleted successfully!');
            await fetchAdmins();
        }
    } catch (err) {
        showToast('error', 'Failed to delete account.');
    } finally {
        hideLoading();
        deleteTargetId = null;
    }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
fetchAdmins();