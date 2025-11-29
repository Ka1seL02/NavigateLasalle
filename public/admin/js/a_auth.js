document.addEventListener('DOMContentLoaded', () => {
    // ==================== ELEMENTS ==================== //
    const loginForm = document.getElementById('loginForm');
    const forgotForm = document.getElementById('forgotForm');
    const resetForm = document.getElementById('resetForm');
    const createForm = document.getElementById('createForm');

    const forgotLink = document.querySelector('.forgot-password');
    const backLink = document.querySelector('.login');

    // ==================== PASSWORD TOGGLE ==================== //
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', () => {
            const input = document.getElementById(button.dataset.target);
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            button.classList.toggle('bx-show', isPassword);
            button.classList.toggle('bx-hide', !isPassword);
        });
    });

    // ==================== FORM SWITCH LINKS ==================== //
    if (forgotLink && backLink && loginForm && forgotForm) {
        forgotLink.addEventListener('click', e => {
            e.preventDefault();
            loginForm.classList.add('hidden');
            forgotForm.classList.remove('hidden');
            forgotLink.classList.add('hidden');
            backLink.classList.remove('hidden');
        });
        backLink.addEventListener('click', e => {
            e.preventDefault();
            loginForm.classList.remove('hidden');
            forgotForm.classList.add('hidden');
            forgotLink.classList.remove('hidden');
            backLink.classList.add('hidden');
        });
    }

    // ==================== HELPER FUNCTIONS ==================== //
    async function showModal(url) {
        try {
            const res = await fetch(url);
            const html = await res.text();
            document.body.insertAdjacentHTML('beforeend', html);
        } catch (err) {
            console.error('Failed to load modal:', err);
        }
    }

    async function verifyToken(apiEndpoint, token) {
        try {
            const res = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            return await res.json();
        } catch (err) {
            console.error('Token verification error:', err);
            return { success: false };
        }
    }

    async function checkSession() {
        try {
            const res = await fetch('/api/accounts/check-session');
            return (await res.json()).isAuthenticated;
        } catch (err) {
            console.error('Session check failed:', err);
            return false;
        }
    }

    // ==================== LOGIN FORM ==================== //
    if (loginForm) {
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="text"]').value.trim();
            const password = document.getElementById('loginPassword')?.value.trim();

            if (!email || !password) return customNotification('error', 'Login Failed', 'Please fill the necessary fields.');

            try {
                const res = await fetch('/api/accounts/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();

                if (res.ok) {
                    customNotification('success', 'Login Successful', `Welcome back, ${data.user.name}!`);
                    setTimeout(() => window.location.replace('/admin/a_dashboard.html'), 1500);
                } else customNotification('error', 'Login Failed', data.message);
            } catch (err) {
                console.error(err);
                customNotification('error', 'Error', 'Something went wrong. Please try again.');
            }
        });
    }

    // ==================== FORGOT PASSWORD ==================== //
    if (forgotForm) {
        forgotForm.addEventListener('submit', async e => {
            e.preventDefault();
            const email = document.getElementById('forgotEmail')?.value.trim();
            if (!email) return customNotification('error', 'Error', 'Please enter your email.');

            try {
                const res = await fetch('/api/accounts/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();

                data.message
                    ? customNotification(res.ok ? 'success' : 'error', res.ok ? 'Email Sent' : 'Error', data.message)
                    : customNotification('error', 'Error', 'Something went wrong.');
            } catch (err) {
                console.error(err);
                customNotification('error', 'Error', 'Something went wrong.');
            }
        });
    }

    // ==================== RESET PASSWORD ==================== //
    if (resetForm) {
        let resetDone = false;

        (async function initReset() {
            // Prevent logged-in user from accessing reset
            if (await checkSession()) return window.location.replace('/admin/a_dashboard.html');

            await showModal('./component/m_expired_link.html');

            const token = new URLSearchParams(window.location.search).get('token');
            if (!token || !(await verifyToken('/api/accounts/verify-reset-token', token)).success) {
                document.querySelector('.modal-overlay')?.classList.add('show');
                return;
            }
        })();

        resetForm.addEventListener('submit', async e => {
            e.preventDefault();
            if (resetDone) return customNotification('info', 'Already Reset', 'Password has already been reset. Redirecting...');

            const newPassword = document.getElementById('newPassword').value.trim();
            const confirmPassword = document.getElementById('confirmPassword').value.trim();

            // ==================== VALIDATION ==================== //
            if (!newPassword || !confirmPassword)
                return customNotification('error', 'Error', 'Please fill in all fields.');

            if (newPassword.length < 8)
                return customNotification('error', 'Weak Password', 'Password must be at least 8 characters long.');

            if (newPassword !== confirmPassword)
                return customNotification('error', 'Error', 'Passwords do not match.');

            const token = new URLSearchParams(window.location.search).get('token');

            try {
                const res = await fetch('/api/accounts/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, newPassword })
                });
                const data = await res.json();

                if (res.ok) {
                    resetDone = true;
                    customNotification('success', 'Success', data.message);
                    resetForm.querySelectorAll('input, button').forEach(el => el.disabled = true);
                    setTimeout(() => window.location.replace('a_login.html'), 2000);
                } else customNotification('error', 'Error', data.message);
            } catch (err) {
                console.error(err);
                customNotification('error', 'Error', 'Something went wrong.');
            }
        });

        window.addEventListener('pageshow', async function (event) {
            if (event.persisted || resetDone) {
                if (await checkSession()) return window.location.replace('/admin/a_dashboard.html');
                if (resetDone) window.location.replace('a_login.html');
            }
        });
    }

    // ==================== CREATE ACCOUNT ==================== //
    if (createForm) {
        const inviteToken = new URLSearchParams(window.location.search).get('token');

        (async function initCreate() {
            await showModal('./component/m_expired_link.html');

            if (!inviteToken || !(await verifyToken('/api/accounts/verify-invite-token', inviteToken)).success) {
                document.querySelector('.modal-overlay')?.classList.add('show');
                return;
            }

            const { email } = await verifyToken('/api/accounts/verify-invite-token', inviteToken);
            document.getElementById('email').value = email || '';
        })();

        createForm.addEventListener('submit', async e => {
            e.preventDefault();

            const name = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // ==================== VALIDATION ==================== //
            if (!name || !email || !password || !confirmPassword)
                return customNotification('error', 'Validation Error', 'Please fill in all fields.');
            if (password.length < 8) return customNotification('error', 'Weak Password', 'Password must be at least 8 characters.');
            if (password !== confirmPassword) return customNotification('error', 'Password Mismatch', 'Passwords do not match.');

            const submitBtn = createForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Account...';

            try {
                const res = await fetch('/api/accounts/create-from-invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: inviteToken, name, password })
                });
                const data = await res.json();

                if (res.ok) {
                    customNotification('success', 'Success', data.message);
                    setTimeout(() => window.location.href = '/admin/a_login.html', 2000);
                } else {
                    throw new Error(data.message || 'Failed to create account');
                }
            } catch (err) {
                console.error(err);
                customNotification('error', 'Error', err.message);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Account';
            }
        });
    }
});