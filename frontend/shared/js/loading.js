let overlay = null;

export const initLoading = async () => {
    if (overlay) return overlay;

    const response = await fetch('/shared/loading.html');
    const html = await response.text();
    document.body.insertAdjacentHTML('beforeend', html);

    overlay = document.querySelector('.loading-overlay');
    return overlay;
};

export const showLoading = async () => {
    if (!overlay) await initLoading();
    overlay.classList.remove('hidden');
};

export const hideLoading = () => {
    overlay?.classList.add('hidden');
};