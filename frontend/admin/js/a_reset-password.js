const params = new URLSearchParams(window.location.search);
const token = params.get('token');

// On page load, verify token
const verifyToken = async () => {
    if (!token) {
        window.location.href = 'a_login.html';
        return;
    }

    try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
        const data = await response.json();

        if (!data.valid) {
            window.location.href = 'a_login.html';
        }

    } catch (error) {
        window.location.href = 'a_login.html';
    }
};

verifyToken();

// Toggle password visibility
const toggleNewPw = document.getElementById('toggleNewPassword');
const newPasswordInput = document.getElementById('newPassword');
const toggleConfirmPw = document.getElementById('toggleConfirmPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

toggleNewPw.addEventListener('click', () => {
    const isHidden = newPasswordInput.type === 'password';
    newPasswordInput.type = isHidden ? 'text' : 'password';
    toggleNewPw.classList.toggle('bx-hide', !isHidden);
    toggleNewPw.classList.toggle('bx-show', isHidden);
});

toggleConfirmPw.addEventListener('click', () => {
    const isHidden = confirmPasswordInput.type === 'password';
    confirmPasswordInput.type = isHidden ? 'text' : 'password';
    toggleConfirmPw.classList.toggle('bx-hide', !isHidden);
    toggleConfirmPw.classList.toggle('bx-show', isHidden);
});

// Password rules check on blur
newPasswordInput.addEventListener('blur', () => {
    const value = newPasswordInput.value;

    const rules = {
        'rule-length': v => v.length >= 8,
        'rule-uppercase': v => /[A-Z]/.test(v),
        'rule-lowercase': v => /[a-z]/.test(v),
        'rule-special': v => /[\W_]/.test(v),
        'rule-number': v => /\d/.test(v)
    };

    const listItems = document.querySelectorAll('.password-rules li');
    let allValid = true;

    listItems.forEach((li, index) => {
        const ruleKey = Object.keys(rules)[index];
        const passes = rules[ruleKey](value);
        li.style.color = passes ? '' : 'var(--red)';
        if (!passes) allValid = false;
    });

    const p = document.querySelector('.password-rules p');
    p.style.color = allValid ? '' : 'var(--red)';
});

// Form submit
const form = document.getElementById('resetPasswordForm');
const modalOverlay = document.querySelector('.modal-overlay');
const closeBtn = document.querySelector('.close-btn');
const passwordMismatchError = document.getElementById('passwordMismatchError');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (newPassword !== confirmPassword) {
        passwordMismatchError.classList.remove('hidden');
        return;
    }
    passwordMismatchError.classList.add('hidden');

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongPassword.test(newPassword)) {
        alert('Please make sure your password meets all the requirements.');
        return;
    }

    try {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            modalOverlay.classList.remove('hidden');
        } else {
            alert(data.message);
        }

    } catch (error) {
        console.error('Error:', error);
    }
});

closeBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    setTimeout(() => {
        window.location.href = 'a_login.html';
    }, 300);
});