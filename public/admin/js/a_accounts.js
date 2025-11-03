const API_URL = 'http://localhost:3000/api';

let currentPage = 1;
let itemsPerPage = 8;
let allAccounts = [];
let filteredAccounts = [];

// Load accounts on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadAccounts();
    setupEventListeners();
});

// Fetch accounts from API
async function loadAccounts() {
    try {
        const response = await fetch(`${API_URL}/accounts`);
        if (!response.ok) throw new Error('Failed to fetch accounts');
        allAccounts = await response.json();
        filteredAccounts = [...allAccounts];
        renderTable();
        updatePagination();
    } catch (error) {
        console.error('Error loading accounts:', error);
        alert('Failed to load accounts. Please try again.');
    }
}

// Render table with current page data
function renderTable() {
    const tbody = document.querySelector('.table tbody');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredAccounts.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No accounts found</td></tr>';
        return;
    }

    tbody.innerHTML = pageData.map(account => `
        <tr data-id="${account._id}">
            <td>${String(account.si).padStart(2, '0')}</td>
            <td>${account.name}</td>
            <td>${account.email}</td>
            <td>
                <div class="item-title">
                    <span class="main-text">${formatDate(account.created)}</span><br>
                    <span class="sub-text">${formatTime(account.created)}</span>
                </div>
            </td>
            <td>${formatLastLogin(account.lastLogin)}</td>
            <td class="actions">⋮</td>
        </tr>
    `).join('');

    // Re-initialize action dropdowns
    initializeActionDropdowns();
}

// Format date (MM/DD/YY)
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
}

// Format time (HH:MM)
function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Format last login (relative time)
function formatLastLogin(dateString) {
    if (!dateString) return 'Never';
    
    const now = new Date();
    const loginDate = new Date(dateString);
    const diffMs = now - loginDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return 'Last week';
    return formatDate(dateString);
}

// Initialize action dropdowns
function initializeActionDropdowns() {
    const menuHTML = `
        <div class="actions-menu">
            <div class="actions-menu-item reset">Reset</div>
            <div class="actions-menu-item deactivate">Deactivate</div>
            <div class="actions-menu-item delete">Delete</div>
        </div>
    `;

    document.querySelectorAll('.actions').forEach(cell => {
        cell.innerHTML = '⋮' + menuHTML;
        const menu = cell.querySelector('.actions-menu');
        
        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = menu.classList.contains('active');
            document.querySelectorAll('.actions-menu').forEach(m => m.classList.remove('active'));
            if (!isActive) menu.classList.add('active');
        });

        // Add click handlers for menu items
        menu.querySelector('.reset').addEventListener('click', () => handleReset(cell));
        menu.querySelector('.deactivate').addEventListener('click', () => handleDeactivate(cell));
        menu.querySelector('.delete').addEventListener('click', () => handleDelete(cell));
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.actions')) {
            document.querySelectorAll('.actions-menu').forEach(m => m.classList.remove('active'));
        }
    });
}

// Handle reset action
async function handleReset(cell) {
    const row = cell.closest('tr');
    const id = row.dataset.id;
    const name = row.children[1].textContent;

    if (!confirm(`Reset password for ${name}? Password will be set to "123456"`)) return;

    try {
        const response = await fetch(`${API_URL}/accounts/${id}/reset`, {
            method: 'PATCH'
        });
        if (!response.ok) throw new Error('Failed to reset password');
        alert('Password reset successfully');
    } catch (error) {
        console.error('Error resetting password:', error);
        alert('Failed to reset password');
    }
}

// Handle deactivate action
async function handleDeactivate(cell) {
    const row = cell.closest('tr');
    const id = row.dataset.id;
    const name = row.children[1].textContent;

    if (!confirm(`Toggle status for ${name}?`)) return;

    try {
        const response = await fetch(`${API_URL}/accounts/${id}/status`, {
            method: 'PATCH'
        });
        if (!response.ok) throw new Error('Failed to update status');
        await loadAccounts();
        alert('Account status updated');
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status');
    }
}

// Handle delete action
async function handleDelete(cell) {
    const row = cell.closest('tr');
    const id = row.dataset.id;
    const name = row.children[1].textContent;

    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
        const response = await fetch(`${API_URL}/accounts/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete account');
        await loadAccounts();
        alert('Account deleted successfully');
    } catch (error) {
        console.error('Error deleting account:', error);
        alert('Failed to delete account');
    }
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, filteredAccounts.length);

    document.querySelector('.entries-count').textContent = 
        `Showing ${start}-${end} of ${filteredAccounts.length} entries`;
    document.querySelector('.page-number').textContent = currentPage;

    const buttons = document.querySelectorAll('.pagination button');
    buttons[0].disabled = currentPage === 1;
    buttons[1].disabled = currentPage === 1;
    buttons[2].disabled = currentPage === totalPages;
    buttons[3].disabled = currentPage === totalPages;
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        filteredAccounts = allAccounts.filter(account => 
            account.name.toLowerCase().includes(query) ||
            account.email.toLowerCase().includes(query)
        );
        currentPage = 1;
        renderTable();
        updatePagination();
    });

    // Pagination buttons
    const buttons = document.querySelectorAll('.pagination button');
    buttons[0].addEventListener('click', () => goToPage(1));
    buttons[1].addEventListener('click', () => goToPage(currentPage - 1));
    buttons[2].addEventListener('click', () => goToPage(currentPage + 1));
    buttons[3].addEventListener('click', () => goToPage(Math.ceil(filteredAccounts.length / itemsPerPage)));
}

// Go to specific page
function goToPage(page) {
    const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
    updatePagination();
}