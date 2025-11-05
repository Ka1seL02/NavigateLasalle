// Simple Code Logics
// Redirects to Create Account HTML
const createAccountBtn = document.getElementById('createAccount');
if (createAccountBtn) {
    createAccountBtn.onclick = () => (window.location.href = 'a_accounts_create.html');
}
// Redirects back to Account HTML
const cancelBtn = document.getElementById('cancel');
if (cancelBtn) {
    cancelBtn.onclick = () => (window.location.href = 'a_accounts.html');
}

// Back-end logics
// Populating the table with list of accounts
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/accounts');
        const accounts = await res.json();

        const tableBody = document.querySelector('.table tbody');
        tableBody.innerHTML = '';

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
                <td class="actions">
                    <i class='bx bx-dots-vertical-rounded'></i>
                </td>
            `;

            tableBody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error fetching accounts:', err);
    }
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
