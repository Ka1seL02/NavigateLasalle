import showToast from './toast.js';
import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── State ────────────────────────────────────────────────────────────────────
let allPosts = [];
let selectedPostId = null;
let currentImageIndex = 0;
let autoSwapInterval = null;
let dateMode = 'single'; // 'single' | 'range'

// ─── Elements ─────────────────────────────────────────────────────────────────
const postList = document.getElementById('postList');
const addPostBtn = document.getElementById('addPostBtn');
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const officeFilter = document.getElementById('officeFilter');
const singleToggle = document.getElementById('singleToggle');
const rangeToggle = document.getElementById('rangeToggle');
const singleDateWrap = document.getElementById('singleDateWrap');
const rangeDateWrap = document.getElementById('rangeDateWrap');
const singleDate = document.getElementById('singleDate');
const dateFrom = document.getElementById('dateFrom');
const dateTo = document.getElementById('dateTo');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

// ─── Add Post ─────────────────────────────────────────────────────────────────
addPostBtn.addEventListener('click', () => {
    window.location.href = 'posts-add.html';
});

// ─── Date Mode Toggle ─────────────────────────────────────────────────────────
singleToggle.addEventListener('click', () => {
    dateMode = 'single';
    singleToggle.classList.add('active');
    rangeToggle.classList.remove('active');
    singleDateWrap.classList.remove('hidden');
    rangeDateWrap.classList.add('hidden');
    dateFrom.value = '';
    dateTo.value = '';
    updateClearBtn();
    renderList();
});

rangeToggle.addEventListener('click', () => {
    dateMode = 'range';
    rangeToggle.classList.add('active');
    singleToggle.classList.remove('active');
    rangeDateWrap.classList.remove('hidden');
    singleDateWrap.classList.add('hidden');
    singleDate.value = '';
    updateClearBtn();
    renderList();
});

// ─── Clear Filters ────────────────────────────────────────────────────────────
function updateClearBtn() {
    const hasFilters =
        searchInput.value.trim() ||
        typeFilter.value ||
        officeFilter.value ||
        singleDate.value ||
        dateFrom.value ||
        dateTo.value;
    clearFiltersBtn.classList.toggle('hidden', !hasFilters);
}

clearFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    typeFilter.value = '';
    officeFilter.value = '';
    singleDate.value = '';
    dateFrom.value = '';
    dateTo.value = '';
    updateClearBtn();
    renderList();
});

// ─── Filter Listeners ─────────────────────────────────────────────────────────
searchInput.addEventListener('input', () => { updateClearBtn(); renderList(); });
typeFilter.addEventListener('change', () => { updateClearBtn(); renderList(); });
officeFilter.addEventListener('change', () => { updateClearBtn(); renderList(); });
singleDate.addEventListener('change', () => { updateClearBtn(); renderList(); });
dateFrom.addEventListener('change', () => { updateClearBtn(); renderList(); });
dateTo.addEventListener('change', () => { updateClearBtn(); renderList(); });

// ─── Populate Office Filter ───────────────────────────────────────────────────
function populateOfficeFilter() {
    const seen = new Set();
    allPosts.forEach(p => {
        if (p.office && !seen.has(p.office._id)) {
            seen.add(p.office._id);
            const option = document.createElement('option');
            option.value = p.office._id;
            option.textContent = p.office.name;
            officeFilter.appendChild(option);
        }
    });
}

