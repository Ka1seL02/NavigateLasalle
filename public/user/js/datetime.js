document.addEventListener('DOMContentLoaded', () => {
    function updateDateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateStr = now.toLocaleDateString('en-US', options);

        document.querySelector('.datetime h1').textContent = `${hours}:${minutes}`;
        document.querySelector('.datetime small').textContent = dateStr;
    }

    updateDateTime();
    setInterval(updateDateTime, 60000);
});