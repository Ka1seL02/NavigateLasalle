const TIMEOUT = 15 * 60 * 1000; // 15 minutes
let timer;

const resetTimer = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
        // Logout first
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        // Then show modal
        document.getElementById('inactiveModalOverlay').classList.remove('hidden');
    }, TIMEOUT);
};

const startActivityWatcher = () => {
    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(event => {
        window.addEventListener(event, resetTimer);
    });
    resetTimer();
};

const checkAuth = async () => {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });

        if (!response.ok) {
            window.location.href = 'a_login.html';
            return null;
        }

        const admin = await response.json();
        startActivityWatcher();
        return admin;

    } catch (error) {
        window.location.href = 'a_login.html';
        return null;
    }
};

export default checkAuth;