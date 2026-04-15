import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── Redirect if already logged in ────────────────────────────────────────────
const authCheck = await fetch('/api/auth/me', {
    headers: { 'Accept': 'application/json' }
});
if (authCheck.ok) {
    window.location.href = '/admin/pages/dashboard.html';
}

const loginForm = document.getElementById('loginForm');
const formError = document.getElementById('formError');
const formErrorMsg = document.getElementById('formErrorMsg');
const closeError = document.getElementById('closeError');

function showError(message) {
    formErrorMsg.textContent = message;
    formError.classList.remove('hidden');
}

function hideError() {
    formError.classList.add('hidden');
    formErrorMsg.textContent = '';
}

closeError.addEventListener('click', hideError);

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        showError('Please fill in all fields.');
        return;
    }

    await showLoading();

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            hideLoading();
            if (res.status === 401) {
                showError('Email or password is incorrect. Please try again.');
            } else {
                showError('Oops! Something went wrong. Please try again later.');
            }
            return;
        }

        // Success — loading stays until redirect
        window.location.href = '/admin/pages/dashboard.html';

    } catch (err) {
        hideLoading();
        showError('Oops! Something went wrong. Please try again later.');
    }
});

const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    togglePassword.classList.toggle('bx-hide', !isHidden);
    togglePassword.classList.toggle('bx-show', isHidden);
});