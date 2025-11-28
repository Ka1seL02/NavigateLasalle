// ==================== GET TOKEN FROM URL ==================== //
const urlParams = new URLSearchParams(window.location.search);
const inviteToken = urlParams.get('token');

// ==================== LOAD TOKEN ERROR MODAL ==================== //
async function loadTokenErrorModal() {
    try {
        const response = await fetch('./component/m_expired_token.html');
        const html = await response.text();
        document.body.insertAdjacentHTML('beforeend', html);
    } catch (error) {
        console.error('Error loading token error modal:', error);
    }
}

// ==================== SHOW TOKEN ERROR MODAL ==================== //
function showTokenError() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.classList.add('show');
    }
}

// ==================== VERIFY TOKEN ON LOAD ==================== //
document.addEventListener('DOMContentLoaded', async () => {
    // Load modal first
    await loadTokenErrorModal();

    // Check if token exists
    if (!inviteToken) {
        showTokenError();
        return;
    }

    // Verify token
    const isValid = await verifyInviteToken();
    
    if (isValid) {
        initializePasswordToggles();
        initializeForm();
    }
});

// ==================== VERIFY INVITE TOKEN ==================== //
async function verifyInviteToken() {
    try {
        const response = await fetch('/api/accounts/verify-invite-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: inviteToken })
        });

        const data = await response.json();

        if (!response.ok) {
            showTokenError();
            return false;
        }

        // Pre-fill email field
        document.getElementById('email').value = data.email;
        return true;

    } catch (error) {
        console.error('Token verification error:', error);
        showTokenError();
        return false;
    }
}

// ==================== INITIALIZE PASSWORD TOGGLES ==================== //
function initializePasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('bx-hide');
                this.classList.add('bx-show');
            } else {
                input.type = 'password';
                this.classList.remove('bx-show');
                this.classList.add('bx-hide');
            }
        });
    });
}

// ==================== INITIALIZE FORM ==================== //
function initializeForm() {
    const form = document.getElementById('createAccountForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            customNotification('error', 'Validation Error', 'Please fill in all fields.');
            return;
        }

        if (password.length < 8) {
            customNotification('error', 'Weak Password', 'Password must be at least 8 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            customNotification('error', 'Password Mismatch', 'Passwords do not match.');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';

        try {
            const response = await fetch('/api/accounts/create-from-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: inviteToken,
                    name,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create account');
            }

            customNotification('success', 'Success', data.message);

            setTimeout(() => {
                window.location.href = '/admin/a_login.html';
            }, 2000);

        } catch (error) {
            console.error('Create account error:', error);
            customNotification('error', 'Error', error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    });
}