// ==================== STATE MANAGEMENT ==================== //
let currentPage = 1;
let totalPages = 1;
let accountsData = [];
let selectedAccounts = new Set();

// ==================== INITIALIZATION ==================== //
document.addEventListener('DOMContentLoaded', () => {
    loadAccounts();
    loadInviteModal();
    loadConfirmModal();
    initializeEventListeners();
});

// ==================== LOAD MODAL COMPONENTS ==================== //
async function loadInviteModal() {
    try {
        const response = await fetch('./component/m_send_invite.html');
        const html = await response.text();
        document.body.insertAdjacentHTML('beforeend', html);
        initializeInviteModal();
    } catch (error) {
        console.error('Error loading invite modal:', error);
    }
}

async function loadConfirmModal() {
    try {
        const response = await fetch('./component/m_confirm.html');
        const html = await response.text();
        document.body.insertAdjacentHTML('beforeend', html);
        initializeConfirmModal();
    } catch (error) {
        console.error('Error loading confirm modal:', error);
    }
}

// ==================== INITIALIZE UNIVERSAL CONFIRM MODAL ==================== //
let confirmModalCallback = null;

function initializeConfirmModal() {
    const overlay = document.getElementById('confirmModal');
    if (!overlay) return;

    const confirmBtn = document.getElementById('confirmActionBtn');
    const cancelBtn = document.getElementById('cancelActionBtn');

    function closeModal() {
        const modal = overlay.querySelector('.modal');
        if (!modal) return;
        modal.classList.add('closing');
        modal.addEventListener('animationend', () => {
            modal.classList.remove('closing');
            overlay.classList.remove('show');
            confirmModalCallback = null; // Clear callback
        }, { once: true });
    }

    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    confirmBtn.addEventListener('click', async () => {
        if (confirmModalCallback) {
            await confirmModalCallback(confirmBtn);
            closeModal();
        }
    });
}

// ==================== SHOW UNIVERSAL CONFIRM MODAL ==================== //
function showConfirmModal({ icon, iconColor, title, message, confirmText, confirmColor, onConfirm }) {
    const overlay = document.getElementById('confirmModal');
    if (!overlay) return;

    // Update modal content
    const iconElement = overlay.querySelector('#confirmIcon i');
    const iconContainer = overlay.querySelector('#confirmIcon');
    const titleElement = overlay.querySelector('#confirmTitle');
    const messageElement = overlay.querySelector('#confirmMessage');
    const confirmBtn = overlay.querySelector('#confirmActionBtn');

    if (iconElement) {
        iconElement.className = `bx ${icon}`;
    }
    if (iconContainer && iconColor) {
        iconContainer.style.backgroundColor = iconColor;
    }
    if (titleElement) titleElement.textContent = title;
    if (messageElement) messageElement.textContent = message;
    if (confirmBtn) {
        confirmBtn.textContent = confirmText;
        confirmBtn.style.backgroundColor = confirmColor || 'var(--green)';
    }

    // Set callback
    confirmModalCallback = onConfirm;

    // Show modal
    overlay.classList.add('show');
}

// ==================== INITIALIZE INVITE MODAL ==================== //
function initializeInviteModal() {
    const overlay = document.getElementById('inviteModalOverlay');
    if (!overlay) return;

    const form = document.getElementById('inviteForm');
    const confirmBtn = document.getElementById('confirmInviteBtn');
    const cancelBtn = document.getElementById('cancelInviteBtn');

    // Close modal function
    function closeModal() {
        const modal = overlay.querySelector('.modal');
        if (!modal) return;
        modal.classList.add('closing');
        modal.addEventListener('animationend', () => {
            modal.classList.remove('closing');
            overlay.classList.remove('show');
        }, { once: true });
    }

    // Cancel button
    cancelBtn.addEventListener('click', closeModal);

    // Click outside to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    // Form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('inviteEmail').value.trim();

        if (!email) {
            customNotification('error', 'Validation Error', 'Email is required.');
            return;
        }

        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Sending...';

        try {
            const response = await fetch('/api/accounts/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send invitation');
            }

            customNotification('success', 'Success', data.message);
            form.reset();
            closeModal();

        } catch (error) {
            console.error('Send invite error:', error);
            customNotification('error', 'Error', error.message);
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Send Invitation';
        }
    });
}

