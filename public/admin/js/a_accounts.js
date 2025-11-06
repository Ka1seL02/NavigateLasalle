// ======================================================
// a_accounts.js
// Backend Logic for both a_accounts.html & a_accounts_create.html
// ======================================================

// ===== Global Variables =====
let currentSearch = '';
let currentStatus = 'all';
let currentSort = { column: 'si', order: 'asc' };

let currentPage = 1;
const entriesPerPage = 8;
let totalEntries = 0;

// ===== Utility: Debounce =====
function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// ===== Utility: Mask Email =====
function maskEmail(email) {
    const [name, domain] = email.split('@');
    const masked = name[0] + '***' + name.slice(-1);
    return `${masked}@${domain}`;
}

// ===== Utility: Format Created Date =====
function formatDateSpans(dateString) {
    if (!dateString) return { date: '—', time: '' };
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const formattedDate = date.toLocaleDateString(undefined, options);
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { date: formattedDate, time: formattedTime };
}

// ===== Pagination Buttons =====
function updatePaginationButtons() {
    const totalPages = Math.ceil(totalEntries / entriesPerPage);
    const paginationButtons = document.querySelectorAll('.pagination .pagination-button');
    const pageNumberSpan = document.querySelector('.pagination .page-number');

    if (!paginationButtons.length) return;

    // Disable all if no entries
    if (totalPages === 0) {
        paginationButtons.forEach(btn => btn.disabled = true);
        if (pageNumberSpan) pageNumberSpan.textContent = '0';
        return;
    }

    if (pageNumberSpan) pageNumberSpan.textContent = currentPage;

    // Enable/disable first & prev
    if (paginationButtons[0]) paginationButtons[0].disabled = currentPage === 1;
    if (paginationButtons[1]) paginationButtons[1].disabled = currentPage === 1;
    // Enable/disable next & last
    if (paginationButtons[2]) paginationButtons[2].disabled = currentPage === totalPages;
    if (paginationButtons[3]) paginationButtons[3].disabled = currentPage === totalPages;

    // Event listeners
    if (paginationButtons[0]) paginationButtons[0].onclick = () => {
        if (totalPages > 0) {
            currentPage = 1;
            loadAccounts(currentSearch, currentStatus, currentSort);
        }
    };
    if (paginationButtons[1]) paginationButtons[1].onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            loadAccounts(currentSearch, currentStatus, currentSort);
        }
    };
    if (paginationButtons[2]) paginationButtons[2].onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadAccounts(currentSearch, currentStatus, currentSort);
        }
    };
    if (paginationButtons[3]) paginationButtons[3].onclick = () => {
        if (totalPages > 0) {
            currentPage = totalPages;
            loadAccounts(currentSearch, currentStatus, currentSort);
        }
    };
}

// ===== Load Accounts =====
async function loadAccounts(searchTerm = '', status = 'all', sort = currentSort) {
    try {
        const queryParams = new URLSearchParams();
        if (searchTerm) queryParams.append('search', searchTerm);
        if (status !== 'all') queryParams.append('status', status);

        const res = await fetch(`/api/accounts?${queryParams.toString()}`);
        const accounts = await res.json();

        // Filter by status if needed
        let filteredAccounts = accounts;
        if (status === 'active') filteredAccounts = accounts.filter(acc => acc.isActive);
        if (status === 'deactivated') filteredAccounts = accounts.filter(acc => !acc.isActive);

        totalEntries = filteredAccounts.length;

        // Sort
        filteredAccounts.sort((a, b) => {
            let valA = a[sort.column];
            let valB = b[sort.column];

            if (sort.column === 'created' || sort.column === 'lastLogin') {
                valA = valA ? new Date(valA).getTime() : 0;
                valB = valB ? new Date(valB).getTime() : 0;
            }

            if (valA < valB) return sort.order === 'asc' ? -1 : 1;
            if (valA > valB) return sort.order === 'asc' ? 1 : -1;
            return 0;
        });

        // Adjust page if out of range
        const maxPage = Math.ceil(totalEntries / entriesPerPage);
        if (currentPage > maxPage) currentPage = 1;

        // Pagination slice
        const startIdx = (currentPage - 1) * entriesPerPage;
        const endIdx = startIdx + entriesPerPage;
        const paginatedAccounts = filteredAccounts.slice(startIdx, endIdx);

        const tableBody = document.querySelector('.table tbody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        // No accounts
        if (!paginatedAccounts.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-accounts">
                        No Accounts to show.
                    </td>
                </tr>
            `;
            document.querySelector('.entries-count').textContent = `Showing 0-0 of 0 entries`;
            updatePaginationButtons();
            return;
        }

        // Render rows
        paginatedAccounts.forEach(account => {
            const created = formatDateSpans(account.created);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${account.si}</td>
                <td>${account.name}</td>
                <td>${maskEmail(account.email)}</td>
                <td class="item-title">
                    <span class="main-text">${created.date}</span>
                    <span class="sub-text">${created.time}</span>
                </td>
                <td>${account.lastLogin || '—'}</td>
                <td class="actions">⋮</td>
            `;
            tableBody.appendChild(tr);
        });

        // Update entries count
        const countText = document.querySelector('.entries-count');
        const showingStart = startIdx + 1;
        const showingEnd = Math.min(endIdx, totalEntries);
        countText.textContent = `Showing ${showingStart}-${showingEnd} of ${totalEntries} entries`;

        updatePaginationButtons();
    } catch (err) {
        alert('Error fetching accounts: ' + err.message);
    }
}

