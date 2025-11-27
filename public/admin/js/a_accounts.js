// ==================== STATE MANAGEMENT ==================== //
let currentPage = 1;
let totalPages = 1;
let accountsData = [];
let selectedAccounts = new Set();

// ==================== INITIALIZATION ==================== //
document.addEventListener('DOMContentLoaded', () => {
    loadAccounts();
    loadInviteModal();
    initializeEventListeners();
});

// ==================== LOAD INVITE MODAL COMPONENT ==================== //
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
        const isActive = account.lastLogin && 
            (Date.now() - new Date(account.lastLogin).getTime()) < 30 * 24 * 60 * 60 * 1000;
        const formattedDate = new Date(account.createdAt).toISOString().split('T')[0];
        
        return `
            <tr>
                <td><input type="checkbox" data-id="${account._id}" ${selectedAccounts.has(account._id) ? 'checked' : ''}></td>
                <td>${account.name}</td>
                <td>${account.email}</td>
                <td>${formattedDate}</td>
                <td>${isActive ? 'Yes' : 'No'}</td>
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

    if (!confirm(`Are you sure you want to delete ${selectedAccounts.size} account(s)? This action cannot be undone.`)) {
        return;
    }

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
    }
}

// ==================== ACCOUNT MENU (for individual actions) ==================== //
function showAccountMenu(event, accountId) {
    event.stopPropagation();
    
    // Remove existing menu if any
    const existingMenu = document.querySelector('.account-context-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'account-context-menu';
    menu.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid var(--shadow);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        min-width: 150px;
        padding: 8px 0;
    `;

    menu.innerHTML = `
        <div class="menu-item" onclick="deleteAccount('${accountId}')" style="padding: 10px 16px; cursor: pointer; transition: background 0.2s;">
            <i class='bx bx-trash' style="margin-right: 8px; color: var(--red);"></i>
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

async function deleteAccount(accountId) {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
        return;
    }

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
    }
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