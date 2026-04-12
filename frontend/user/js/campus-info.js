import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── State ────────────────────────────────────────────────────────────────────
let allOffices = [];
let currentSectionIndex = 0;

// ─── Elements ─────────────────────────────────────────────────────────────────
const sectionsContainer = document.getElementById('sectionsContainer');
const sectionDots = document.getElementById('sectionDots');

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

// ─── Fetch Data ───────────────────────────────────────────────────────────────
async function fetchAll() {
    const [infoRes, officesRes] = await Promise.all([
        fetch('/api/campus-info'),
        fetch('/api/offices')
    ]);

    const infoData = await infoRes.json();
    const officesData = await officesRes.json();

    allOffices = officesData.offices.filter(o => o.isVisible);

    renderSections(infoData.sections);
}

// ─── Render Sections ──────────────────────────────────────────────────────────
function renderSections(sections) {
    sectionsContainer.innerHTML = '';
    sectionDots.innerHTML = '';

    const allSections = [...sections, { key: 'offices', label: 'Our Offices' }];

    allSections.forEach((section, index) => {
        const isOdd = index % 2 === 0; // 0-indexed so 0 = odd = campus bg
        const isOffices = section.key === 'offices';

        const div = document.createElement('div');
        div.className = `ci-section ${isOffices ? 'offices-section bg-white' : isOdd ? 'bg-campus' : 'bg-white'}`;
        div.dataset.index = index;

        if (isOffices) {
            div.innerHTML = `
                <div class="ci-card">
                    <p class="ci-section-label">Directory</p>
                    <h2 class="ci-section-title">Our Offices</h2>
                    <div class="offices-search">
                        <i class='bx bx-search'></i>
                        <input type="text" id="officesSearchInput" placeholder="Search offices..." />
                    </div>
                    <div class="offices-list" id="officesList"></div>
                </div>
            `;
        } else {
            div.innerHTML = `
                <div class="ci-card">
                    <p class="ci-section-label">${getLabelTag(section.key)}</p>
                    <h2 class="ci-section-title">${section.label}</h2>
                    <div class="ci-section-content">
                        ${section.content || `<p class="ci-empty">Content coming soon.</p>`}
                    </div>
                </div>
            `;
        }

        sectionsContainer.appendChild(div);

        // Dot
        const dot = document.createElement('button');
        dot.className = `section-dot ${!isOdd ? 'on-white' : ''}`;
        dot.dataset.index = index;
        dot.title = section.label;
        dot.addEventListener('click', () => scrollToSection(index));
        sectionDots.appendChild(dot);
    });

    // Render offices
    renderOffices('');

    // Setup search
    const searchInput = document.getElementById('officesSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => renderOffices(searchInput.value.trim().toLowerCase()));
    }

    // Setup scroll observer
    setupScrollObserver();
    updateDots(0);
}

// ─── Label Tags ───────────────────────────────────────────────────────────────
function getLabelTag(key) {
    const tags = {
        mission:     'Who We Are',
        vision:      'Where We\'re Going',
        core_values: 'What We Stand For',
        about:       'Our Story',
        hymn:        'Our Song',
        contact:     'Reach Us'
    };
    return tags[key] || '';
}

