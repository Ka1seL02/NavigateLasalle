import showToast from './toast.js';
import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── State ────────────────────────────────────────────────────────────────────
let allOffices = [];
let selectedOfficeId = null;
let currentImageIndex = 0;
let autoSwapInterval = null;

// ─── Elements ─────────────────────────────────────────────────────────────────
const officeList = document.getElementById('officeList');
const officesCount = document.getElementById('officesCount');
const addOfficeBtn = document.getElementById('addOfficeBtn');
const searchInput = document.getElementById('searchInput');

// ─── Add Office ───────────────────────────────────────────────────────────────
addOfficeBtn.addEventListener('click', () => {
    window.location.href = 'office-add.html';
});

// ─── Search ───────────────────────────────────────────────────────────────────
searchInput.addEventListener('input', () => {
    renderList(searchInput.value.trim().toLowerCase());
});

// ─── Fetch Offices ────────────────────────────────────────────────────────────
async function fetchOffices() {
    await showLoading();
    try {
        const res = await fetch('/api/offices', { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        allOffices = data.offices;
        officesCount.textContent = allOffices.length;
        renderList();
    } catch (err) {
        showToast('error', 'Failed to load offices.');
    } finally {
        hideLoading();
    }
}

// ─── Render List ──────────────────────────────────────────────────────────────
function renderList(search = '') {
    officeList.innerHTML = '';

    const filtered = search
        ? allOffices.filter(o =>
            o.name.toLowerCase().includes(search) ||
            o.category.toLowerCase().includes(search) ||
            (o.head && o.head.toLowerCase().includes(search))
          )
        : allOffices;

    if (filtered.length === 0) {
        officeList.innerHTML = `
            <div class="empty-state">
                <i class='bx bx-building'></i>
                <p>${search ? 'No offices match your search.' : 'No offices yet. Click Add Office to get started.'}</p>
            </div>
        `;
        return;
    }

    // Group by category
    const grouped = {};
    filtered.forEach(o => {
        if (!grouped[o.category]) grouped[o.category] = [];
        grouped[o.category].push(o);
    });

    Object.entries(grouped).forEach(([category, offices]) => {
        const section = document.createElement('div');
        section.classList.add('category-section');
        section.innerHTML = `<h3 class="category-title">${category} (${offices.length})</h3>`;

        const grid = document.createElement('div');
        grid.classList.add('cards-grid');

        offices.forEach(o => {
            const card = document.createElement('div');
            card.classList.add('office-card');
            if (!o.isVisible) card.classList.add('card-hidden');

            card.innerHTML = `
                ${o.images && o.images.length > 0
                    ? `<img class="card-image" src="${o.images[0]}" alt="${o.name}" />`
                    : `<div class="card-image-placeholder"><i class='bx bx-buildings'></i></div>`
                }
                <div class="card-info">
                    <p class="card-name">${o.name}</p>
                    ${o.head ? `<p class="card-head">${o.head}</p>` : ''}
                </div>
            `;

            card.addEventListener('click', () => openViewModal(o));
            grid.appendChild(card);
        });

        section.appendChild(grid);
        officeList.appendChild(section);
    });
}

// ─── View Modal ───────────────────────────────────────────────────────────────
const viewModalOverlay = document.getElementById('viewModalOverlay');
const closeViewModal = document.getElementById('closeViewModal');
const modalGallery = document.getElementById('modalGallery');
const modalCategory = document.getElementById('modalCategory');
const modalVisibility = document.getElementById('modalVisibility');
const modalName = document.getElementById('modalName');
const modalHead = document.getElementById('modalHead');
const modalInfoGrid = document.getElementById('modalInfoGrid');
const modalDescription = document.getElementById('modalDescription');
const modalPersonnelSection = document.getElementById('modalPersonnelSection');
const modalPersonnel = document.getElementById('modalPersonnel');
const modalSubOfficesSection = document.getElementById('modalSubOfficesSection');
const modalSubOffices = document.getElementById('modalSubOffices');
const modalBuildingSection = document.getElementById('modalBuildingSection');
const modalBuilding = document.getElementById('modalBuilding');
const editModalBtn = document.getElementById('editModalBtn');
const deleteModalBtn = document.getElementById('deleteModalBtn');

function openViewModal(office) {
    selectedOfficeId = office._id;
    currentImageIndex = 0;

    // Gallery
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

    if (office.images && office.images.length > 0) {
        modalGallery.innerHTML = `
            <img src="${office.images[0]}" alt="${office.name}" id="galleryImg" />
            ${office.images.length > 1 ? `
                <div class="gallery-nav">
                    ${office.images.map((_, i) => `
                        <div class="gallery-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>
                    `).join('')}
                </div>
            ` : ''}
        `;
        if (office.images.length > 1) {
            modalGallery.querySelectorAll('.gallery-dot').forEach(dot => {
                dot.addEventListener('click', () => {
                    currentImageIndex = parseInt(dot.dataset.index);
                    document.getElementById('galleryImg').src = office.images[currentImageIndex];
                    modalGallery.querySelectorAll('.gallery-dot').forEach(d => d.classList.remove('active'));
                    dot.classList.add('active');
                    startAutoSwap(office.images);
                });
            });
            startAutoSwap(office.images);
        }
    } else {
        modalGallery.innerHTML = `
            <div class="no-image">
                <i class='bx bx-building'></i>
                <p>No images available</p>
            </div>
        `;
    }

    // Meta
    modalCategory.textContent = office.category;
    if (!office.isVisible) {
        modalVisibility.classList.remove('hidden');
    } else {
        modalVisibility.classList.add('hidden');
    }
    modalName.textContent = office.name;
    modalHead.textContent = office.head || '';
    modalHead.style.display = office.head ? 'block' : 'none';

    // Info grid
    modalInfoGrid.innerHTML = '';
    if (office.email) {
        modalInfoGrid.innerHTML += `
            <div class="modal-info-item">
                <i class='bx bx-envelope'></i> ${office.email}
            </div>
        `;
    }
    if (office.phone) {
        modalInfoGrid.innerHTML += `
            <div class="modal-info-item">
                <i class='bx bx-phone'></i> ${office.phone}
            </div>
        `;
    }
    if (office.officeHours) {
        modalInfoGrid.innerHTML += `
            <div class="modal-info-item">
                <i class='bx bx-time'></i> ${office.officeHours}
            </div>
        `;
    }

    // Description
    modalDescription.innerHTML = office.description ||
        '<p style="color: var(--light-grey); font-family: Noto Sans, sans-serif; font-size: 0.9rem;">No description available.</p>';

    // Personnel
    if (office.personnel && office.personnel.length > 0) {
        modalPersonnelSection.classList.remove('hidden');
        modalPersonnel.innerHTML = office.personnel.map(p => `
            <div class="personnel-item">
                <span class="personnel-role">${p.role}</span>
                <span class="personnel-name">${p.name}</span>
            </div>
        `).join('');
    } else {
        modalPersonnelSection.classList.add('hidden');
    }

    // Sub offices
    if (office.subOffices && office.subOffices.length > 0) {
        modalSubOfficesSection.classList.remove('hidden');
        modalSubOffices.innerHTML = office.subOffices.map(s => `
            <div class="suboffice-item">
                <i class='bx bx-subdirectory-right'></i>
                ${s.name || s}
            </div>
        `).join('');
    } else {
        modalSubOfficesSection.classList.add('hidden');
    }

    // Building
    if (office.building) {
        modalBuildingSection.classList.remove('hidden');
        modalBuilding.innerHTML = `<i class='bx bx-building'></i> ${office.building.name || office.building}`;
    } else {
        modalBuildingSection.classList.add('hidden');
    }

    editModalBtn.onclick = () => {
        window.location.href = `office-edit.html?id=${office._id}`;
    };

    deleteModalBtn.onclick = () => {
        viewModalOverlay.classList.add('hidden');
        openDeleteModal(office._id, office.name);
    };

    viewModalOverlay.classList.remove('hidden');
}

closeViewModal.addEventListener('click', () => {
    clearInterval(autoSwapInterval);
    viewModalOverlay.classList.add('hidden');
    selectedOfficeId = null;
});

// ─── Delete Modal ─────────────────────────────────────────────────────────────
const deleteModalOverlay = document.getElementById('deleteModalOverlay');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');
const deleteTargetName = document.getElementById('deleteTargetName');
let deleteId = null;

function openDeleteModal(id, name) {
    deleteId = id;
    deleteTargetName.textContent = name;
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
        const res = await fetch(`/api/offices/${deleteId}`, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (!res.ok) {
            showToast('error', data.error || 'Failed to delete office.');
        } else {
            showToast('success', 'Office deleted successfully!');
            await fetchOffices();
        }
    } catch (err) {
        showToast('error', 'Failed to delete office.');
    } finally {
        hideLoading();
        deleteId = null;
    }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
fetchOffices();