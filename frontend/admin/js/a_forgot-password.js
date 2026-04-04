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

        // Always show success modal regardless
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