// ==================== EVENT LISTENERS ==================== //
function initializeEventListeners() {
    // Search
    const searchInput = document.querySelector('.search-box input');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentPage = 1;
            loadAccounts(e.target.value);
        }, 500);
    });

    // Show Invite Modal
    const showModalBtn = document.getElementById('showCreateAccountModal');
    showModalBtn.addEventListener('click', () => {
        const overlay = document.getElementById('inviteModalOverlay');
        if (overlay) {
            overlay.classList.add('show');
        }
    });

    // Refresh
    const refreshBtn = document.getElementById('refresh-table');
    refreshBtn.addEventListener('click', () => {
        selectedAccounts.clear();
        currentPage = 1;
        loadAccounts();
    });

    // Delete Selected
    const deleteBtn = document.getElementById('delete-selected');
    deleteBtn.addEventListener('click', deleteSelectedAccounts);

    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadAccounts();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadAccounts();
        }
    });

    const pageInput = document.getElementById('current-page');
    pageInput.addEventListener('change', (e) => {
        const page = parseInt(e.target.value);
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            loadAccounts();
        } else {
            e.target.value = currentPage;
        }
    });

    // Select All
    const selectAllCheckbox = document.querySelector('.select-all-toolbar');
    selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            const accountId = cb.dataset.id;
            if (e.target.checked) {
                selectedAccounts.add(accountId);
            } else {
                selectedAccounts.delete(accountId);
            }
        });
    });

    // Export Table
    const exportBtn = document.querySelector('.export-table');
    exportBtn.addEventListener('click', exportTable);
}

