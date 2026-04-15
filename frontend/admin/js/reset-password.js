import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── Check token from URL ─────────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const token = params.get('token');

if (!token) {
    window.location.href = '/admin/login.html';
}

const tokenCheck = await fetch(`/api/auth/reset-password/${token}`, {
    headers: { 'Accept': 'application/json' }
});

if (!tokenCheck.ok) {
    const expiredModalOverlay = document.getElementById('expiredModalOverlay');
    expiredModalOverlay.classList.remove('hidden');

    document.querySelector('.expired-ok-btn').addEventListener('click', () => {
        window.location.href = '/admin/forgot-password.html';
    });
}

// ─── Elements ─────────────────────────────────────────────────────────────────
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const errorMsg = document.querySelector('.error-msg');
const passwordRules = document.querySelector('.password-rules');
const ruleItems = document.querySelectorAll('.password-rules li');
const formGroup = passwordInput.closest('.form-group');
const confirmFormGroup = confirmPasswordInput.closest('.form-group');
const resetBtn = document.querySelector('.reset-btn');
const modalOverlay = document.querySelector('.modal-overlay');
const closeBtn = document.querySelector('.close-btn');

// ─── Disable button by default ────────────────────────────────────────────────
resetBtn.disabled = true;
resetBtn.style.opacity = '0.5';
resetBtn.style.cursor = 'not-allowed';

// ─── Password Rules ───────────────────────────────────────────────────────────
const rules = [
    { regex: /.{8,}/, index: 0 },
    { regex: /[A-Z]/, index: 1 },
    { regex: /[a-z]/, index: 2 },
    { regex: /[^A-Za-z0-9]/, index: 3 },
    { regex: /[0-9]/, index: 4 },
];

function validatePassword(value) {
    let allMet = true;

    rules.forEach(({ regex, index }) => {
        const met = regex.test(value);
        if (!met) allMet = false;
        ruleItems[index].style.color = met ? '' : 'var(--red)';
    });

    if (!allMet) {
        passwordRules.querySelector('p').style.color = 'var(--red)';
        formGroup.style.borderColor = 'var(--red)';
    } else {
        passwordRules.querySelector('p').style.color = '';
        formGroup.style.borderColor = '';
    }

    return allMet;
}

function checkButtonState() {
    const passwordValid = rules.every(({ regex }) => regex.test(passwordInput.value));
    const confirmValid = confirmPasswordInput.value === passwordInput.value && confirmPasswordInput.value !== '';

    if (passwordValid && confirmValid) {
        resetBtn.disabled = false;
        resetBtn.style.opacity = '';
        resetBtn.style.cursor = '';
    } else {
        resetBtn.disabled = true;
        resetBtn.style.opacity = '0.5';
        resetBtn.style.cursor = 'not-allowed';
    }
}

// ─── Password Blur ────────────────────────────────────────────────────────────
passwordInput.addEventListener('blur', () => {
    if (passwordInput.value) {
        validatePassword(passwordInput.value);
    }
    checkButtonState();
});

passwordInput.addEventListener('focus', () => {
    formGroup.style.borderColor = '';
});

// ─── Confirm Password Blur ────────────────────────────────────────────────────
confirmPasswordInput.addEventListener('blur', () => {
    const confirmValue = confirmPasswordInput.value;

    if (!confirmValue) {
        errorMsg.textContent = 'Please confirm your password.';
        errorMsg.classList.remove('hidden');
        confirmFormGroup.style.borderColor = 'var(--red)';
    } else if (confirmValue !== passwordInput.value) {
        errorMsg.textContent = 'Password mismatch!';
        errorMsg.classList.remove('hidden');
        confirmFormGroup.style.borderColor = 'var(--red)';
    } else {
        errorMsg.classList.add('hidden');
        confirmFormGroup.style.borderColor = '';
    }

    checkButtonState();
});

confirmPasswordInput.addEventListener('focus', () => {
    confirmFormGroup.style.borderColor = '';
});

// ─── Toggle Password Visibility ───────────────────────────────────────────────
document.querySelectorAll('.toggle-password').forEach((toggle) => {
    toggle.addEventListener('click', () => {
        const input = toggle.closest('.form-group').querySelector('input');
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        toggle.classList.toggle('bx-hide', !isHidden);
        toggle.classList.toggle('bx-show', isHidden);
    });
});

// ─── Form Submit ──────────────────────────────────────────────────────────────
const form = document.getElementById('resetPasswordForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    await showLoading();

    try {
        const res = await fetch(`/api/auth/reset-password/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: passwordInput.value })
        });

        if (!res.ok) {
            window.location.href = '/admin/login.html';
            return;
        }

        hideLoading();
        modalOverlay.classList.remove('hidden');

    } catch (err) {
        hideLoading();
        console.error('Error:', err);
    }
});

// ─── Modal Close ──────────────────────────────────────────────────────────────
closeBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    setTimeout(() => {
        window.location.href = '/admin/login.html';
    }, 300);
});