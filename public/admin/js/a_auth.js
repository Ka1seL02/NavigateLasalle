document.addEventListener('DOMContentLoaded', () => {
    // Forms
    const loginForm = document.getElementById('loginForm');
    const forgotForm = document.getElementById('forgotForm');
    const resetForm = document.getElementById('resetForm');
    // Links
    const forgotLink = document.querySelector('.forgot-password');
    const backLink = document.querySelector('.login');

    // ==================== PASSWORD TOGGLE ==================== //
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                button.classList.remove('bx-hide');
                button.classList.add('bx-show');
            } else {
                passwordInput.type = 'password';
                button.classList.remove('bx-show');
                button.classList.add('bx-hide');
            }
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

    // ==================== LOGIN FORM SUBMIT ==================== //
    if (loginForm) {
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="text"]').value.trim();
            const password = document.getElementById('loginPassword')?.value.trim();

            if (!email || !password) {
                customNotification('error', 'Login Failed', 'Please fill the necessary fields.');
                return;
            }

            try {
                const response = await fetch('/api/accounts/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    customNotification('success', 'Login Successful', `Welcome back, ${data.user.name}!`);
                    // Use replace to prevent back button from returning to login
                    setTimeout(() => window.location.replace('/admin/a_dashboard.html'), 1500);
                } else {
                    customNotification('error', 'Login Failed', data.message);
                }
            } catch (err) {
                console.error(err);
                customNotification('error', 'Error', 'Something went wrong. Please try again.');
            }
        });
    }

    // ==================== FORGOT PASSWORD FORM SUBMIT ==================== //
    if (forgotForm) {
        forgotForm.addEventListener('submit', async e => {
            e.preventDefault();
            const email = document.getElementById('forgotEmail')?.value.trim();
            if (!email) {
                customNotification('error', 'Error', 'Please enter your email.');
                return;
            }

            try {
                const response = await fetch('/api/accounts/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (response.ok) {
                    customNotification('success', 'Email Sent', data.message);
                } else {
                    customNotification('error', 'Error', data.message || 'Something went wrong.');
                }
            } catch (err) {
                console.error(err);
                customNotification('error', 'Error', err.message || 'Something went wrong.');
            }
        });
    }

    // ==================== RESET PASSWORD FORM PAGE ==================== //
    // Track if password has been successfully reset
    let passwordResetSuccessful = false;
    // Show expired session modal
    async function showExpiredSessionModal() {
        try {
            const res = await fetch('./component/m_expired_session.html');
            const html = await res.text();
            document.body.insertAdjacentHTML('beforeend', html);
            const overlay = document.querySelector('.modal-overlay');
            overlay.classList.add('show');
        } catch (err) {
            console.error('Failed to load expired session modal: ', err);
        }
    }
    // Reset Password form submit
    if (resetForm) {
        // Check if user is already authenticated (came back via browser back button)
        (async function checkAuthAndToken() {
            // First check if user is authenticated
            try {
                const authResponse = await fetch('/api/accounts/check-session');
                const authData = await authResponse.json();

                if (authData.isAuthenticated) {
                    // User is logged in, redirect to dashboard
                    window.location.replace('/admin/a_dashboard.html');
                    return;
                }
            } catch (err) {
                console.error('Auth check error:', err);
            }

            // If not authenticated, validate the reset token
            const token = new URLSearchParams(window.location.search).get('token');
            if (!token) { await showExpiredSessionModal(); return; }

            try {
                const response = await fetch('/api/accounts/verify-reset-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    await showExpiredSessionModal();
                }

            } catch (err) {
                console.error(err);
                await showExpiredSessionModal();
            }
        })();

        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Prevent resubmission if password was already reset
            if (passwordResetSuccessful) {
                customNotification('info', 'Already Reset', 'Password has already been reset. Redirecting...');
                setTimeout(() => window.location.replace('a_login.html'), 1000);
                return;
            }

            const newPassword = document.getElementById('newPassword').value.trim();
            const confirmPassword = document.getElementById('confirmPassword').value.trim();

            if (!newPassword || !confirmPassword) {
                customNotification('error', 'Error', 'Please fill in all fields.');
                return;
            }
            if (newPassword !== confirmPassword) {
                customNotification('error', 'Error', 'Passwords do not match.');
                return;
            }

            const token = new URLSearchParams(window.location.search).get('token');

            try {
                const response = await fetch('/api/accounts/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, newPassword })
                });

                const data = await response.json();

                if (response.ok) {
                    passwordResetSuccessful = true;
                    customNotification('success', 'Success', data.message);
                    resetForm.querySelectorAll('input, button').forEach(el => el.disabled = true);
                    // Use replace to prevent back button from returning to reset page
                    setTimeout(() => window.location.replace('a_login.html'), 2000);
                } else {
                    customNotification('error', 'Error', data.message);
                }
            } catch (err) {
                console.error(err);
                customNotification('error', 'Error', 'Something went wrong.');
            }
        });

        // Prevent form resubmission when page is loaded from cache
        window.addEventListener('pageshow', async function (event) {
            if (event.persisted || passwordResetSuccessful) {
                // Check if user is authenticated
                try {
                    const authResponse = await fetch('/api/accounts/check-session');
                    const authData = await authResponse.json();

                    if (authData.isAuthenticated) {
                        // User is logged in, redirect to dashboard
                        window.location.replace('/admin/a_dashboard.html');
                        return;
                    }
                } catch (err) {
                    console.error('Auth check error:', err);
                }

                // If not authenticated but password was reset, go to login
                if (passwordResetSuccessful) {
                    window.location.replace('a_login.html');
                }
            }
        });
    }
});