// ==================== LOAD ACCOUNTS ==================== //
async function loadAccounts(search = '') {
    try {
        const response = await fetch(`/api/accounts?page=${currentPage}&limit=50&search=${search}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to load accounts');
        }

        accountsData = data.accounts;
        totalPages = data.pagination.pages;

        renderTable(data.accounts);
        updatePagination(data.pagination);

    } catch (error) {
        console.error('Load accounts error:', error);
        customNotification('error', 'Error', error.message);
    }
}

// ==================== FORMAT DATE ==================== //
function formatDate(dateString) {
    if (!dateString) return false; // Meaning user has not login yet
    const fetchDate = new Date(dateString);
    const currentDate = new Date();
    fetchDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

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

    return fetchDate.toLocaleDateString('en-GB'); // "dd/mm/yyyy"
}

// ==================== RENDER TABLE ==================== //
function renderTable(accounts) {
    const tbody = document.querySelector('.table tbody');

    if (accounts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--light-grey);">
                    No accounts found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = accounts.map(account => {
        const lastActive = formatDate(account.lastLogin);
        const formattedDate = new Date(account.createdAt).toISOString().split('T')[0];

        // Determine class for lastActive
        let lastActiveClass = 'last-active old'; // default for older dates or 'Never'
        if (lastActive === 'Today') lastActiveClass = 'last-active today';
        else if (lastActive === 'Yesterday') lastActiveClass = 'last-active yesterday';
        else if (lastActive && lastActive.includes('week')) lastActiveClass = 'last-active week';

        return `
            <tr>
                <td><input type="checkbox" data-id="${account._id}" ${selectedAccounts.has(account._id) ? 'checked' : ''}></td>
                <td>${account.name}</td>
                <td>${account.email}</td>
                <td>${formattedDate}</td>
                <td class="${lastActiveClass}">${lastActive || 'Never'}</td>
                <td>
                    <i class='bx bx-dots-vertical-rounded' style="cursor: pointer;" onclick="showAccountMenu(event, '${account._id}')"></i>
                </td>
            </tr>
        `;
    }).join('');

    // Add checkbox listeners
    const checkboxes = tbody.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            const accountId = e.target.dataset.id;
            if (e.target.checked) {
                selectedAccounts.add(accountId);
            } else {
                selectedAccounts.delete(accountId);
            }
            updateSelectAllCheckbox();
        });
    });
}

// ==================== UPDATE PAGINATION ==================== //
function updatePagination(pagination) {
    document.getElementById('start-entry').textContent =
        pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.limit + 1);
    document.getElementById('end-entry').textContent =
        Math.min(pagination.page * pagination.limit, pagination.total);
    document.getElementById('total-entries').textContent = pagination.total;
    document.getElementById('total-pages').textContent = pagination.pages;
    document.getElementById('current-page').value = pagination.page;

    // Disable/enable pagination buttons
    document.getElementById('prev-page').disabled = pagination.page === 1;
    document.getElementById('next-page').disabled = pagination.page === pagination.pages;
}

// ==================== UPDATE SELECT ALL CHECKBOX ==================== //
function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.querySelector('.select-all-toolbar');
    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    const noneChecked = Array.from(checkboxes).every(cb => !cb.checked);

    selectAllCheckbox.checked = allChecked;
    selectAllCheckbox.indeterminate = !allChecked && !noneChecked;
}

// ==================== DELETE SELECTED ACCOUNTS ==================== //
async function deleteSelectedAccounts() {
    if (selectedAccounts.size === 0) {
        customNotification('error', 'No Selection', 'Please select at least one account to delete.');
        return;
    }

    showConfirmModal({
        icon: 'bx-trash',
        iconColor: 'var(--cream)',
        title: 'Delete Accounts?',
        message: `Are you sure you want to delete ${selectedAccounts.size} account(s)? This action cannot be undone.`,
        confirmText: 'Yes, Delete',
        confirmColor: 'var(--red)',
        onConfirm: async (btn) => {
            btn.disabled = true;
            btn.textContent = 'Deleting...';

            try {
                const response = await fetch('/api/accounts', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: Array.from(selectedAccounts) })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to delete accounts');
                }

                customNotification('success', 'Success', data.message);
                selectedAccounts.clear();
                loadAccounts();

            } catch (error) {
                console.error('Delete accounts error:', error);
                customNotification('error', 'Error', error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Yes, Delete';
            }
        }
    });
}

// ==================== ACCOUNT MENU (for individual actions) ==================== //
function showAccountMenu(event, accountId) {
    event.stopPropagation();

    // Remove existing menu if any
    const existingMenu = document.querySelector('.account-context-menu');
    if (existingMenu) existingMenu.remove();

    // Find account data for email
    const account = accountsData.find(acc => acc._id === accountId);

    const menu = document.createElement('div');
    menu.className = 'account-context-menu';
    menu.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid var(--shadow);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        min-width: 180px;
    `;

    menu.innerHTML = `
        <div class="menu-item" onclick="sendPasswordReset('${accountId}', '${account?.email}')" style="padding: 10px 16px; cursor: pointer; transition: background 0.2s;">
            Reset Password
        </div>
        <div class="menu-item" onclick="deleteAccount('${accountId}')" style="padding: 10px 16px; cursor: pointer; transition: background 0.2s;">
            Delete Account
        </div>
    `;

    document.body.appendChild(menu);

    // Position menu
    const rect = event.target.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.left - menu.offsetWidth + 20}px`;

    // Hover effect
    const menuItems = menu.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = 'var(--cream)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'transparent';
        });
    });

    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 0);
}

// ==================== SEND PASSWORD RESET ==================== //
async function sendPasswordReset(accountId, email) {
    showConfirmModal({
        icon: 'bx-key',
        iconColor: 'var(--cream)',
        title: 'Send Password Reset?',
        message: `Send a password reset link to ${email}?`,
        confirmText: 'Send Reset Link',
        confirmColor: 'var(--green)',
        onConfirm: async (btn) => {
            btn.disabled = true;
            btn.textContent = 'Sending...';

            try {
                const response = await fetch('/api/accounts/admin-reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accountId })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to send reset link');
                }

                customNotification('success', 'Success', data.message);

            } catch (error) {
                console.error('Send reset error:', error);
                customNotification('error', 'Error', error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Send Reset Link';
            }
        }
    });
}

async function deleteAccount(accountId) {
    showConfirmModal({
        icon: 'bx-trash',
        iconColor: 'var(--cream)',
        title: 'Delete Account?',
        message: 'Are you sure you want to delete this account? This action cannot be undone.',
        confirmText: 'Yes, Delete',
        confirmColor: 'var(--red)',
        onConfirm: async (btn) => {
            btn.disabled = true;
            btn.textContent = 'Deleting...';

            try {
                const response = await fetch('/api/accounts', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: [accountId] })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to delete account');
                }

                customNotification('success', 'Success', data.message);
                loadAccounts();

            } catch (error) {
                console.error('Delete account error:', error);
                customNotification('error', 'Error', error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Yes, Delete';
            }
        }
    });
}

// ==================== EXPORT TABLE ==================== //
function exportTable() {
    if (accountsData.length === 0) {
        customNotification('error', 'No Data', 'No data available to export.');
        return;
    }

    // Create CSV content
    const headers = ['Name', 'Email', 'Created', 'Role', 'Last Login'];
    const rows = accountsData.map(account => [
        account.name,
        account.email,
        new Date(account.createdAt).toISOString().split('T')[0],
        account.role,
        account.lastLogin ? new Date(account.lastLogin).toISOString().split('T')[0] : 'Never'
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-accounts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    customNotification('success', 'Success', 'Accounts exported successfully.');
}