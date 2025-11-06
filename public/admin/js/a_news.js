// Simple Code Logics
// Redirect Buttons
// --> Create Account Form HTML
const createAccountBtn = document.getElementById('createAccount');
if (createAccountBtn) { createAccountBtn.onclick = () => (window.location.href = 'a_accounts_create.html'); }
// --> Back to Account List HTML
const cancelCreateBtn = document.getElementById('cancelCreate');
if (cancelCreateBtn) { cancelCreateBtn.onclick = () => (window.location.href = 'a_accounts.html'); }

// Back-end logics
// Populating the table with list of accounts
async function loadAccounts(searchTerm = '', status = 'all') {
    try {
        const queryParams = new URLSearchParams();
        if (searchTerm) queryParams.append('search', searchTerm);
        if (status !== 'all') queryParams.append('status', status);

        const res = await fetch(`/api/accounts?${queryParams.toString()}`);
        const accounts = await res.json();

        const tableBody = document.querySelector('.table tbody');
        tableBody.innerHTML = '';

        if (accounts.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-accounts"> No Accounts. Click "Add Account" to create one. </td>
                </tr>
            `
        } else {
            accounts.forEach(account => {
                const tr = document.createElement('tr');
                const createdDate = new Date(account.created).toLocaleDateString();
                const lastLogin = account.lastLogin
                    ? new Date(account.lastLogin).toLocaleDateString()
                    : '—';

                tr.innerHTML = `
                    <td>${account.si}</td>
                    <td>${account.name}</td>
                    <td>${account.email}</td>
                    <td>${createdDate}</td>
                    <td>${lastLogin}</td>
                    <td class="actions">⋮</td>
                `;

                tableBody.appendChild(tr);
            });
        }

    } catch (err) {
        alert('Error fetching accounts:' + err.message);
    }
}
// Debounce function to limit API calls
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}
// Load accounts on page load
document.addEventListener('DOMContentLoaded', () => {
    let currentStatus = 'all';
    let currentSearch = '';
    // Populate
    loadAccounts(currentSearch, currentStatus);
    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            currentSearch = e.target.value;
            loadAccounts(currentSearch, currentStatus);
        }, 300)); // Wait 300ms after user stops typing before searching/filtering the table
    }
    // Status tabs
    const statusButtons = document.querySelectorAll('.status-tabs .status');
    statusButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update UI active
            statusButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            // Update filter
            currentStatus = button.textContent.trim().toLowerCase();
            loadAccounts(currentSearch, currentStatus);
        })
    });
});

// Creating the Account
// Sending information to the database
const createAccountForm = document.getElementById('createAccountForm');
if (createAccountForm) {
    createAccountForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const accountData = new FormData(this);
        const data = Object.fromEntries(accountData.entries());
        if (data.password !== data.confirm_password) {
            alert('⚠️ Passwords do not match. Please recheck.');
            return;
        }
        const { confirm_password, ...payload } = data; //Trim - removing the confirm password field
        try {
            const res = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            // Check for known duplicate email error
            if (res.status === 500 && result.error && result.error.includes('duplicate key')) {
                alert('⚠️ Email already exists. Please use another email.');
                return;
            }
            // Handle success
            if (res.ok) {
                alert('✅ Account created successfully!');
                window.location.href = 'a_accounts.html';
            } else {
                // Handle any other errors in readable form
                alert('⚠️ ' + (result.error || 'Something went wrong. Please try again.'));
            }
        } catch (error) {
            alert('⚠️ Network or server error: ' + error.message);
        }
    });
}

// Actions Dropdown
document.addEventListener('DOMContentLoaded', function () {
    const menuHTML = `
            <div class="actions-menu">
                <div class="actions-menu-item reset">Reset</div>
                <div class="actions-menu-item deactivate">Deactivate</div>
                <div class="actions-menu-item delete">Delete</div>
            </div>
            `;
    // Inject menu into each actions cell
    document.querySelectorAll('.actions').forEach(cell => {
        cell.innerHTML = '⋮' + menuHTML;
        const menu = cell.querySelector('.actions-menu');
        cell.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent document click from firing
            const isActive = menu.classList.contains('active');
            // Close all other menus
            document.querySelectorAll('.actions-menu').forEach(m => m.classList.remove('active'));
            // Toggle the clicked one
            if (!isActive) {
                menu.classList.add('active');
            }
        });
    });
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.actions')) {
            document.querySelectorAll('.actions-menu').forEach(m => m.classList.remove('active'));
        }
    });
});