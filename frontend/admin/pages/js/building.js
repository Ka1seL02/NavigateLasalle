import showToast from './toast.js';
import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── State ────────────────────────────────────────────────────────────────────
let allBuildings = [];
let selectedBuildingId = null;
let currentImageIndex = 0;
let autoSwapInterval = null;

// ─── Elements ─────────────────────────────────────────────────────────────────
const listView = document.getElementById('listView');
const mapView = document.getElementById('mapView');
const listTabBtn = document.getElementById('listTabBtn');
const mapTabBtn = document.getElementById('mapTabBtn');
const buildingsCount = document.getElementById('buildingsCount');
const addBuildingBtn = document.getElementById('addBuildingBtn');

// ─── Restore View from URL ────────────────────────────────────────────────────
const urlParams = new URLSearchParams(window.location.search);
const savedView = urlParams.get('view');

if (savedView === 'map') {
    mapTabBtn.classList.add('active');
    listTabBtn.classList.remove('active');
    mapView.classList.remove('hidden');
    listView.classList.add('hidden');
}

// ─── View Tabs ────────────────────────────────────────────────────────────────
listTabBtn.addEventListener('click', () => {
    listTabBtn.classList.add('active');
    mapTabBtn.classList.remove('active');
    listView.classList.remove('hidden');
    mapView.classList.add('hidden');
});

mapTabBtn.addEventListener('click', () => {
    mapTabBtn.classList.add('active');
    listTabBtn.classList.remove('active');
    mapView.classList.remove('hidden');
    listView.classList.add('hidden');
    renderMap();
});

// ─── Add Building ─────────────────────────────────────────────────────────────
addBuildingBtn.addEventListener('click', () => {
    window.location.href = 'building-add.html';
});