// ─── Render Offices ───────────────────────────────────────────────────────────
function renderOffices(search) {
    const list = document.getElementById('officesList');
    if (!list) return;

    const filtered = search
        ? allOffices.filter(o =>
            o.name.toLowerCase().includes(search) ||
            o.category.toLowerCase().includes(search)
          )
        : allOffices;

    if (filtered.length === 0) {
        list.innerHTML = `<div class="offices-empty">No offices found.</div>`;
        return;
    }

    // Group by category
    const grouped = {};
    filtered.forEach(o => {
        if (!grouped[o.category]) grouped[o.category] = [];
        grouped[o.category].push(o);
    });

    list.innerHTML = Object.entries(grouped).map(([category, offices]) => `
        <div>
            <p class="office-category-title">${category} (${offices.length})</p>
            <div class="office-cards-grid">
                ${offices.map(o => `
                    <div class="office-card" data-id="${o._id}">
                        <p class="office-card-name">${o.name}</p>
                        <div class="office-card-info">
                            ${o.officeHours ? `
                                <span class="office-card-info-item">
                                    <i class='bx bx-time'></i> ${o.officeHours}
                                </span>
                            ` : ''}
                            ${o.email ? `
                                <span class="office-card-info-item">
                                    <i class='bx bx-envelope'></i> ${o.email}
                                </span>
                            ` : ''}
                            ${o.phone ? `
                                <span class="office-card-info-item">
                                    <i class='bx bx-phone'></i> ${o.phone}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    // Add click listeners
    list.querySelectorAll('.office-card').forEach(card => {
        card.addEventListener('click', () => {
            const office = allOffices.find(o => o._id === card.dataset.id);
            if (office) openOfficeModal(office);
        });
    });
}

// ─── Office Modal ─────────────────────────────────────────────────────────────
const officeModalOverlay = document.getElementById('officeModalOverlay');
const officeModalClose = document.getElementById('officeModalClose');
const officeModalGallery = document.getElementById('officeModalGallery');
const officeModalBody = document.getElementById('officeModalBody');

function openOfficeModal(office) {
    // Gallery
    if (office.images && office.images.length > 0) {
        officeModalGallery.innerHTML = `
            <img src="${office.images[0]}" alt="${office.name}" id="officeGalleryImg" />
            ${office.images.length > 1 ? `
                <div class="gallery-nav" style="position:absolute;bottom:0.5rem;left:50%;transform:translateX(-50%);display:flex;gap:5px;">
                    ${office.images.map((_, i) => `
                        <button class="gallery-dot ${i === 0 ? 'active' : ''}" data-index="${i}"
                            style="width:7px;height:7px;border-radius:50%;background:${i === 0 ? 'white' : 'rgba(255,255,255,0.5)'};border:none;cursor:pointer;"></button>
                    `).join('')}
                </div>
            ` : ''}
        `;
        if (office.images.length > 1) {
            officeModalGallery.querySelectorAll('.gallery-dot').forEach(dot => {
                dot.addEventListener('click', () => {
                    const idx = parseInt(dot.dataset.index);
                    document.getElementById('officeGalleryImg').src = office.images[idx];
                    officeModalGallery.querySelectorAll('.gallery-dot').forEach((d, i) => {
                        d.style.background = i === idx ? 'white' : 'rgba(255,255,255,0.5)';
                    });
                });
            });
        }
    } else {
        officeModalGallery.innerHTML = `
            <div class="no-image">
                <i class='bx bx-buildings'></i>
                <p>No images available</p>
            </div>
        `;
    }

    // Body
    officeModalBody.innerHTML = `
        <span class="office-modal-category">${office.category}</span>
        <h2 class="office-modal-name">${office.name}</h2>
        ${office.head ? `<p class="office-modal-head">${office.head}</p>` : ''}
        <div class="office-modal-info-grid">
            ${office.email ? `<div class="office-modal-info-item"><i class='bx bx-envelope'></i> ${office.email}</div>` : ''}
            ${office.phone ? `<div class="office-modal-info-item"><i class='bx bx-phone'></i> ${office.phone}</div>` : ''}
            ${office.officeHours ? `<div class="office-modal-info-item"><i class='bx bx-time'></i> ${office.officeHours}</div>` : ''}
        </div>
        ${office.description ? `<div class="office-modal-description">${office.description}</div>` : ''}
        ${office.personnel && office.personnel.length > 0 ? `
            <p class="office-modal-section-title">Personnel</p>
            <div class="office-modal-personnel">
                ${office.personnel.map(p => `
                    <div class="personnel-item">
                        <span class="personnel-role">${p.role}</span>
                        <span class="personnel-name">${p.name}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
        ${office.building ? `
            <p class="office-modal-section-title">Located In</p>
            <span class="office-modal-building">
                <i class='bx bx-building'></i> ${office.building.name || office.building}
            </span>
        ` : ''}
    `;

    officeModalOverlay.classList.remove('hidden');
}

officeModalClose.addEventListener('click', () => {
    officeModalOverlay.classList.add('hidden');
});

officeModalOverlay.addEventListener('click', (e) => {
    if (e.target === officeModalOverlay) officeModalOverlay.classList.add('hidden');
});

// ─── Scroll / Dot Indicator ───────────────────────────────────────────────────
function setupScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = parseInt(entry.target.dataset.index);
                updateDots(index);
            }
        });
    }, {
        root: sectionsContainer,
        threshold: 0.5
    });

    sectionsContainer.querySelectorAll('.ci-section').forEach(section => {
        observer.observe(section);
    });
}

function updateDots(activeIndex) {
    currentSectionIndex = activeIndex;
    sectionDots.querySelectorAll('.section-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === activeIndex);
    });
}

function scrollToSection(index) {
    const sections = sectionsContainer.querySelectorAll('.ci-section');
    if (sections[index]) {
        sections[index].scrollIntoView({ behavior: 'smooth' });
    }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
(async () => {
    await showLoading();
    await fetchAll();
    hideLoading();
})();