// ===== Actions Dropdown =====
document.addEventListener('click', (e) => {
    const cell = e.target.closest('.actions');
    if (!cell) {
        document.querySelectorAll('.actions-menu').forEach(m => m.classList.remove('active'));
        return;
    }

    let menu = cell.querySelector('.actions-menu');
    if (!menu) {
        const menuHTML = `
            <div class="actions-menu">
                <div class="actions-menu-item reset">Reset</div>
                <div class="actions-menu-item deactivate">Deactivate</div>
                <div class="actions-menu-item delete">Delete</div>
            </div>
        `;
        cell.innerHTML = '⋮' + menuHTML;
        menu = cell.querySelector('.actions-menu');
    }

    const isActive = menu.classList.contains('active');
    document.querySelectorAll('.actions-menu').forEach(m => m.classList.remove('active'));
    if (!isActive) menu.classList.add('active');
});

// ======================================================
// DOMContentLoaded — unified for both pages
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    const isAccountListPage = document.querySelector('.table');
    const isAccountCreatePage = document.getElementById('createAccountForm');

    // ===== Account List Page =====
    if (isAccountListPage) {
        loadAccounts(currentSearch, currentStatus);

        // Search
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                currentSearch = e.target.value.trim();
                currentPage = 1;
                loadAccounts(currentSearch, currentStatus);
            }, 300));
        }

        // Status tabs
        const statusButtons = document.querySelectorAll('.status-tabs .status');
        statusButtons.forEach(button => {
            button.addEventListener('click', () => {
                statusButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentStatus = button.textContent.trim().toLowerCase();
                currentPage = 1;
                loadAccounts(currentSearch, currentStatus);
            });
        });

        // Column sorting
        document.querySelectorAll('.table th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.getAttribute('data-sort');
                if (currentSort.column === column) {
                    currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.column = column;
                    currentSort.order = 'asc';
                }
                loadAccounts(currentSearch, currentStatus, currentSort);
            });
        });

        // Redirect to create account form
        const createAccountBtn = document.getElementById('createAccount');
        if (createAccountBtn) {
            createAccountBtn.onclick = () => (window.location.href = 'a_accounts_create.html');
        }
    }

    // ===== Create Account Page =====
    if (isAccountCreatePage) {
        const createAccountForm = document.getElementById('createAccountForm');
        createAccountForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const accountData = new FormData(this);
            const data = Object.fromEntries(accountData.entries());

            if (data.password !== data.confirm_password) {
                alert('⚠️ Passwords do not match. Please recheck.');
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
                    alert('⚠️ Email already exists. Please use another email.');
                    return;
                }

                if (res.ok) {
                    alert('✅ Account created successfully!');
                    window.location.href = 'a_accounts.html';
                } else {
                    alert('⚠️ ' + (result.error || 'Something went wrong.'));
                }
            } catch (error) {
                alert('⚠️ Network or server error: ' + error.message);
            }
        });

        // Cancel button
        const cancelCreateBtn = document.getElementById('cancelCreate');
        if (cancelCreateBtn) {
            cancelCreateBtn.onclick = () => (window.location.href = 'a_accounts.html');
        }

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