// ─── Fetch Buildings ──────────────────────────────────────────────────────────
async function fetchBuildings() {
    await showLoading();
    try {
        const res = await fetch('/api/buildings', { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        allBuildings = data.buildings;
        buildingsCount.textContent = allBuildings.length;
        renderList();
        if (savedView === 'map') renderMap();
    } catch (err) {
        showToast('error', 'Failed to load buildings.');
    } finally {
        hideLoading();
    }
}

// ─── Render List ──────────────────────────────────────────────────────────────
function renderList() {
    const categories = ['building', 'facility', 'gate', 'landmark', 'parking'];
    const categoryLabels = {
        building: 'Buildings',
        facility: 'Facilities',
        gate: 'Gates',
        landmark: 'Landmarks',
        parking: 'Parking Areas'
    };

    listView.innerHTML = '';

    categories.forEach(cat => {
        const items = allBuildings.filter(b => b.category === cat);
        if (items.length === 0) return;

        const section = document.createElement('div');
        section.classList.add('category-section');
        section.innerHTML = `<h3 class="category-title">${categoryLabels[cat]} (${items.length})</h3>`;

        const grid = document.createElement('div');
        grid.classList.add('cards-grid');

        items.forEach(b => {
            const card = document.createElement('div');
            card.classList.add('building-card');
            if (!b.isVisible) card.classList.add('card-hidden');

            card.innerHTML = `
                ${b.images && b.images.length > 0
                    ? `<img class="card-image" src="${b.images[0]}" alt="${b.name}" />`
                    : `<div class="card-image-placeholder"><i class='bx bx-building'></i></div>`
                }
                <div class="card-info">
                    <p class="card-dataid">${b.dataId}</p>
                    <p class="card-name">${b.name}</p>
                </div>
            `;

            card.addEventListener('click', () => openViewModal(b));
            grid.appendChild(card);
        });

        section.appendChild(grid);
        listView.appendChild(section);
    });
}

// ─── Render Map ───────────────────────────────────────────────────────────────
function renderMap() {
    const svg = document.getElementById('campusMap');
    svg.innerHTML = '';

    allBuildings.forEach(b => {
        if (!b.shape) return;

        let elem;
        const ns = 'http://www.w3.org/2000/svg';

        if (b.shape.type === 'rect') {
            elem = document.createElementNS(ns, 'rect');
            elem.setAttribute('x', b.shape.x);
            elem.setAttribute('y', b.shape.y);
            elem.setAttribute('width', b.shape.width);
            elem.setAttribute('height', b.shape.height);
            if (b.shape.rx) elem.setAttribute('rx', b.shape.rx);
            if (b.shape.ry) elem.setAttribute('ry', b.shape.ry);
            if (b.shape.rotate) {
                const cx = parseFloat(b.shape.x) + parseFloat(b.shape.width) / 2;
                const cy = parseFloat(b.shape.y) + parseFloat(b.shape.height) / 2;
                elem.setAttribute('transform', `rotate(${b.shape.rotate}, ${cx}, ${cy})`);
            }
        } else if (b.shape.type === 'ellipse') {
            elem = document.createElementNS(ns, 'ellipse');
            elem.setAttribute('cx', b.shape.cx);
            elem.setAttribute('cy', b.shape.cy);
            elem.setAttribute('rx', b.shape.rx);
            elem.setAttribute('ry', b.shape.ry);
        }

        if (!elem) return;

        elem.classList.add(b.category);
        elem.dataset.id = b._id;
        elem.dataset.dataId = b.dataId;
        svg.appendChild(elem);
    });

    svg.addEventListener('click', (e) => {
        const target = e.target;
        if (!target.dataset.id) return;

        const building = allBuildings.find(b => b._id === target.dataset.id);
        if (building) openViewModal(building);
    });
}

// ─── View Modal ───────────────────────────────────────────────────────────────
const viewModalOverlay = document.getElementById('viewModalOverlay');
const closeViewModal = document.getElementById('closeViewModal');
const modalGallery = document.getElementById('modalGallery');
const modalCategory = document.getElementById('modalCategory');
const modalDataId = document.getElementById('modalDataId');
const modalName = document.getElementById('modalName');
const modalDescription = document.getElementById('modalDescription');
const editModalBtn = document.getElementById('editModalBtn');
const deleteModalBtn = document.getElementById('deleteModalBtn');

function openViewModal(building) {
    selectedBuildingId = building._id;
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

    if (building.images && building.images.length > 0) {
        modalGallery.innerHTML = `
            <img src="${building.images[0]}" alt="${building.name}" id="galleryImg" />
            ${building.images.length > 1 ? `
                <div class="gallery-nav">
                    ${building.images.map((_, i) => `
                        <div class="gallery-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>
                    `).join('')}
                </div>
            ` : ''}
        `;

        if (building.images.length > 1) {
            modalGallery.querySelectorAll('.gallery-dot').forEach(dot => {
                dot.addEventListener('click', () => {
                    currentImageIndex = parseInt(dot.dataset.index);
                    document.getElementById('galleryImg').src = building.images[currentImageIndex];
                    modalGallery.querySelectorAll('.gallery-dot').forEach(d => d.classList.remove('active'));
                    dot.classList.add('active');
                    startAutoSwap(building.images);
                });
            });
            startAutoSwap(building.images);
        }
    } else {
        modalGallery.innerHTML = `
            <div class="no-image">
                <i class='bx bx-image'></i>
                <p>No images available</p>
            </div>
        `;
    }

    modalCategory.textContent = building.category;
    modalDataId.textContent = building.dataId;
    modalName.textContent = building.name;
    modalDescription.innerHTML = building.description || '<p style="color: var(--light-grey); font-family: Noto Sans, sans-serif; font-size: 0.9rem;">No description available.</p>';

    editModalBtn.onclick = () => {
        const currentView = mapView.classList.contains('hidden') ? 'list' : 'map';
        window.location.href = `building-edit.html?id=${building._id}&view=${currentView}`;
    };

    deleteModalBtn.onclick = () => {
        viewModalOverlay.classList.add('hidden');
        openDeleteModal(building._id, building.name);
    };

    viewModalOverlay.classList.remove('hidden');
}

closeViewModal.addEventListener('click', () => {
    clearInterval(autoSwapInterval);
    viewModalOverlay.classList.add('hidden');
    selectedBuildingId = null;
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
        const res = await fetch(`/api/buildings/${deleteId}`, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();

        if (!res.ok) {
            showToast('error', data.error || 'Failed to delete building.');
        } else {
            showToast('success', 'Building deleted successfully!');
            await fetchBuildings();
        }
    } catch (err) {
        showToast('error', 'Failed to delete building.');
    } finally {
        hideLoading();
        deleteId = null;
    }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
fetchBuildings();