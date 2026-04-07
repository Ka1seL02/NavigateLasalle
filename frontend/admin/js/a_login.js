// Authenticate if a user is already logged in
const checkIfLoggedIn = async () => {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        // If user is logged in, redirect the user to dashboard
        if (response.ok) {
            window.location.href = 'a_dashboard.html';
        }
    } catch (error) { 
        // If user isn't logged in nothing happens
        // Also does nothing if fetch fails
    }
};
checkIfLoggedIn();

// Toggle password visibility
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', () => {
    // Toggle between passowrd and text input type
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    togglePassword.classList.toggle('bx-hide', !isHidden);
    togglePassword.classList.toggle('bx-show', isHidden);
});

// Login form submission
const form = document.getElementById('loginForm');
const errorMessage = document.querySelector('.error-message');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = passwordInput.value;

    if (!email || !password) return;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = 'a_dashboard.html';
        } else {
            errorMessage.classList.remove('hidden');
        }

    } catch (error) {
        console.error('Login error:', error);
    }
});

// Close error message on click
const closeError = document.querySelector('.error-message .bx-x');
closeError.addEventListener('click', () => {
    errorMessage.classList.add('hidden');
});