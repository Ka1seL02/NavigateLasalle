import showToast from './toast.js';
import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── State ────────────────────────────────────────────────────────────────────
let countdownInterval = null;

// ─── Elements ─────────────────────────────────────────────────────────────────
const nameInput = document.getElementById('nameInput');
const currentEmailDisplay = document.getElementById('currentEmailDisplay');
const newEmailInput = document.getElementById('newEmailInput');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const requestEmailChangeBtn = document.getElementById('requestEmailChangeBtn');
const currentPassword = document.getElementById('currentPassword');
const newPassword = document.getElementById('newPassword');
const confirmPassword = document.getElementById('confirmPassword');
const savePasswordBtn = document.getElementById('savePasswordBtn');
const verifyModalOverlay = document.getElementById('verifyModalOverlay');
const cancelVerify = document.getElementById('cancelVerify');
const codeInput = document.getElementById('codeInput');
const verifyCodeBtn = document.getElementById('verifyCodeBtn');
const countdownDisplay = document.getElementById('countdownDisplay');

// ─── Load Profile ─────────────────────────────────────────────────────────────
async function loadProfile() {
    await showLoading();
    try {
        const res = await fetch('/api/auth/me', { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        nameInput.value = data.admin.name;
        currentEmailDisplay.value = data.admin.email;
    } catch (err) {
        showToast('error', 'Failed to load profile.');
    } finally {
        hideLoading();
    }
}

// ─── Save Name ────────────────────────────────────────────────────────────────
saveProfileBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (!name) return showToast('error', 'Name is required.');

    saveProfileBtn.disabled = true;
    await showLoading();
    try {
        const res = await fetch('/api/accounts/me', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (!res.ok) {
            showToast('error', data.error || 'Failed to update profile.');
        } else {
            showToast('success', 'Name updated successfully!');
        }
    } catch (err) {
        showToast('error', 'Failed to update profile.');
    } finally {
        hideLoading();
        saveProfileBtn.disabled = false;
    }
});

// ─── Request Email Change ─────────────────────────────────────────────────────
requestEmailChangeBtn.addEventListener('click', async () => {
    const newEmail = newEmailInput.value.trim();
    if (!newEmail) return showToast('error', 'Please enter a new email address.');

    requestEmailChangeBtn.disabled = true;
    await showLoading();
    try {
        const res = await fetch('/api/accounts/me/email-change', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ newEmail })
        });
        const data = await res.json();
        if (!res.ok) {
            showToast('error', data.error || 'Failed to send verification code.');
        } else {
            showToast('success', 'Verification code sent to your current email!');
            openVerifyModal();
        }
    } catch (err) {
        showToast('error', 'Failed to send verification code.');
    } finally {
        hideLoading();
        requestEmailChangeBtn.disabled = false;
    }
});

// ─── Verify Modal ─────────────────────────────────────────────────────────────
function openVerifyModal() {
    codeInput.value = '';
    verifyModalOverlay.classList.remove('hidden');
    startCountdown(3 * 60); // 3 minutes in seconds
}

function closeVerifyModal() {
    verifyModalOverlay.classList.add('hidden');
    clearInterval(countdownInterval);
    countdownDisplay.textContent = '3:00';
}

cancelVerify.addEventListener('click', closeVerifyModal);

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function startCountdown(seconds) {
    clearInterval(countdownInterval);
    let remaining = seconds;

    function tick() {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        countdownDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        if (remaining <= 0) {
            clearInterval(countdownInterval);
            countdownDisplay.textContent = '0:00';
            verifyCodeBtn.disabled = true;
            showToast('error', 'Code expired. Please request a new one.');
            closeVerifyModal();
        }
        remaining--;
    }

    tick();
    countdownInterval = setInterval(tick, 1000);
}

// ─── Verify Code ──────────────────────────────────────────────────────────────
verifyCodeBtn.addEventListener('click', async () => {
    const code = codeInput.value.trim();
    if (!code || code.length !== 6) return showToast('error', 'Please enter the 6-digit code.');

    verifyCodeBtn.disabled = true;
    await showLoading();
    try {
        const res = await fetch('/api/accounts/me/email-change/verify', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ code })
        });
        const data = await res.json();
        if (!res.ok) {
            showToast('error', data.error || 'Verification failed.');
        } else {
            showToast('success', 'Email updated successfully!');
            closeVerifyModal();
            newEmailInput.value = '';
            await loadProfile(); // refresh displayed email
        }
    } catch (err) {
        showToast('error', 'Verification failed.');
    } finally {
        hideLoading();
        verifyCodeBtn.disabled = false;
    }
});

// Only allow numeric input in code field
codeInput.addEventListener('input', () => {
    codeInput.value = codeInput.value.replace(/\D/g, '');
});

// ─── Change Password ──────────────────────────────────────────────────────────
savePasswordBtn.addEventListener('click', async () => {
    const current = currentPassword.value.trim();
    const newPass = newPassword.value.trim();
    const confirm = confirmPassword.value.trim();

    if (!current) return showToast('error', 'Current password is required.');
    if (!newPass) return showToast('error', 'New password is required.');
    if (newPass.length < 8) return showToast('error', 'New password must be at least 8 characters.');
    if (newPass !== confirm) return showToast('error', 'Passwords do not match.');

    savePasswordBtn.disabled = true;
    await showLoading();
    try {
        const res = await fetch('/api/accounts/me/password', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ currentPassword: current, newPassword: newPass })
        });
        const data = await res.json();
        if (!res.ok) {
            showToast('error', data.error || 'Failed to change password.');
        } else {
            showToast('success', 'Password changed successfully!');
            currentPassword.value = '';
            newPassword.value = '';
            confirmPassword.value = '';
        }
    } catch (err) {
        showToast('error', 'Failed to change password.');
    } finally {
        hideLoading();
        savePasswordBtn.disabled = false;
    }
});

// ─── Toggle Password Visibility ───────────────────────────────────────────────
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        btn.querySelector('i').className = isHidden ? 'bx bx-show' : 'bx bx-hide';
    });
});

// ─── Init ─────────────────────────────────────────────────────────────────────
loadProfile();