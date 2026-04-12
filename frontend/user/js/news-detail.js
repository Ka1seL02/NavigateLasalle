import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── Guard — redirect if no id ────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const postId = params.get('id');
if (!postId) window.location.replace('news.html');

// ─── Live Clock ───────────────────────────────────────────────────────────────
function updateClock() {
    const now = new Date();
    document.getElementById('clockTime').textContent = now.toLocaleTimeString('en-PH', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
    document.getElementById('clockDate').textContent = now.toLocaleDateString('en-PH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}
updateClock();
setInterval(updateClock, 1000);

// ─── Back Button ──────────────────────────────────────────────────────────────
document.getElementById('backBtn').addEventListener('click', () => history.back());

// ─── Fetch Post ───────────────────────────────────────────────────────────────
async function fetchPost() {
    const res = await fetch(`/api/posts/${postId}`, {
        headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
        window.location.replace('news.html');
        return;
    }

    const data = await res.json();
    renderPost(data.post);
}

// ─── Render Post ──────────────────────────────────────────────────────────────
function renderPost(post) {
    const main = document.getElementById('detailMain');
    const officeName = post.office?.name ?? 'DLSU-D';
    const date = new Date(post.createdAt).toLocaleDateString('en-PH', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    main.innerHTML = `
        <!-- Hero Image -->
        <img class="detail-hero" id="heroImage" src="${post.images[0]}" alt="${post.title}" />

        <!-- Thumbnails (only if more than 1 image) -->
        ${post.images.length > 1 ? `
            <div class="detail-gallery">
                ${post.images.map((img, i) => `
                    <img
                        class="detail-gallery-thumb ${i === 0 ? 'active' : ''}"
                        src="${img}"
                        alt="Image ${i + 1}"
                        data-index="${i}"
                    />
                `).join('')}
            </div>
        ` : ''}

        <!-- Meta -->
        <div class="detail-meta">
            <span class="type-badge ${post.type}">${capitalize(post.type)}</span>
            <span class="detail-office">
                <i class='bx bx-buildings'></i> ${officeName}
            </span>
            <span class="detail-date">
                <i class='bx bx-calendar'></i> ${date}
            </span>
        </div>

        <!-- Title -->
        <h1 class="detail-title">${post.title}</h1>

        <hr class="detail-divider" />

        <!-- Content -->
        <div class="detail-content">${post.content}</div>
    `;

    // Gallery thumbnail click — swap hero image
    if (post.images.length > 1) {
        const thumbs = main.querySelectorAll('.detail-gallery-thumb');
        const hero = main.querySelector('#heroImage');
        thumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                hero.src = post.images[parseInt(thumb.dataset.index)];
                thumbs.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
        });
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
(async () => {
    await showLoading();
    await fetchPost();
    hideLoading();
})();