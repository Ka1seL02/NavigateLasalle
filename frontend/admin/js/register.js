import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── Check token from URL ─────────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const token = params.get('token');

if (!token) {
    window.location.href = '/admin/login.html';
}

const tokenCheck = await fetch(`/api/auth/register/${token}`, {
    headers: { 'Accept': 'application/json' }
});

if (!tokenCheck.ok) {
    const expiredModalOverlay = document.getElementById('expiredModalOverlay');
    expiredModalOverlay.classList.remove('hidden');
    document.getElementById('expiredOkBtn').addEventListener('click', () => {
        window.location.href = '/admin/login.html';
    });
} else {
    const { email } = await tokenCheck.json();
    const emailInput = document.getElementById('email');
    emailInput.value = email;
}

// ─── Elements ─────────────────────────────────────────────────────────────────
const form = document.getElementById('createAccountForm');
const registerBtn = document.getElementById('registerBtn');
const errorMsg = document.getElementById('errorMsg');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const passwordRules = document.querySelector('.password-rules');
const ruleItems = document.querySelectorAll('.password-rules li');
const formGroup = passwordInput.closest('.form-group');
const confirmFormGroup = confirmPasswordInput.closest('.form-group');

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
        registerBtn.disabled = false;
    } else {
        registerBtn.disabled = true;
    }
}

// ─── Password Blur ────────────────────────────────────────────────────────────
passwordInput.addEventListener('blur', () => {
    if (passwordInput.value) validatePassword(passwordInput.value);
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
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const password = passwordInput.value;

    await showLoading();

    try {
        const res = await fetch(`/api/auth/register/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, password })
        });

        const data = await res.json();

        if (!res.ok) {
            hideLoading();
            errorMsg.textContent = data.error || 'Something went wrong.';
            errorMsg.classList.remove('hidden');
            return;
        }

        hideLoading();
        document.getElementById('successModalOverlay').classList.remove('hidden');

    } catch (err) {
        hideLoading();
        errorMsg.textContent = 'Something went wrong. Please try again.';
        errorMsg.classList.remove('hidden');
    }
});

// ─── Success Modal ────────────────────────────────────────────────────────────
document.getElementById('successOkBtn').addEventListener('click', () => {
    window.location.href = '/admin/login.html';
});