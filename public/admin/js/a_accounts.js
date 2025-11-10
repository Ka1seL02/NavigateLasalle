// ---------------- Modal Elements ----------------
const accountModal = document.getElementById('accountModal');
const accountForm = document.getElementById('accountForm');
const createAccountBtn = document.getElementById('createAccount');
const closeModalBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const submitBtn = document.getElementById('submitBtn');

// ---------------- Modal Functions ----------------
const toggleModal = (show) => {
    accountModal.classList.toggle('hidden', !show);
    if (!show) accountForm.reset();
};

// Open modal
createAccountBtn.addEventListener('click', () => toggleModal(true));

// Close modal
[closeModalBtn, cancelBtn].forEach(btn => btn.addEventListener('click', () => toggleModal(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleModal(false); });

// ---------------- Account Form Submission ----------------
submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const name = accountForm.accountName.value.trim();
    const email = accountForm.accountEmail.value.trim();

    if (!name || !email) return alert('Please fill in all fields');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('Please enter a valid email');

    try {
        const res = await fetch('/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password: 'admin12345' })
        });
        const data = await res.json();

        if (res.ok) {
            alert('Account created successfully!');
            toggleModal(false);
            currentPage = 1; // reset to first page
            loadAccounts(...Object.values(getFilters()));
        } else {
            alert(`Error: ${data.error || 'Failed to create account'}`);
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred while creating the account');
    }
});

// ---------------- Table & Pagination Setup ----------------
const tbody = document.querySelector('.table tbody');
const searchInput = document.querySelector('.search-box input');
const statusTabsContainer = document.querySelector('.status-tabs');
const refreshBtn = document.getElementById('refresh-table');

const selectAllToolbar = document.querySelector('.select-all-toolbar');
const activateSelectedBtn = document.getElementById('activate-selected');
const deactivateSelectedBtn = document.getElementById('deactivate-selected');
const deleteSelectedBtn = document.getElementById('delete-selected');

const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const entriesCount = document.querySelector('.entries-count');

let currentPage = 1;
const maxPerPage = 50; // for testing, change to 50 later

// ---------------- Helper Functions ----------------
const getFilters = () => {
    const search = searchInput?.value || '';
    const activeTab = document.querySelector('.status.active');
    const status = activeTab?.textContent.toLowerCase() === 'active' ? 'active'
                 : activeTab?.textContent.toLowerCase() === 'deactivated' ? 'deactivated'
                 : '';
    return { search, status };
};

function getSelectedSIs() {
    return Array.from(document.querySelectorAll('.select-account:checked'))
        .map(cb => cb.dataset.si);
}

// ---------------- Load Accounts Table ----------------
async function loadAccounts(search = '', status = '') {
    try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        const query = params.toString();

        const res = await fetch(`/api/accounts${query ? '?' + query : ''}`);
        if (!res.ok) throw new Error('Failed to fetch accounts');

        const allAccounts = await res.json();

        // --- Simulate pagination ---
        const totalAccounts = allAccounts.length;
        const totalPages = Math.ceil(totalAccounts / maxPerPage);
        const paginatedAccounts = allAccounts.slice((currentPage - 1) * maxPerPage, currentPage * maxPerPage);

        // --- Populate table ---
        tbody.innerHTML = paginatedAccounts.length
            ? paginatedAccounts.map(a => {
                const created = formatDate(a.created || a.createdAt);
                const lastLogin = a.lastLogin ? formatDate(a.lastLogin) : 'Never';
                return `
                    <tr>
                        <td class="checkbox-column"><input type="checkbox" class="select-account" data-si="${a.si}"></td>
                        <td>${a.si}</td>
                        <td>${a.name}</td>
                        <td>${maskEmail(a.email)}</td>
                        <td>${created}</td>
                        <td>${lastLogin}</td>
                        <td class="actions"><button data-si="${a.si}">⋮</button></td>
                    </tr>`;
            }).join('')
            : '<tr><td colspan="7" class="empty-list">No Account Found.</td></tr>';

        // --- Update entries count ---
        const start = paginatedAccounts.length ? (currentPage - 1) * maxPerPage + 1 : 0;
        const end = start + paginatedAccounts.length - 1;
        entriesCount.textContent = `${start}-${end} of ${totalAccounts}`;

        // --- Update pagination buttons ---
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;

        // Reset select-all checkbox
        selectAllToolbar.checked = false;
        selectAllToolbar.indeterminate = false;

        resetActionButtons();

    } catch (err) {
        console.error(err);
        alert('Failed to load accounts');
    }
}

// ---------------- Pagination Button Listeners ----------------
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadAccounts(...Object.values(getFilters()));
    }
});

nextPageBtn.addEventListener('click', () => {
    currentPage++;
    loadAccounts(...Object.values(getFilters()));
});

// ---------------- Table Controls ----------------

