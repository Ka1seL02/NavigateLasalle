import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── Redirect if already logged in ────────────────────────────────────────────
const authCheck = await fetch('/api/auth/me', {
    headers: { 'Accept': 'application/json' }
});
if (authCheck.ok) {
    window.location.href = '/admin/pages/dashboard.html';
}

const form = document.getElementById('forgotPasswordForm');
const modalOverlay = document.querySelector('.modal-overlay');
const closeBtn = document.querySelector('.close-btn');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    if (!email) return;

    await showLoading();

    try {
        await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        hideLoading();
        modalOverlay.classList.remove('hidden');

    } catch (error) {
        hideLoading();
        console.error('Error:', error);
    }
});

closeBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    setTimeout(() => {
        window.location.href = '/admin/login.html';
    }, 300);
});