// ─── Fetch Posts ──────────────────────────────────────────────────────────────
async function fetchPosts() {
    await showLoading();
    try {
        const res = await fetch('/api/posts', { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        allPosts = data.posts;
        populateOfficeFilter();
        renderList();
    } catch (err) {
        showToast('error', 'Failed to load posts.');
    } finally {
        hideLoading();
    }
}

// ─── Render List ──────────────────────────────────────────────────────────────
function renderList() {
    const search = searchInput.value.trim().toLowerCase();
    const type = typeFilter.value;
    const office = officeFilter.value;
    postList.innerHTML = '';

    const filtered = allPosts.filter(p => {
        const officeName = p.office?.name ?? 'DLSU-D';
        const officeId = p.office?._id ?? 'dlsud';

        // Search
        const matchSearch = !search ||
            p.title.toLowerCase().includes(search) ||
            officeName.toLowerCase().includes(search);

        // Type
        const matchType = !type || p.type === type;

        // Office
        const matchOffice = !office || officeId === office;

        // Date
        let matchDate = true;
        const postDate = new Date(p.createdAt);
        postDate.setHours(0, 0, 0, 0);

        if (dateMode === 'single' && singleDate.value) {
            const picked = new Date(singleDate.value);
            picked.setHours(0, 0, 0, 0);
            matchDate = postDate.getTime() === picked.getTime();
        } else if (dateMode === 'range') {
            if (dateFrom.value) {
                const from = new Date(dateFrom.value);
                from.setHours(0, 0, 0, 0);
                if (postDate < from) matchDate = false;
            }
            if (dateTo.value) {
                const to = new Date(dateTo.value);
                to.setHours(0, 0, 0, 0);
                if (postDate > to) matchDate = false;
            }
        }

        return matchSearch && matchType && matchOffice && matchDate;
    });

    if (filtered.length === 0) {
        postList.innerHTML = `
            <div class="empty-state">
                <i class='bx bx-news'></i>
                <p>No posts match your filters.</p>
            </div>
        `;
        return;
    }

    filtered.forEach(post => {
        const officeName = post.office?.name ?? 'DLSU-D';
        const date = new Date(post.createdAt).toLocaleDateString('en-PH', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        const card = document.createElement('div');
        card.classList.add('post-card');
        card.innerHTML = `
            <img class="card-thumbnail" src="${post.images[0]}" alt="${post.title}" />
            <div class="card-info">
                <div class="card-meta">
                    <span class="type-badge ${post.type}">${capitalize(post.type)}</span>
                </div>
                <p class="card-title">${post.title}</p>
                <p class="card-office">
                    <i class='bx bx-buildings'></i> ${officeName}
                </p>
                <p class="card-date">
                    <i class='bx bx-calendar'></i> ${date}
                </p>
            </div>
        `;
        card.addEventListener('click', () => openViewModal(post));
        postList.appendChild(card);
    });
}

// ─── View Modal ───────────────────────────────────────────────────────────────
const viewModalOverlay = document.getElementById('viewModalOverlay');
const closeViewModalBtn = document.getElementById('closeViewModal');
const modalGallery = document.getElementById('modalGallery');
const modalTypeBadge = document.getElementById('modalTypeBadge');
const modalOfficeLabel = document.getElementById('modalOfficeLabel');
const modalDate = document.getElementById('modalDate');
const modalName = document.getElementById('modalName');
const modalContent = document.getElementById('modalContent');
const editModalBtn = document.getElementById('editModalBtn');
const deleteModalBtn = document.getElementById('deleteModalBtn');

function openViewModal(post) {
    selectedPostId = post._id;
    currentImageIndex = 0;

    function startAutoSwap(images) {
        clearInterval(autoSwapInterval);
        autoSwapInterval = setInterval(() => {
            currentImageIndex = (currentImageIndex + 1) % images.length;
            document.getElementById('galleryImg').src = images[currentImageIndex];
            modalGallery.querySelectorAll('.gallery-dot').forEach((d, i) => {
                d.classList.toggle('active', i === currentImageIndex);
            });
        }, 3000);
    }

    modalGallery.innerHTML = `
        <img src="${post.images[0]}" alt="${post.title}" id="galleryImg" />
        ${post.images.length > 1 ? `
            <div class="gallery-nav">
                ${post.images.map((_, i) => `
                    <div class="gallery-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>
                `).join('')}
            </div>
        ` : ''}
    `;

    if (post.images.length > 1) {
        modalGallery.querySelectorAll('.gallery-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                currentImageIndex = parseInt(dot.dataset.index);
                document.getElementById('galleryImg').src = post.images[currentImageIndex];
                modalGallery.querySelectorAll('.gallery-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                startAutoSwap(post.images);
            });
        });
        startAutoSwap(post.images);
    }

    modalTypeBadge.textContent = capitalize(post.type);
    modalTypeBadge.className = `type-badge ${post.type}`;
    modalOfficeLabel.textContent = post.office?.name ?? 'DLSU-D';
    modalDate.textContent = new Date(post.createdAt).toLocaleDateString('en-PH', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    modalName.textContent = post.title;
    modalContent.innerHTML = post.content;

    editModalBtn.onclick = () => {
        window.location.href = `posts-edit.html?id=${post._id}`;
    };
    deleteModalBtn.onclick = () => {
        viewModalOverlay.classList.add('hidden');
        openDeleteModal(post._id, post.title);
    };

    viewModalOverlay.classList.remove('hidden');
}

closeViewModalBtn.addEventListener('click', () => {
    clearInterval(autoSwapInterval);
    viewModalOverlay.classList.add('hidden');
    selectedPostId = null;
});

// ─── Delete Modal ─────────────────────────────────────────────────────────────
const deleteModalOverlay = document.getElementById('deleteModalOverlay');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');
const deleteTargetName = document.getElementById('deleteTargetName');
let deleteId = null;

function openDeleteModal(id, title) {
    deleteId = id;
    deleteTargetName.textContent = title;
    deleteModalOverlay.classList.remove('hidden');
}

cancelDelete.addEventListener('click', () => {
    deleteModalOverlay.classList.add('hidden');
    deleteId = null;
});

confirmDelete.addEventListener('click', async () => {
    if (!deleteId) return;
    deleteModalOverlay.classList.add('hidden');
    await showLoading();
    try {
        const res = await fetch(`/api/posts/${deleteId}`, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (!res.ok) {
            showToast('error', data.message || 'Failed to delete post.');
        } else {
            showToast('success', 'Post deleted successfully!');
            await fetchPosts();
        }
    } catch (err) {
        showToast('error', 'Failed to delete post.');
    } finally {
        hideLoading();
        deleteId = null;
    }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
fetchPosts();