// Select All Checkbox
selectAllToolbar?.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.select-account');
    checkboxes.forEach(cb => cb.checked = e.target.checked);
});

// Update select-all when individual checkboxes change
tbody.addEventListener('change', (e) => {
    if (e.target.classList.contains('select-account')) {
        const allCheckboxes = document.querySelectorAll('.select-account');
        const checkedCount = document.querySelectorAll('.select-account:checked').length;
        selectAllToolbar.checked = checkedCount === allCheckboxes.length;
        selectAllToolbar.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
    }
});

// Activate Selected
activateSelectedBtn?.addEventListener('click', async () => {
    const selectedSIs = getSelectedSIs();
    if (selectedSIs.length === 0) return alert('Please select at least one account');

    try {
        const res = await fetch('/api/accounts');
        const allAccounts = await res.json();

        const accountsToActivate = selectedSIs.filter(si => {
            const acc = allAccounts.find(a => a.si == si);
            return acc && !acc.isActive;
        });

        if (accountsToActivate.length === 0) return alert('All selected accounts are already active');
        if (!confirm(`Activate ${accountsToActivate.length} account(s)?`)) return;

        await Promise.all(accountsToActivate.map(si => 
            fetch(`/api/accounts/${si}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'activate' })
            })
        ));

        alert('Accounts activated successfully!');
        loadAccounts(...Object.values(getFilters()));

    } catch (err) {
        console.error(err);
        alert('Failed to activate accounts');
    }
});

// Deactivate Selected
deactivateSelectedBtn?.addEventListener('click', async () => {
    const selectedSIs = getSelectedSIs();
    if (selectedSIs.length === 0) return alert('Please select at least one account');

    try {
        const res = await fetch('/api/accounts');
        const allAccounts = await res.json();

        const accountsToDeactivate = selectedSIs.filter(si => {
            const acc = allAccounts.find(a => a.si == si);
            return acc && acc.isActive;
        });

        if (accountsToDeactivate.length === 0) return alert('All selected accounts are already deactivated');
        if (!confirm(`Deactivate ${accountsToDeactivate.length} account(s)?`)) return;

        await Promise.all(accountsToDeactivate.map(si => 
            fetch(`/api/accounts/${si}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deactivate' })
            })
        ));

        alert('Accounts deactivated successfully!');
        loadAccounts(...Object.values(getFilters()));

    } catch (err) {
        console.error(err);
        alert('Failed to deactivate accounts');
    }
});

// Delete Selected
deleteSelectedBtn?.addEventListener('click', async () => {
    const selectedSIs = getSelectedSIs();
    if (selectedSIs.length === 0) return alert('Please select at least one account');

    if (!confirm(`Delete ${selectedSIs.length} account(s)? This action cannot be undone.`)) return;

    try {
        await Promise.all(selectedSIs.map(si => 
            fetch(`/api/accounts/${si}`, { method: 'DELETE' })
        ));

        alert('Accounts deleted successfully!');
        loadAccounts(...Object.values(getFilters()));

    } catch (err) {
        console.error(err);
        alert('Failed to delete accounts');
    }
});

// --------------- Function Buttons ----------------
function updateTableActionButtons() {
    const anyChecked = document.querySelectorAll('.select-account:checked').length > 0;
    activateSelectedBtn.disabled = !anyChecked;
    deactivateSelectedBtn.disabled = !anyChecked;
    deleteSelectedBtn.disabled = !anyChecked;
}

// Call on checkbox change
tbody.addEventListener('change', e => {
    if (e.target.classList.contains('select-account')) {
        const allCheckboxes = document.querySelectorAll('.select-account');
        const checkedCount = document.querySelectorAll('.select-account:checked').length;

        // Update select-all checkbox
        selectAllToolbar.checked = checkedCount === allCheckboxes.length;
        selectAllToolbar.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;

        // Update action buttons
        updateTableActionButtons();
    }
});

// Also update when select-all toolbar is clicked
selectAllToolbar?.addEventListener('change', () => updateTableActionButtons());

// Reset buttons on table reload
function resetActionButtons() {
    activateSelectedBtn.disabled = true;
    deactivateSelectedBtn.disabled = true;
    deleteSelectedBtn.disabled = true;
}

// ---------------- Filters & Refresh ----------------
searchInput?.addEventListener('input', () => {
    currentPage = 1;
    loadAccounts(...Object.values(getFilters()));
});

statusTabsContainer?.addEventListener('click', e => {
    if (!e.target.classList.contains('status')) return;
    statusTabsContainer.querySelectorAll('.status').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    currentPage = 1;
    loadAccounts(...Object.values(getFilters()));
});

refreshBtn?.addEventListener('click', () => loadAccounts(...Object.values(getFilters())));

// ---------------- Initial Load ----------------
loadAccounts(...Object.values(getFilters()));