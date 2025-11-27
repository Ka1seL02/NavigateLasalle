// ==================== GET TOKEN FROM URL ==================== //
const urlParams = new URLSearchParams(window.location.search);
const inviteToken = urlParams.get('token');

// ==================== VERIFY TOKEN ON LOAD ==================== //
document.addEventListener('DOMContentLoaded', async () => {
    if (!inviteToken) {
        customNotification('error', 'Invalid Link', 'No invitation token found.');
        setTimeout(() => {
            window.location.href = '/admin/a_login.html';
        }, 2000);
        return;
    }

    await verifyInviteToken();
    initializePasswordToggles();
    initializeForm();
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
            throw new Error(data.message || 'Invalid invitation link');
        }

        // Pre-fill email field
        document.getElementById('email').value = data.email;

    } catch (error) {
        console.error('Token verification error:', error);
        customNotification('error', 'Invalid Invitation', error.message);
        
        setTimeout(() => {
            window.location.href = '/admin/a_login.html';
        }, 3000);
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