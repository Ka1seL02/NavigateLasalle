const showToast = (type, message) => {
    const existing = document.getElementById('toastContainer');
    if (!existing) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.classList.add('toast', type); // type: 'success' or 'error'

    toast.innerHTML = `
        <div class="toast-left">
            <i class='bx ${type === 'success' ? 'bx-check-circle' : 'bx-x-circle'}'></i>
        </div>
        <div class="toast-body">
            <p class="toast-title">${type === 'success' ? 'Success' : 'Error'}</p>
            <p class="toast-message">${message}</p>
        </div>
        <button class="toast-close"><i class='bx bx-x'></i></button>
    `;

    document.getElementById('toastContainer').appendChild(toast);

    // Trigger slide in
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto remove after 4 seconds
    const autoRemove = setTimeout(() => removeToast(toast), 4000);

    // Manual close
    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(autoRemove);
        removeToast(toast);
    });
};

const removeToast = (toast) => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
};

export default showToast;