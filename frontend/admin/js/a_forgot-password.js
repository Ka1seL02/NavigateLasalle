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

const form = document.getElementById('requestResetForm');
const modalOverlay = document.querySelector('.modal-overlay');
const closeBtn = document.querySelector('.close-btn');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();

    if (!email) return;

    try {
        const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        modalOverlay.classList.remove('hidden');

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