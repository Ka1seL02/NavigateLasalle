import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── State ────────────────────────────────────────────────────────────────────
let allOffices = [];

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

// ─── Fetch All ────────────────────────────────────────────────────────────────
async function fetchAll() {
    const [infoRes, officesRes] = await Promise.all([
        fetch('/api/campus-info'),
        fetch('/api/offices')
    ]);
    const infoData = await infoRes.json();
    const officesData = await officesRes.json();
    allOffices = officesData.offices.filter(o => o.isVisible);
    buildPage(infoData.sections);
}

// ─── YouTube URL → Embed URL ──────────────────────────────────────────────────
function getYouTubeEmbedUrl(url) {
    if (!url) return null;
    const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

// ─── Build Page ───────────────────────────────────────────────────────────────
function buildPage(sections) {
    const byKey = {};
    sections.forEach(s => byKey[s.key] = s);

    const coreValues = [
        byKey['core_value_1'],
        byKey['core_value_2'],
        byKey['core_value_3']
    ].filter(Boolean);

    // Define page sections
    const pageSections = [
        { id: 'mission-vision', label: 'Mission & Vision', onWhite: false },
        { id: 'about',          label: 'About DLSU-D',     onWhite: true  },
        { id: 'core-values',    label: 'Core Values',      onWhite: false },
        { id: 'hymn',           label: 'Alma Mater',       onWhite: true  },
        { id: 'contact',        label: 'Contact',          onWhite: false },
        { id: 'offices',        label: 'Our Offices',      onWhite: true  },
    ];

    // Build dots
    sectionDots.innerHTML = '';
    pageSections.forEach((ps, index) => {
        const wrap = document.createElement('div');
        wrap.className = `section-dot-wrap ${ps.onWhite ? 'on-white' : ''}`;
        wrap.dataset.index = index;
        wrap.innerHTML = `
            <span class="section-dot-label">${ps.label}</span>
            <div class="section-dot ${index === 0 ? 'active' : ''}"></div>
        `;
        wrap.addEventListener('click', () => scrollToSection(index));
        sectionDots.appendChild(wrap);
    });

    // Build sections
    sectionsContainer.innerHTML = '';

    // ── Section 1: Mission & Vision ──────────────────────────────────────────
    const mission = byKey['mission'];
    const vision = byKey['vision'];
    const mvSection = document.createElement('div');
    mvSection.className = 'ci-section section-mission-vision';
    mvSection.dataset.index = 0;
    mvSection.innerHTML = `
        <div class="mv-card">
            <div class="mv-col">
                <p class="mv-col-label"><i class='bx bx-bullseye'></i> Mission</p>
                <h2 class="mv-col-title">What We Do</h2>
                <div class="mv-col-content">
                    ${mission?.content || '<p>Content coming soon.</p>'}
                </div>
            </div>
            <div class="mv-divider"></div>
            <div class="mv-col">
                <p class="mv-col-label"><i class='bx bx-glasses'></i> Vision</p>
                <h2 class="mv-col-title">Where We\'re Going</h2>
                <div class="mv-col-content">
                    ${vision?.content || '<p>Content coming soon.</p>'}
                </div>
            </div>
        </div>
    `;
    sectionsContainer.appendChild(mvSection);

    // ── Section 2: About ─────────────────────────────────────────────────────
    const about = byKey['about'];
    const aboutSection = document.createElement('div');
    aboutSection.className = 'ci-section section-about';
    aboutSection.dataset.index = 1;
    aboutSection.innerHTML = `
        <div class="about-card">
            <div class="about-year-block">
                <p class="about-year">1977</p>
                <p class="about-year-label">Year Founded</p>
            </div>
            <div class="about-content-block">
                <p class="about-label">Our Story</p>
                <h2 class="about-title">About DLSU-D</h2>
                <div class="about-content">
                    ${about?.content || '<p>Content coming soon.</p>'}
                </div>
            </div>
        </div>
    `;
    sectionsContainer.appendChild(aboutSection);

    // ── Section 3: Core Values ────────────────────────────────────────────────
    const cvSection = document.createElement('div');
    cvSection.className = 'ci-section section-core-values';
    cvSection.dataset.index = 2;
    cvSection.innerHTML = `
        <div class="cv-card">
            <div class="cv-left">
                <p class="cv-label">What We Stand For</p>
                <h2 class="cv-title">Core Values</h2>
                <p class="cv-subtitle">The principles that guide every Lasallian in everything we do.</p>
            </div>
            <div class="cv-right">
                ${coreValues.map(cv => `
                    <div class="cv-value-card">
                        <div class="cv-value-icon">
                            <i class='bx ${cv.icon || 'bx-star'}'></i>
                        </div>
                        <div class="cv-value-content">
                            <p class="cv-value-name">${cv.label}</p>
                            <div class="cv-value-desc">${cv.content || ''}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    sectionsContainer.appendChild(cvSection);

    // ── Section 4: Hymn ──────────────────────────────────────────────────────
    const hymn = byKey['hymn'];
    const embedUrl = getYouTubeEmbedUrl(hymn?.videoUrl);

    const hymnSection = document.createElement('div');
    hymnSection.className = 'ci-section section-hymn';
    hymnSection.dataset.index = 3;
    hymnSection.innerHTML = `
        <div class="hymn-card ${embedUrl ? 'hymn-card--with-video' : ''}">
            <div class="hymn-text-side">
                <div class="hymn-icon"><i class='bx bx-music'></i></div>
                <p class="hymn-label">Our Song</p>
                <h2 class="hymn-title">Alma Mater Hymn</h2>
                <div class="hymn-content">
                    ${hymn?.content || '<p>Content coming soon.</p>'}
                </div>
            </div>
            ${embedUrl ? `
                <div class="hymn-video-side">
                    <iframe
                        src="${embedUrl}"
                        title="Alma Mater Hymn"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen>
                    </iframe>
                </div>
            ` : ''}
        </div>
    `;
    sectionsContainer.appendChild(hymnSection);

    // ── Section 5: Contact ────────────────────────────────────────────────────
    const contact = byKey['contact'];
    const contactSection = document.createElement('div');
    contactSection.className = 'ci-section section-contact';
    contactSection.dataset.index = 4;
    contactSection.innerHTML = `
        <div class="contact-card">
            <p class="contact-label">Reach Us</p>
            <h2 class="contact-title">Contact Information</h2>
            <div class="contact-content">
                ${contact?.content || '<p>Content coming soon.</p>'}
            </div>
        </div>
    `;
    sectionsContainer.appendChild(contactSection);

    // ── Section 6: Offices ────────────────────────────────────────────────────
    const officesSection = document.createElement('div');
    officesSection.className = 'ci-section section-offices';
    officesSection.dataset.index = 5;
    officesSection.innerHTML = `
        <div class="offices-card">
            <div class="offices-header">
                <p class="offices-label">Directory</p>
                <h2 class="offices-title">Our Offices</h2>
            </div>
            <div class="offices-search">
                <i class='bx bx-search'></i>
                <input type="text" id="officesSearchInput" placeholder="Search offices..." />
            </div>
            <div class="offices-list" id="officesList"></div>
        </div>
    `;
    sectionsContainer.appendChild(officesSection);

    // Render offices
    renderOffices('');

    // Search
    document.getElementById('officesSearchInput').addEventListener('input', (e) => {
        renderOffices(e.target.value.trim().toLowerCase());
    });

    // Setup scroll observer
    setupScrollObserver();
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
                            ${o.officeHours ? `<span class="office-card-info-item"><i class='bx bx-time'></i> ${o.officeHours}</span>` : ''}
                            ${o.email ? `<span class="office-card-info-item"><i class='bx bx-envelope'></i> ${o.email}</span>` : ''}
                            ${o.phone ? `<span class="office-card-info-item"><i class='bx bx-phone'></i> ${o.phone}</span>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

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
    if (office.images && office.images.length > 0) {
        officeModalGallery.innerHTML = `<img src="${office.images[0]}" alt="${office.name}" />`;
    } else {
        officeModalGallery.innerHTML = `
            <div class="no-image">
                <i class='bx bx-buildings'></i>
                <p>No images available</p>
            </div>
        `;
    }

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

officeModalClose.addEventListener('click', () => officeModalOverlay.classList.add('hidden'));
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