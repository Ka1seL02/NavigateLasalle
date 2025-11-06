// Backend Logic Code for both a_accounts.html & a_accounts_create.html
let currentSearch = '';
let currentStatus = 'all';

// Populate Admin Account List Table
async function loadAccounts(searchTerm = '', status = 'all') {
    try {
        const queryParams = new URLSearchParams();
        if (searchTerm) queryParams.append('search', searchTerm);
        if (status !== 'all') queryParams.append('status', status);
        
        const res = await fetch(`/api/accounts?${queryParams.toString()}`);
        const accounts = await res.json();

        const tableBody = document.querySelector('.table tbody');
        tableBody.innerHTML = '';
        // If there is no accounts to show
        if (!accounts.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-accounts">
                        No Accounts to show.
                    </td>
                </tr>
            `;
            return;
        }
        // If there are result
        accounts.forEach(account => {
            const tr = document.createElement('tr');
            const created = formatDateSpans(account.created);
            tr.innerHTML = `
                <td>${account.si}</td>
                <td>${account.name}</td>
                <td>${maskEmail(account.email)}</td>
                <td class="item-title">
                    <span class="main-text">${created.date}</span>
                    <span class="sub-text">${created.time}</span>
                </td>
                <td>${account.lastLogin}</td>
                <td class="actions">⋮</td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (err) {
        alert('Error fetching accounts: ' + err.message);
    }
}

// Attaching Event to Actions Dropdown
document.querySelector('.table tbody').addEventListener('click', (e) => {
    const cell = e.target.closest('.actions');
    if (!cell) return;

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
// Close dropdown if clicked outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.actions')) {
        document.querySelectorAll('.actions-menu').forEach(m => m.classList.remove('active'));
    }
});

// Main DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Loads the table with admin account list
    loadAccounts(currentSearch, currentStatus);
    // Search input
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            currentSearch = e.target.value.trim();
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
            loadAccounts(currentSearch, currentStatus);
        });
    });
})