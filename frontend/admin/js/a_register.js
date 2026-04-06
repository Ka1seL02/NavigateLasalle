// TOKEN VERIFICATION (uncomment when ready to test with invite flow)
const params = new URLSearchParams(window.location.search);
const token = params.get('token');

const verifyToken = async () => {
    if (!token) {
        window.location.href = 'a_login.html';
        return;
    }
    try {
        const response = await fetch(`/api/invite/verify?token=${token}`);
        const data = await response.json();
        if (!data.valid) {
            window.location.href = 'a_login.html';
            return;
        }
        // Pre-fill email
        document.getElementById('email').value = data.email;
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

    // Border turns red if any rule is not met
    newPasswordInput.style.borderColor = allValid ? '' : 'var(--red)';
});

// Form submit
const form = document.getElementById('createAccountForm');
const modalOverlay = document.querySelector('.modal-overlay');
const closeBtn = document.querySelector('.close-btn');
const passwordMismatchError = document.getElementById('passwordMismatchError');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!name) return;

    if (newPassword !== confirmPassword) {
        passwordMismatchError.classList.remove('hidden');
        confirmPasswordInput.style.borderColor = 'var(--red)';
        return;
    }
    passwordMismatchError.classList.add('hidden');
    confirmPasswordInput.style.borderColor = '';

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongPassword.test(newPassword)) {
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, password: newPassword, token })
        });

        const data = await response.json();

        if (response.ok) {
            modalOverlay.classList.remove('hidden');
        } else {
            window.location.href = 'a_login.html';
        }

    } catch (error) {
        console.error('Error:', error);
    }
});

confirmPasswordInput.addEventListener('blur', () => {
    if (confirmPasswordInput.value && confirmPasswordInput.value !== newPasswordInput.value) {
        passwordMismatchError.classList.remove('hidden');
        confirmPasswordInput.style.borderColor = 'var(--red)';
    } else {
        passwordMismatchError.classList.add('hidden');
        confirmPasswordInput.style.borderColor = '';
    }
});

// Close modal and redirect to login
closeBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    setTimeout(() => {
        window.location.href = 'a_login.html';
    }, 300);
});