document.addEventListener('DOMContentLoaded', () => {
    // Forms
    const loginForm = document.getElementById('loginForm');
    const forgotForm = document.getElementById('forgotForm');
    const resetForm = document.getElementById('resetForm');
    // Links
    const forgotLink = document.querySelector('.forgot-password');
    const backLink = document.querySelector('.login');

    // -------------------- Password Toggle -------------------- //
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

    // -------------------- Modal Helper Function -------------------- //
    function showModal(title, message, type = 'error') {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        modalContent.innerHTML = `
            <h2>${title}</h2>
            <p>${message}</p>
            <button class="btn ${type === 'error' ? 'btn-error' : ''}" onclick="this.closest('.modal-overlay').remove(); window.location.href='a_login.html';">
                Back to Login
            </button>
        `;
        overlay.appendChild(modalContent);
        document.body.appendChild(overlay);
    }

    // -------------------- Login Form -------------------- //
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="text"]').value.trim();
            const password = loginForm.querySelector('input[type="password"]').value.trim();
            // Validation
            if (!email || !password) {
                customNotification('error', 'Login Failed', 'Please fill the necessary fields.');
                return;
            }
            // Request
            try {
                const response = await fetch('/api/accounts/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    customNotification('success', 'Login Successful', `Welcome back, ${data.user.name}!`);
                    // Redirect to dashboard after short delay
                    setTimeout(() => {
                        window.location.href = '/admin/a_dashboard.html';
                    }, 1500);
                } else {
                    // Wrong Credentials or DB Error Related
                    customNotification('error', 'Login Failed', data.message);
                }
            } catch (err) {
                // Error if there is something wrong with the request
                console.error(err);
                customNotification('error', 'Error', 'Something went wrong. Please try again.');
            }
        });
    }

    // -------------------- Forgot Form -------------------- //
    if (forgotForm) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Switch Form
            loginForm.classList.add('hidden');
            forgotForm.classList.remove('hidden');
            // Switch a-links
            forgotLink.classList.add('hidden');
            backLink.classList.remove('hidden');
        });

        backLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Switch Form
            loginForm.classList.remove('hidden');
            forgotForm.classList.add('hidden');
            // Switch a-links
            forgotLink.classList.remove('hidden');
            backLink.classList.add('hidden');
        })

        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgotEmail').value.trim();
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

    // -------------------- Reset Password Form -------------------- //
    if (resetForm) {
        // Form disabled on page load
        resetForm.style.pointerEvents = 'none';
        resetForm.style.opacity = '0.5';

        // Validate token when page loads
        (async function validateToken() {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            // If no token
            if (!token) {
                showModal('Invalid Link', 'No reset token provided. You will be redirected to the login page.');
                return;
            }
            
            try {
                const response = await fetch('/api/accounts/verify-reset-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    // Token Experired or already resetted/changed password
                    showModal('Invalid or Expired Link', data.message || 'This reset link is invalid or has expired.');
                } else {
                    // Token is valid
                    resetForm.style.pointerEvents = 'auto';
                    resetForm.style.opacity = '1';
                }
            } catch (err) {
                console.error(err);
                showModal('Error', 'Unable to verify reset link. Please try again.');
            }
        })();

        // Submit handler
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
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

            // Get the token
            const token = new URLSearchParams(window.location.search).get('token');
            // Use the token to verify who needs the reset
            try {
                const response = await fetch('/api/accounts/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, newPassword })
                });

                const data = await response.json();

                if (response.ok) {
                    customNotification('success', 'Success', data.message);
                    setTimeout(() => window.location.href = 'a_login.html', 2000);
                } else {
                    customNotification('error', 'Error', data.message);
                }
            } catch (err) {
                console.error(err);
                customNotification('error', 'Error', 'Something went wrong.');
            }
        });
    }
});
