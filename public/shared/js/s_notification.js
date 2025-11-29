function customNotification(type, title, message) {
    // Remove any exising notications if there are any
    const exisitingNotification = document.querySelector('.custom-notification');
    if (exisitingNotification) { exisitingNotification.remove() };

    // Create new notification
    const newNotification = document.createElement('div');
    newNotification.className = `custom-notification ${type}`;
    const iconClass = type === 'success' ? 'bx-check-circle' : 'bx-error-circle';
    newNotification.innerHTML = `
        <div class="notification-icon">
            <i class='bx ${iconClass}'></i>
        </div>
        <div class="notification-content">
            <h4 class="notification-title">${title}</h4>
            <p class="notification-message">${message}</p>
        </div>
        <button class="notification-close">
            <i class='bx bx-x'></i>
        </buttton>
    `;
    document.body.appendChild(newNotification);
    setTimeout(() => { newNotification.classList.add('show'); }, 10);

    // Close button (x)
    const closeBtn = newNotification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        newNotification.classList.remove('show');
        setTimeout(() => newNotification.remove(), 400);
    });

    // Close notification after 5 seconds
    setTimeout(() => {
        newNotification.classList.remove('show');
        setTimeout(() => newNotification.remove(), 400);
    }, 5000);
}