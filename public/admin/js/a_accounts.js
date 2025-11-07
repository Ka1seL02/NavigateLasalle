// a_accounts.js

let currentSearch = '';
let currentStatus = 'all';
let currentSort = { column: 'si', order: 'asc' };
let accountsData = []; // Store all fetched accounts

// ========================
// Load Accounts
async function loadAccounts() {
    try {
        const queryParams = new URLSearchParams();
        if (currentSearch) queryParams.append('search', currentSearch);
        if (currentStatus !== 'all') queryParams.append('status', currentStatus);

        const res = await fetch(`/api/accounts?${queryParams.toString()}`);
        accountsData = await res.json();

        renderAccounts();
    } catch (err) {
        alert('Error fetching accounts: ' + err.message);
    }
}

// ========================
// Render Accounts Table
function renderAccounts() {
    const tableBody = document.querySelector('.table tbody');
    tableBody.innerHTML = '';

    if (!accountsData.length) {
        tableBody.innerHTML = `<tr><td colspan="6" class="no-accounts">No accounts found.</td></tr>`;
        document.querySelector('.entries-count').textContent = 'Showing 0 of 0 entries';
        updatePaginationUI(0, renderAccounts);
        return;
    }

    // Apply status filter
    let filtered = accountsData;
    if (currentStatus === 'active') filtered = filtered.filter(acc => acc.isActive);
    if (currentStatus === 'deactivated') filtered = filtered.filter(acc => !acc.isActive);

    // Sort
    filtered.sort((a, b) => {
        let valA = a[currentSort.column];
        let valB = b[currentSort.column];
        if (currentSort.column === 'created' || currentSort.column === 'lastLogin') {
            valA = valA ? new Date(valA).getTime() : 0;
            valB = valB ? new Date(valB).getTime() : 0;
        }
        if (valA < valB) return currentSort.order === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.order === 'asc' ? 1 : -1;
        return 0;
    });

    // Paginate
    const paginated = paginateArray(filtered);

    // Render rows
    paginated.forEach(acc => {
        const created = formatDateSpans(acc.created);
        const statusLabel = acc.isActive ? 'Deactivate' : 'Activate';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${acc.si}</td>
            <td>${acc.name}</td>
            <td>${maskEmail(acc.email)}</td>
            <td class="item-title">
                <span class="main-text">${created.date}</span>
                <span class="sub-text">${created.time}</span>
            </td>
            <td>${acc.lastLogin || '—'}</td>
            <td class="actions" data-si="${acc.si}" data-active="${acc.isActive}">⋮
                <div class="actions-menu">
                    <div class="actions-menu-item reset">Reset</div>
                    <div class="actions-menu-item toggle">${statusLabel}</div>
                    <div class="actions-menu-item delete">Delete</div>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    const countText = document.querySelector('.entries-count');
    const startIdx = (currentPage - 1) * entriesPerPage;
    const endIdx = startIdx + paginated.length;
    countText.textContent = `Showing ${startIdx + 1}-${startIdx + paginated.length} of ${filtered.length} entries`;

    updatePaginationUI(filtered.length, renderAccounts);
}

// ========================
// Action Buttons (Delegated)
document.addEventListener('click', async (e) => {
    // Toggle actions menu
    const cell = e.target.closest('.actions');
    if (cell && !e.target.closest('.actions-menu-item')) {
        document.querySelectorAll('.actions-menu').forEach(m => m.classList.remove('active'));
        const menu = cell.querySelector('.actions-menu');
        if (menu) menu.classList.toggle('active');
        return;
    }

    // Action items: Reset / Toggle / Delete
    const actionItem = e.target.closest('.actions-menu-item');
    if (!actionItem) return;

    const parentCell = e.target.closest('.actions');
    const si = parentCell.dataset.si;

    if (actionItem.classList.contains('reset')) {
        if (confirm('Reset password to default?')) {
            const res = await fetch(`/api/accounts/${si}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset' })
            });
            const data = await res.json();
            alert(data.message);
            loadAccounts();
        }
    }

    if (actionItem.classList.contains('toggle')) {
        const currentlyActive = parentCell.dataset.active === 'true';
        const confirmMsg = currentlyActive
            ? 'Are you sure you want to deactivate this account?'
            : 'Are you sure you want to activate this account?';
        if (confirm(confirmMsg)) {
            const res = await fetch(`/api/accounts/${si}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deactivate' })
            });
            const data = await res.json();
            alert(data.message);
            loadAccounts();
        }
    }

    if (actionItem.classList.contains('delete')) {
        if (confirm('Delete this account permanently?')) {
            const res = await fetch(`/api/accounts/${si}`, { method: 'DELETE' });
            const data = await res.json();
            alert(data.message);
            loadAccounts();
        }
    }
});

// ========================
// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    const isAccountListPage = document.querySelector('.table');
    const isAccountCreatePage = document.getElementById('createAccountForm');

    if (isAccountListPage) {
        loadAccounts();

        // Search
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) searchInput.addEventListener('input', debounce(e => {
            currentSearch = e.target.value.trim();
            resetPagination();
            loadAccounts();
        }, 300));

        // Status tabs
        document.querySelectorAll('.status-tabs .status').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.status-tabs .status').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentStatus = btn.textContent.trim().toLowerCase();
                resetPagination();
                loadAccounts();
            });
        });

        // Column sorting
        document.querySelectorAll('.table th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.getAttribute('data-sort');
                if (currentSort.column === column) currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
                else currentSort.column = column, currentSort.order = 'asc';
                resetPagination();
                loadAccounts();
            });
        });

        // Create account button
        const createAccountBtn = document.getElementById('createAccount');
        if (createAccountBtn) createAccountBtn.onclick = () => window.location.href = 'a_accounts_create.html';
    }

    if (isAccountCreatePage) {
        const createAccountForm = document.getElementById('createAccountForm');
        createAccountForm.addEventListener('submit', async e => {
            e.preventDefault();
            const formData = new FormData(createAccountForm);
            const data = Object.fromEntries(formData.entries());

            if (data.password !== data.confirm_password) {
                alert('Passwords do not match.');
                return;
            }

            const { confirm_password, ...payload } = data;
            try {
                const res = await fetch('/api/accounts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await res.json();

                if (res.status === 500 && result.error?.includes('duplicate key')) {
                    alert('Email already exists.');
                    return;
                }

                if (res.ok) {
                    alert('Account created successfully!');
                    window.location.href = 'a_accounts.html';
                } else {
                    alert(result.error || 'Something went wrong.');
                }
            } catch (err) {
                alert('Network/server error: ' + err.message);
            }
        });

        const cancelBtn = document.getElementById('cancelCreate');
        if (cancelBtn) cancelBtn.onclick = () => window.location.href = 'a_accounts.html';

        // Toggle password visibility
        document.querySelectorAll('.toggle-password').forEach(icon => {
            icon.addEventListener('click', () => {
                const target = document.getElementById(icon.dataset.target);
                if (target.type === 'password') {
                    target.type = 'text';
                    icon.classList.replace('bx-hide', 'bx-show');
                } else {
                    target.type = 'password';
                    icon.classList.replace('bx-show', 'bx-hide');
                }
            });
        });
    }
});