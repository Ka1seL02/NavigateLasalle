import showToast from './toast.js';
import { showLoading, hideLoading } from '/shared/js/loading.js';
import { Viewer } from 'https://esm.sh/@photo-sphere-viewer/core@5.13.1';
import { MarkersPlugin } from 'https://esm.sh/@photo-sphere-viewer/markers-plugin@5.13.1';

// ─── State ────────────────────────────────────────────────────────────────────
let allScenes = [];
let settings = {};
let quill = null;
let psvViewer = null;
let psvMarkersPlugin = null;

// Browse state
let activeCategory = null; // null = "All"
let activeCampus = '';     // '' = all, 'east', 'west'
let activeView = 'cards';  // 'cards', 'table', 'strip', 'pano', 'grouped'

// Editing state
let editingScene = null;
let isUnlocked = false;
let removedGalleryImages = [];
let newGalleryFiles = [];
let newPanoramaFile = null;
let newSceneAudioFile = null;
let updatedMarkerPositions = {};  // { markerId: { yaw, pitch } }
let newMarkerIcons = {};          // { markerId: File }

// Settings file state
let newLogo = null;
let newLogoCollapsed = null;
let newNarration = null;
let newBgmTracks = [];   // array of { file?: File, url?: string, name: string }
let newVideo = null;

// ─── Category Config ──────────────────────────────────────────────────────────
const CATEGORIES = ['buildings', 'facilities', 'landmarks', 'gates', 'parking', 'roads', 'start'];
const CATEGORY_LABELS = {
    buildings: 'Buildings',
    facilities: 'Facilities',
    landmarks: 'Landmarks',
    gates: 'Gates',
    parking: 'Parking Areas',
    roads: 'Roads',
    start: 'Start'
};
const CATEGORY_ICONS = {
    buildings: 'bx bx-building-house',
    facilities: 'bx bx-cog',
    landmarks: 'bx bx-map-pin',
    gates: 'bx bx-door-open',
    parking: 'bx bx-car',
    roads: 'bx bx-street-view',
    start: 'bx bx-play-circle'
};
const CATEGORY_DOT_COLORS = {
    buildings: '#3B6D11',
    facilities: '#0F6E56',
    landmarks: '#993C1D',
    gates: '#534AB7',
    parking: '#8a8a8a',
    roads: '#854F0B',
    start: '#888780'
};

function getCategoryIconUrl(category) {
    const map = {
        buildings: settings.icon_buildings_url,
        facilities: settings.icon_facilities_url,
        landmarks: settings.icon_landmarks_url,
        gates: settings.icon_gates_url,
        parking: settings.icon_parking_url,
    };
    return map[category] || '';
}

// ─── Elements ─────────────────────────────────────────────────────────────────
const scenesTabBtn = document.getElementById('scenesTabBtn');
const sidebarTabBtn = document.getElementById('sidebarTabBtn');
const scenesView = document.getElementById('scenesView');
const sidebarSettingsView = document.getElementById('sidebarSettingsView');

const browseStage = document.getElementById('browseStage');
const editStage = document.getElementById('editStage');
const catList = document.getElementById('catList');
const cardGrid = document.getElementById('cardGrid');
const sceneSearch = document.getElementById('sceneSearch');
const browseTitle = document.getElementById('browseTitle');
const browseSub = document.getElementById('browseSub');
const totalScenesCount = document.getElementById('totalScenesCount');

// ─── View Tab Switching ───────────────────────────────────────────────────────
scenesTabBtn.addEventListener('click', () => {
    scenesTabBtn.classList.add('active');
    sidebarTabBtn.classList.remove('active');
    scenesView.classList.remove('hidden');
    sidebarSettingsView.classList.add('hidden');
});

sidebarTabBtn.addEventListener('click', () => {
    sidebarTabBtn.classList.add('active');
    scenesTabBtn.classList.remove('active');
    sidebarSettingsView.classList.remove('hidden');
    scenesView.classList.add('hidden');
});

// ─── Fetch Data ───────────────────────────────────────────────────────────────
async function fetchAll() {
    await showLoading();
    try {
        const [scenesRes, settingsRes] = await Promise.all([
            fetch('/api/scenes', { headers: { 'Accept': 'application/json' } }),
            fetch('/api/settings', { headers: { 'Accept': 'application/json' } })
        ]);
        allScenes = await scenesRes.json();
        settings = await settingsRes.json();

        renderCategorySidebar();
        renderCards();
        prefillSettings();
    } catch (err) {
        showToast('error', 'Failed to load Virtual Tour data.');
    } finally {
        hideLoading();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  STAGE 1 — BROWSE
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Category Sidebar ─────────────────────────────────────────────────────────
function renderCategorySidebar() {
    catList.innerHTML = '';
    totalScenesCount.textContent = `${allScenes.length} scenes`;

    CATEGORIES.forEach(cat => {
        const count = allScenes.filter(s => s.category === cat).length;
        const item = document.createElement('div');
        item.classList.add('cat-item');
        if (activeCategory === cat) item.classList.add('active');

        const catColor = CATEGORY_DOT_COLORS[cat] || '#888';
        item.style.setProperty('--cat-color', catColor);
        item.innerHTML = `
            ${CATEGORY_LABELS[cat]}
            <span class="cat-count">${count}</span>
        `;
        item.addEventListener('click', () => selectCategory(cat));
        catList.appendChild(item);
    });
}

function selectCategory(cat) {
    activeCategory = activeCategory === cat ? null : cat;
    renderCategorySidebar();
    renderCards();
}

// ─── Campus Tabs ──────────────────────────────────────────────────────────────
document.querySelectorAll('.campus-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.campus-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCampus = btn.dataset.campus;
        renderCards();
    });
});

// ─── Search ───────────────────────────────────────────────────────────────────
sceneSearch.addEventListener('input', renderCards);

// ─── View Switcher ────────────────────────────────────────────────────────────
document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeView = btn.dataset.view;
        renderCards();
    });
});

// ─── Render Card Grid ─────────────────────────────────────────────────────────
function renderCards() {
    const search = sceneSearch.value.trim().toLowerCase();

    let filtered = [...allScenes];

    // Category filter
    if (activeCategory) {
        filtered = filtered.filter(s => s.category === activeCategory);
    }

    // Campus filter
    if (activeCampus) {
        filtered = filtered.filter(s => s.campus === activeCampus || s.campus === 'both');
    }

    // Search filter
    if (search) {
        filtered = filtered.filter(s =>
            s.title.toLowerCase().includes(search) ||
            s._id.toLowerCase().includes(search)
        );
    }

    // Update toolbar text
    browseTitle.textContent = activeCategory ? CATEGORY_LABELS[activeCategory] : 'All';
    browseSub.textContent = `${filtered.length} scene${filtered.length !== 1 ? 's' : ''}`;

    // Clear grid and set view class
    cardGrid.innerHTML = '';
    cardGrid.className = 'card-grid';
    if (activeView !== 'cards') cardGrid.classList.add('view-' + activeView);

    if (filtered.length === 0) {
        cardGrid.innerHTML = `
            <div class="empty-state">
                <i class='bx bx-landscape'></i>
                <p>No scenes found</p>
            </div>
        `;
        return;
    }

    // Helper: build icon HTML for a scene
    function sceneIcon(scene, cls) {
        const cat = scene.category;
        const url = getCategoryIconUrl(cat);
        return url
            ? `<img src="${url}" alt="${cat}" class="${cls || ''}" />`
            : `<i class='${CATEGORY_ICONS[cat] || 'bx bx-landscape'}'></i>`;
    }

    function markerCount(scene) {
        return (scene.navigation_markers?.length || 0) + (scene.info_markers?.length || 0);
    }

    switch (activeView) {
    // ── Cards (default) ──────────────────────────────────────────────────────
    case 'cards':
        filtered.forEach(scene => {
            const cat = scene.category;
            const total = markerCount(scene);
            const card = document.createElement('div');
            card.classList.add('scene-card');
            card.innerHTML = `
                <div class="card-thumb cat-${cat}">${sceneIcon(scene)}</div>
                <div class="card-body">
                    <div class="card-title">${scene.title}</div>
                    <div class="card-meta">
                        <span class="pill ${cat}">${CATEGORY_LABELS[cat] || cat}</span>
                        <span class="pill ${scene.campus}">${scene.campus}</span>
                        ${total > 0 ? `<span class="card-markers"><i class='bx bx-map-pin'></i>${total}</span>` : ''}
                    </div>
                </div>
            `;
            card.addEventListener('click', () => openSceneEdit(scene._id));
            cardGrid.appendChild(card);
        });
        break;

    // ── Table ────────────────────────────────────────────────────────────────
    case 'table': {
        const table = document.createElement('table');
        table.className = 'scene-table';
        table.innerHTML = `<thead><tr>
            <th>Scene</th><th>ID</th><th>Campus</th><th>Category</th><th>Markers</th><th></th>
        </tr></thead>`;
        const tbody = document.createElement('tbody');
        filtered.forEach(scene => {
            const cat = scene.category;
            const total = markerCount(scene);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:600;">${scene.title}</td>
                <td><span class="scene-id">${scene._id}</span></td>
                <td><span class="pill ${scene.campus}">${scene.campus}</span></td>
                <td><span class="pill ${cat}">${CATEGORY_LABELS[cat] || cat}</span></td>
                <td><span class="tbl-markers"><i class='bx bx-map-pin'></i>${total}</span></td>
                <td><span class="tbl-edit">Edit</span></td>
            `;
            tr.addEventListener('click', () => openSceneEdit(scene._id));
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        cardGrid.appendChild(table);
        break;
    }

    // ── Strip list ───────────────────────────────────────────────────────────
    case 'strip':
        filtered.forEach(scene => {
            const cat = scene.category;
            const total = markerCount(scene);
            const item = document.createElement('div');
            item.className = 'strip-item';
            item.innerHTML = `
                <div class="strip-thumb cat-${cat}">${sceneIcon(scene)}</div>
                <div class="strip-info">
                    <div class="strip-title">${scene.title}</div>
                    <div class="strip-meta">
                        <span class="pill ${cat}">${CATEGORY_LABELS[cat] || cat}</span>
                        <span class="pill ${scene.campus}">${scene.campus}</span>
                    </div>
                </div>
                <div class="strip-right">
                    ${total > 0 ? `<span class="strip-markers"><i class='bx bx-map-pin'></i>${total} markers</span>` : ''}
                    <span class="strip-arrow"><i class='bx bx-chevron-right'></i></span>
                </div>
            `;
            item.addEventListener('click', () => openSceneEdit(scene._id));
            cardGrid.appendChild(item);
        });
        break;

    // ── Panorama grid ────────────────────────────────────────────────────────
    case 'pano':
        filtered.forEach(scene => {
            const cat = scene.category;
            const total = markerCount(scene);
            const card = document.createElement('div');
            card.className = 'pano-card';
            card.innerHTML = `
                <div class="pano-thumb cat-${cat}">
                    ${sceneIcon(scene, 'pano-thumb-icon')}
                    <div class="pano-overlay">
                        <span class="pano-overlay-title">${scene.title}</span>
                        ${total > 0 ? `<span class="pano-overlay-count">${total} mkrs</span>` : ''}
                    </div>
                </div>
                <div class="pano-foot">
                    <span class="pill ${cat}">${CATEGORY_LABELS[cat] || cat}</span>
                    <span class="pill ${scene.campus}">${scene.campus}</span>
                </div>
            `;
            card.addEventListener('click', () => openSceneEdit(scene._id));
            cardGrid.appendChild(card);
        });
        break;

    // ── Grouped (by campus) ──────────────────────────────────────────────────
    case 'grouped': {
        const groups = { east: [], west: [], both: [] };
        filtered.forEach(s => {
            if (s.campus === 'east') groups.east.push(s);
            else if (s.campus === 'west') groups.west.push(s);
            else groups.both.push(s);
        });
        const order = [
            { key: 'east', label: 'East campus', pillClass: 'east' },
            { key: 'west', label: 'West campus', pillClass: 'west' },
            { key: 'both', label: 'Both campuses', pillClass: 'both' },
        ];
        order.forEach(({ key, label, pillClass }) => {
            if (groups[key].length === 0) return;
            const lbl = document.createElement('div');
            lbl.className = 'group-label';
            lbl.innerHTML = `<span class="pill ${pillClass}">${label}</span>`;
            cardGrid.appendChild(lbl);

            const section = document.createElement('div');
            section.className = 'group-section';
            groups[key].forEach(scene => {
                const cat = scene.category;
                const total = markerCount(scene);
                const item = document.createElement('div');
                item.className = 'group-item';
                item.innerHTML = `
                    <div class="strip-thumb cat-${cat}">${sceneIcon(scene)}</div>
                    <div class="strip-info">
                        <div class="strip-title">${scene.title}</div>
                        <div style="font-size:0.65rem;color:var(--light-grey);margin-top:2px;">${scene._id}</div>
                    </div>
                    <div class="strip-right">
                        ${total > 0 ? `<span class="strip-markers"><i class='bx bx-map-pin'></i>${total}</span>` : ''}
                        <span class="strip-arrow"><i class='bx bx-chevron-right'></i></span>
                    </div>
                `;
                item.addEventListener('click', () => openSceneEdit(scene._id));
                section.appendChild(item);
            });
            cardGrid.appendChild(section);
        });
        break;
    }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  STAGE 2 — EDIT
// ═══════════════════════════════════════════════════════════════════════════════

function openSceneEdit(sceneId) {
    // If switching scenes while editing, revert first
    if (editingScene && isUnlocked) {
        discardSceneChanges();
    }

    editingScene = allScenes.find(s => s._id === sceneId);
    if (!editingScene) return;

    // Reset state
    isUnlocked = false;
    removedGalleryImages = [];
    newGalleryFiles = [];
    newPanoramaFile = null;
    newSceneAudioFile = null;
    updatedMarkerPositions = {};
    newMarkerIcons = {};

    // Switch stages
    browseStage.classList.add('hidden');
    editStage.classList.remove('hidden');

    // Top bar
    document.getElementById('editTitle').textContent = editingScene.title;
    const editMeta = document.getElementById('editMeta');
    editMeta.innerHTML = `
        <span class="pill ${editingScene.category}">${CATEGORY_LABELS[editingScene.category]}</span>
        <span class="pill ${editingScene.campus}">${editingScene.campus}</span>
    `;

    // Back label
    document.getElementById('backLabel').textContent = activeCategory
        ? CATEGORY_LABELS[activeCategory]
        : 'All Scenes';

    // Locked state
    document.getElementById('lockedOverlay').classList.remove('hidden');
    document.querySelector('.right-panel').classList.add('panel-locked');
    document.getElementById('editSceneBtn').classList.remove('hidden');
    document.getElementById('discardBtn').classList.add('hidden');
    document.getElementById('saveSceneBtn').classList.add('hidden');

    // Disable scene info fields
    document.querySelectorAll('#panelScene .pfield-input').forEach(el => el.disabled = true);

    // PSV info bar
    document.getElementById('psvInfoId').textContent = `ID: ${editingScene._id}`;
    document.getElementById('psvInfoCampus').textContent = `Campus: ${editingScene.campus}`;
    document.getElementById('psvInfoCategory').textContent = `Category: ${editingScene.category}`;

    // Show/hide modal panel tab based on actual scene data
    const modalTab = document.querySelector('.panel-tab[data-panel="modal"]');
    const hasInfoModal = editingScene.info_markers?.length > 0;
    modalTab.style.display = hasInfoModal ? '' : 'none';

    // Prefill panels
    prefillScenePanel();
    renderNavMarkersList();
    renderInfoMarkersList();
    prefillModalPanel();

    // Init 360 viewer
    initPsvViewer();

    // Set scene tab active
    switchPanelTab('scene');
}

function closeEdit(skipDiscard) {
    if (!skipDiscard && isUnlocked) discardSceneChanges();
    if (psvViewer) { psvViewer.destroy(); psvViewer = null; psvMarkersPlugin = null; }
    editStage.classList.add('hidden');
    browseStage.classList.remove('hidden');
    editingScene = null;
    isUnlocked = false;
}

function enterSceneEditMode() {
    isUnlocked = true;
    document.getElementById('lockedOverlay').classList.add('hidden');
    document.querySelector('.right-panel').classList.remove('panel-locked');
    document.getElementById('editSceneBtn').classList.add('hidden');
    document.getElementById('discardBtn').classList.remove('hidden');
    document.getElementById('saveSceneBtn').classList.remove('hidden');

    // Enable scene info fields
    document.querySelectorAll('#panelScene .pfield-input').forEach(el => el.disabled = false);

    // Make PSV markers draggable
    if (psvMarkersPlugin) {
        const allMarkers = [
            ...(editingScene.navigation_markers || []),
            ...(editingScene.info_markers || [])
        ];
        allMarkers.forEach(m => {
            try { psvMarkersPlugin.updateMarker({ id: m.id, draggable: true }); } catch(e) {}
        });
    }
}

function discardSceneChanges() {
    // Reset file selections
    newPanoramaFile = null;
    newSceneAudioFile = null;
    removedGalleryImages = [];
    newGalleryFiles = [];
    updatedMarkerPositions = {};
    newMarkerIcons = {};

    // Revert scene info fields
    prefillScenePanel();

    // Revert panorama in PSV viewer
    if (psvViewer && editingScene.panorama_url) {
        psvViewer.setPanorama(editingScene.panorama_url).catch(() => {});
    }

    // Revert modal fields
    prefillModalPanel();

    // Revert marker lists & reset PSV markers
    renderNavMarkersList();
    renderInfoMarkersList();
    if (psvMarkersPlugin) {
        psvMarkersPlugin.clearMarkers();
        addSceneMarkersToPsv(true);
    }

    // Re-lock
    isUnlocked = false;
    document.getElementById('lockedOverlay').classList.remove('hidden');
    document.querySelector('.right-panel').classList.add('panel-locked');
    document.getElementById('editSceneBtn').classList.remove('hidden');
    document.getElementById('discardBtn').classList.add('hidden');
    document.getElementById('saveSceneBtn').classList.add('hidden');

    // Disable scene info fields
    document.querySelectorAll('#panelScene .pfield-input').forEach(el => el.disabled = true);
}

// ─── Back / Discard ───────────────────────────────────────────────────────────
document.getElementById('backBtn').addEventListener('click', closeEdit);
document.getElementById('discardBtn').addEventListener('click', discardSceneChanges);

// ─── Edit Button ──────────────────────────────────────────────────────────────
document.getElementById('editSceneBtn').addEventListener('click', enterSceneEditMode);

// ─── Panel Tab Switching ──────────────────────────────────────────────────────
function switchPanelTab(panel) {
    document.querySelectorAll('.panel-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.panel === panel);
    });
    document.getElementById('panelScene').classList.toggle('hidden', panel !== 'scene');
    document.getElementById('panelMarkers').classList.toggle('hidden', panel !== 'markers');
    document.getElementById('panelModal').classList.toggle('hidden', panel !== 'modal');
}

document.querySelectorAll('.panel-tab').forEach(tab => {
    tab.addEventListener('click', () => switchPanelTab(tab.dataset.panel));
});

// ─── Prefill Scene Panel ──────────────────────────────────────────────────────
function prefillScenePanel() {
    if (!editingScene) return;
    document.getElementById('pSceneTitle').value = editingScene.title || '';
    document.getElementById('pSceneCampus').value = editingScene.campus || 'east';
    document.getElementById('pSceneCategory').value = editingScene.category || 'buildings';

    // Sidebar label: only show for scenes that have one
    const sidebarField = document.getElementById('sidebarLabelField');
    const sidebarInput = document.getElementById('pSceneSidebarLabel');
    if (editingScene.sidebar_label) {
        sidebarField.style.display = '';
        sidebarInput.value = editingScene.sidebar_label;
    } else {
        sidebarField.style.display = 'none';
        sidebarInput.value = '';
    }

    const panoWrap = document.getElementById('panoPreviewWrap');
    document.getElementById('panoThumb').src = editingScene.panorama_url || '';
    panoWrap.style.display = editingScene.panorama_url ? '' : 'none';
}

// ─── Render Navigation Markers List ───────────────────────────────────────────
function renderNavMarkersList() {
    const container = document.getElementById('navMarkersList');
    const markers = editingScene?.navigation_markers || [];

    if (markers.length === 0) {
        container.innerHTML = `<p style="font-size:0.75rem;color:var(--light-grey);font-family:'Noto Sans',sans-serif;">No navigation markers</p>`;
        return;
    }

    container.innerHTML = markers.map(m => `
        <div class="mrow" data-marker-id="${m.id}">
            <div class="mrow-icon mrow-icon-upload" title="Click to replace icon">
                ${m.icon_url
                    ? `<img src="${m.icon_url}" alt="${m.id}" />`
                    : `<i class='bx bx-navigation' style="font-size:0.7rem;color:var(--dark-green);"></i>`
                }
                <input type="file" class="marker-icon-input" data-marker-id="${m.id}" data-marker-type="nav" accept=".webp" />
            </div>
            <div class="mrow-info">
                <div class="mrow-name">${m.tooltip || m.id}</div>
                <div class="mrow-coords">yaw: ${m.yaw?.toFixed(1) ?? '—'}, pitch: ${m.pitch?.toFixed(1) ?? '—'}</div>
            </div>
            <button class="mrow-btn mrow-view-btn" data-marker-id="${m.id}">View</button>
        </div>
    `).join('');

    // Wire view buttons
    container.querySelectorAll('.mrow-view-btn').forEach(btn => {
        btn.addEventListener('click', () => panToMarker(btn.dataset.markerId));
    });

    // Wire icon uploads
    container.querySelectorAll('.marker-icon-input').forEach(input => {
        input.addEventListener('click', e => e.stopPropagation());
        input.addEventListener('change', e => handleMarkerIconUpload(e, input.dataset.markerId, input.dataset.markerType));
    });
}

// ─── Render Info Markers List ─────────────────────────────────────────────────
function renderInfoMarkersList() {
    const container = document.getElementById('infoMarkersList');
    const markers = editingScene?.info_markers || [];

    if (markers.length === 0) {
        container.innerHTML = `<p style="font-size:0.75rem;color:var(--light-grey);font-family:'Noto Sans',sans-serif;">No info markers</p>`;
        return;
    }

    container.innerHTML = markers.map((m, i) => `
        <div class="mrow" data-marker-id="${m.id}">
            <div class="mrow-icon">
                <img src="${DEFAULT_INFO_ICON}" alt="info" />
            </div>
            <div class="mrow-info">
                <div class="mrow-name">${m.tooltip || m.id}</div>
                <div class="mrow-coords">yaw: ${m.yaw?.toFixed(1) ?? '—'}, pitch: ${m.pitch?.toFixed(1) ?? '—'}</div>
            </div>
            <button class="mrow-btn mrow-view-btn" data-marker-id="${m.id}">View</button>
        </div>
    `).join('');

    // Wire view buttons
    container.querySelectorAll('.mrow-view-btn').forEach(btn => {
        btn.addEventListener('click', () => panToMarker(btn.dataset.markerId));
    });
}

// ─── Pan to Marker in PSV Viewer ──────────────────────────────────────────────
function panToMarker(markerId) {
    if (!psvViewer || !psvMarkersPlugin) return;
    try {
        const marker = psvMarkersPlugin.getMarker(markerId);
        psvViewer.animate({
            yaw: marker.config.position.yaw,
            pitch: marker.config.position.pitch,
            zoom: 60,
            speed: '2rpm',
        });
    } catch(e) {}
}

// ─── Marker Icon Upload Handler ───────────────────────────────────────────────
function handleMarkerIconUpload(e, markerId, markerType) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.webp')) {
        showToast('error', 'Only .webp format is allowed for marker icons');
        e.target.value = '';
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showToast('error', 'Marker icon must be under 10 MB');
        e.target.value = '';
        return;
    }

    const img = new Image();
    img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.width !== 100 || img.height !== 100) {
            showToast('error', `Marker icon must be 100×100. Got ${img.width}×${img.height}`);
            return;
        }
        newMarkerIcons[markerId] = file;

        // Update thumbnail in marker row
        const row = document.querySelector(`.mrow[data-marker-id="${markerId}"] .mrow-icon`);
        if (row) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const existingImg = row.querySelector('img');
                const existingIcon = row.querySelector('i');
                if (existingImg) existingImg.src = ev.target.result;
                else if (existingIcon) {
                    existingIcon.remove();
                    const newImg = document.createElement('img');
                    newImg.src = ev.target.result;
                    newImg.alt = markerId;
                    row.insertBefore(newImg, row.querySelector('input'));
                }
            };
            reader.readAsDataURL(file);
        }

        // Update marker in PSV
        if (psvMarkersPlugin) {
            const blobUrl = URL.createObjectURL(file);
            try {
                psvMarkersPlugin.updateMarker({
                    id: markerId,
                    html: adminNavMarkerHTML(blobUrl),
                });
            } catch(e) {}
        }

        showToast('success', 'Icon updated — save to apply');
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
}

// ─── Prefill Modal Panel ──────────────────────────────────────────────────────
function prefillModalPanel() {
    if (!editingScene) return;

    const modal = editingScene.modal || {};

    // Title
    document.getElementById('modalTitle').value = modal.title || '';

    // Quill
    if (!quill) {
        quill = new Quill('#quillEditor', {
            theme: 'snow',
            placeholder: 'Write a description...',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['clean']
                ]
            }
        });
    }
    quill.root.innerHTML = modal.description || '';

    // Gallery
    renderGalleryGrid();

    // Audio
    const audioName = document.getElementById('sceneAudioName');
    const audioPreview = document.getElementById('sceneAudioPreview');
    if (modal.audio_url) {
        audioPreview.src = modal.audio_url;
        const fileName = modal.audio_url.split('/').pop();
        audioName.textContent = fileName || 'Audio file';
    } else {
        audioPreview.src = '';
        audioName.textContent = 'No audio';
    }
}

// ─── Gallery Grid ─────────────────────────────────────────────────────────────
function renderGalleryGrid() {
    const grid = document.getElementById('galleryGrid');
    const gallery = editingScene?.modal?.gallery || [];
    const visible = gallery.filter(url => !removedGalleryImages.includes(url));

    grid.innerHTML = '';

    visible.forEach(url => {
        const cell = document.createElement('div');
        cell.classList.add('gal-cell');
        cell.innerHTML = `
            <img src="${url}" alt="Gallery" />
            <button class="gal-remove" data-url="${url}"><i class='bx bx-x'></i></button>
        `;
        cell.querySelector('.gal-remove').addEventListener('click', (e) => {
            e.stopPropagation();
            removedGalleryImages.push(url);
            renderGalleryGrid();
        });
        grid.appendChild(cell);
    });

    // New files previews
    newGalleryFiles.forEach((file, idx) => {
        const cell = document.createElement('div');
        cell.classList.add('gal-cell');
        cell.style.borderColor = 'var(--green)';
        const reader = new FileReader();
        reader.onload = (ev) => {
            cell.innerHTML = `
                <img src="${ev.target.result}" alt="New" />
                <button class="gal-remove" data-idx="${idx}"><i class='bx bx-x'></i></button>
            `;
            cell.querySelector('.gal-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                newGalleryFiles.splice(idx, 1);
                renderGalleryGrid();
            });
        };
        reader.readAsDataURL(file);
        grid.appendChild(cell);
    });
}

// ─── Gallery Upload ───────────────────────────────────────────────────────────
document.getElementById('addGalleryBtn').addEventListener('click', () => {
    document.getElementById('galleryInput').click();
});
document.getElementById('galleryInput').addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(f => newGalleryFiles.push(f));
    renderGalleryGrid();
    e.target.value = '';
});

// ─── Panorama Upload / Replace ────────────────────────────────────────────────
document.getElementById('panoUploadArea').addEventListener('click', () => {
    document.getElementById('panoramaInput').click();
});
document.getElementById('panoramaInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.webp')) {
        showToast('error', 'Only .webp format is allowed');
        e.target.value = '';
        return;
    }

    if (file.size > 30 * 1024 * 1024) {
        showToast('error', 'Panorama must be under 30 MB');
        e.target.value = '';
        return;
    }

    const img = new Image();
    img.onload = () => {
        URL.revokeObjectURL(img.src);
        // No strict resolution check: allow any .webp under 30MB
        newPanoramaFile = file;
        const blobUrl = URL.createObjectURL(file);
        document.getElementById('panoThumb').src = blobUrl;
        document.getElementById('panoPreviewWrap').style.display = '';
        // Update the 360 viewer
        if (psvViewer) {
            psvViewer.setPanorama(blobUrl).catch(() => {});
        }
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
});

// ─── PSV 360 Viewer ───────────────────────────────────────────────────────────
function initPsvViewer() {
    if (psvViewer) { psvViewer.destroy(); psvViewer = null; psvMarkersPlugin = null; }

    const container = document.getElementById('psvViewer');
    if (!editingScene?.panorama_url) {
        container.innerHTML = '<div style="color:rgba(255,255,255,0.4);font-size:0.8rem;display:flex;align-items:center;justify-content:center;height:100%;font-family:Noto Sans,sans-serif;">No panorama</div>';
        return;
    }

    psvViewer = new Viewer({
        container,
        panorama: editingScene.panorama_url,
        navbar: false,
        moveSpeed: 2.0,
        moveInertia: true,
        touchmoveTwoFingers: true,
        mousewheelCtrlKey: true,
        defaultYaw: editingScene.initial_view?.yaw || 0,
        defaultPitch: editingScene.initial_view?.pitch || 0,
        defaultZoomLvl: 50,
        plugins: [
            [MarkersPlugin, {}],
        ],
    });

    psvViewer.addEventListener('ready', () => {
        psvMarkersPlugin = psvViewer.getPlugin(MarkersPlugin);
        addSceneMarkersToPsv(!isUnlocked);

        // Listen for marker drag
        psvMarkersPlugin.addEventListener('marker-moved', ({ marker, position }) => {
            updatedMarkerPositions[marker.id] = { yaw: position.yaw, pitch: position.pitch };
            // Update coords in the sidebar marker list
            const coordsEl = document.querySelector(`.mrow[data-marker-id="${marker.id}"] .mrow-coords`);
            if (coordsEl) {
                coordsEl.textContent = `yaw: ${position.yaw.toFixed(1)}, pitch: ${position.pitch.toFixed(1)}`;
            }
        });
    });
}

function adminNavMarkerHTML(iconUrl) {
    return `<div class="admin-circle-marker">
        <img src="${iconUrl}" alt="marker" />
    </div>`;
}

function adminInfoMarkerHTML(iconUrl) {
    return `<div class="admin-info-marker">
        <img src="${iconUrl}" alt="info marker" />
    </div>`;
}

const DEFAULT_INFO_ICON = 'https://tghodrmjcvuijdsgqbwj.supabase.co/storage/v1/object/public/virtual-tour/icons/info_modal/info_marker.png';

function addSceneMarkersToPsv(locked) {
    if (!psvMarkersPlugin || !editingScene) return;

    const navMarkers = editingScene.navigation_markers || [];
    const infoMarkers = editingScene.info_markers || [];

    navMarkers.forEach(m => {
        psvMarkersPlugin.addMarker({
            id: m.id,
            position: { yaw: m.yaw, pitch: m.pitch },
            html: adminNavMarkerHTML(m.icon_url || DEFAULT_INFO_ICON),
            size: { width: 60, height: 60 },
            anchor: 'center center',
            tooltip: m.tooltip || m.id,
            draggable: !locked,
        });
    });

    infoMarkers.forEach(m => {
        psvMarkersPlugin.addMarker({
            id: m.id,
            position: { yaw: m.yaw, pitch: m.pitch },
            html: adminInfoMarkerHTML(DEFAULT_INFO_ICON),
            size: { width: 50, height: 50 },
            anchor: 'center center',
            tooltip: m.tooltip || m.id,
            draggable: !locked,
        });
    });
}

// ─── PSV Fullscreen ───────────────────────────────────────────────────────────
document.getElementById('psvFullscreenBtn').addEventListener('click', () => {
    const psvZone = document.querySelector('.psv-view');
    if (!document.fullscreenElement) {
        psvZone.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen();
    }
});
document.addEventListener('fullscreenchange', () => {
    const btn = document.getElementById('psvFullscreenBtn');
    if (document.fullscreenElement) {
        btn.innerHTML = "<i class='bx bx-exit-fullscreen'></i>";
    } else {
        btn.innerHTML = "<i class='bx bx-fullscreen'></i>";
    }
    // Resize PSV viewer to fill fullscreen
    if (psvViewer) setTimeout(() => psvViewer.autoSize(), 100);
});

// ─── Audio Play / Replace ─────────────────────────────────────────────────────
document.getElementById('audioPlayBtn').addEventListener('click', () => {
    const audio = document.getElementById('sceneAudioPreview');
    if (!audio.src) return;
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
        audio.currentTime = 0;
    }
});
document.getElementById('replaceAudioBtn').addEventListener('click', () => {
    document.getElementById('sceneAudioInput').click();
});
document.getElementById('sceneAudioInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    newSceneAudioFile = file;

    const audio = document.getElementById('sceneAudioPreview');
    audio.src = URL.createObjectURL(file);
    document.getElementById('sceneAudioName').textContent = file.name;
    e.target.value = '';
});

// ─── Save Scene ───────────────────────────────────────────────────────────────
// ─── Helper: upload a file to the scene upload endpoint ───────────────────────
async function uploadSceneFile(sceneId, file, type, markerId, oldUrl) {
    const form = new FormData();
    form.append('file', file);
    let url = `/api/scenes/${sceneId}/upload?type=${encodeURIComponent(type)}`;
    if (markerId) url += `&markerId=${encodeURIComponent(markerId)}`;
    if (oldUrl) url += `&oldUrl=${encodeURIComponent(oldUrl)}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: form,
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed (${type})`);
    }
    const data = await res.json();
    return data.url;
}

document.getElementById('saveSceneBtn').addEventListener('click', async () => {
    if (!editingScene || !isUnlocked) {
        showToast('error', 'Please confirm editing first.');
        return;
    }

    await showLoading();
    try {
        const sceneId = editingScene._id;
        const updates = {};
        // Prepare updates object
        const newTitle = document.getElementById('pSceneTitle').value.trim();
        const newCampus = document.getElementById('pSceneCampus').value;
        const newCategory = document.getElementById('pSceneCategory').value;
        const newSidebarLabel = document.getElementById('pSceneSidebarLabel').value.trim();
        if (!newTitle) {
            showToast('error', 'Title is required.');
            hideLoading();
            return;
        }
        // ── Upload files first ────────────────────────────────────────────────
        // 1. Upload new logo if changed
        try {
            if (newLogo) {
                updates.logo_url = await uploadSettingsFile(newLogo, 'logo', settings.logo_url);
            }
            if (newLogoCollapsed) {
                updates.logo_collapsed_url = await uploadSettingsFile(newLogoCollapsed, 'logo_collapsed', settings.logo_collapsed_url);
            }
            // 2. Upload other assets...
            // (Continue with the rest of the upload logic)
            updates.sidebar_label = newSidebarLabel;

            // Panorama URL logic
            let panoramaUrl = editingScene.panorama_url;
            if (newPanoramaFile) {
                panoramaUrl = await uploadSceneFile(sceneId, newPanoramaFile, 'panorama', null, editingScene.panorama_url);
            }
            if (panoramaUrl) {
                updates.panorama_url = panoramaUrl;
            }
        } catch (err) {
            showToast('error', err.message || 'Failed to prepare scene updates.');
            hideLoading();
            return;
        }

        // ── Build markers with updated positions + icons ──────────────────────
        // Upload new marker icons if present and collect URLs
        const navMarkersRaw = editingScene.navigation_markers || [];
        const navMarkers = await Promise.all(navMarkersRaw.map(async m => {
            const updated = { ...m };
            const pos = updatedMarkerPositions[m.id];
            if (pos) { updated.yaw = pos.yaw; updated.pitch = pos.pitch; }
            if (newMarkerIcons && newMarkerIcons[m.id]) {
                try {
                    // Upload new icon and set URL
                    updated.icon_url = await uploadSceneFile(editingScene._id, newMarkerIcons[m.id], 'marker_icon', m.id, m.icon_url);
                } catch (err) {
                    console.error('Failed to upload marker icon for marker', m.id, err);
                    showToast('error', `Failed to upload icon for marker ${m.id}`);
                }
            }
            return updated;
        }));
        const infoMarkersRaw = editingScene.info_markers || [];
        const infoMarkers = infoMarkersRaw.map(m => {
            const updated = { ...m };
            const pos = updatedMarkerPositions[m.id];
            if (pos) { updated.yaw = pos.yaw; updated.pitch = pos.pitch; }
            return updated;
        });
        updates.navigation_markers = navMarkers;
        updates.info_markers = infoMarkers;

        // ── Save to DB ────────────────────────────────────────────────────────
        const res = await fetch(`/api/scenes/${sceneId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(updates)
        });

        const data = await res.json();
        if (!res.ok) {
            showToast('error', data.error || 'Failed to save scene.');
            return;
        }

        showToast('success', `${newTitle} updated successfully!`);

        // Refresh scene in local array
        const idx = allScenes.findIndex(s => s._id === sceneId);
        if (idx !== -1) allScenes[idx] = data;

        renderCards();
        closeEdit(true);
    } catch (err) {
        showToast('error', err.message || 'Failed to save scene.');
    } finally {
        hideLoading();
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

let settingsQuill = null;
let welcomeSnapshot = null;
let sidebarSnapshot = null;

function prefillSettings() {
    // Text fields
    document.getElementById('welcomeTitle').value = settings.welcome_title || '';
    document.getElementById('welcomeSubtitle').value = settings.welcome_subtitle || '';
    document.getElementById('welcomeBtnLabel').value = settings.welcome_btn_label || '';

    // Modal size fields
    document.getElementById('modalWidth').value = settings.welcome_modal_width || 600;
    document.getElementById('modalHeight').value = settings.welcome_modal_height || 400;

    // Quill for description
    if (!settingsQuill) {
        settingsQuill = new Quill('#settingsQuillEditor', {
            theme: 'snow',
            placeholder: 'Write a description...',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['clean']
                ]
            }
        });
        settingsQuill.enable(false);
        settingsQuill.on('text-change', updateWelcomePreview);
    }
    settingsQuill.root.innerHTML = settings.welcome_description || '';
    // Remove Quill's ql-blank class if there is actual content
    if (settings.welcome_description) {
        settingsQuill.root.classList.remove('ql-blank');
    }

    // Image previews
    setImgSrc('wpLogo', settings.welcome_logo_url);
    setImgSrc('logoPreview', settings.logo_url);
    setImgSrc('logoCollapsedPreview', settings.logo_collapsed_url);
    setImgSrc('iconBuildingsPreview', settings.icon_buildings_url);
    setImgSrc('iconFacilitiesPreview', settings.icon_facilities_url);
    setImgSrc('iconLandmarksPreview', settings.icon_landmarks_url);
    setImgSrc('iconGatesPreview', settings.icon_gates_url);
    setImgSrc('iconParkingPreview', settings.icon_parking_url);

    // Asset icons for media cards
    setImgSrc('assetIconBgm', settings.icon_bgm_url);
    setImgSrc('assetIconNarrative', settings.icon_narrative_url);
    setImgSrc('assetIconVideo', settings.icon_video_url);

    // Media file names + empty state toggling
    renderBgmTracks(settings.bgm_url);
    renderNarrationTrack(settings.narration_url);
    setMediaFileName('videoFileName', settings.video_url, 'No file set');

    toggleMediaState('bgmMediaBody', 'bgmEmptyState', settings.bgm_url);
    toggleMediaState('narrationMediaBody', 'narrationEmptyState', settings.narration_url);
    toggleMediaState('videoMediaBody', 'videoEmptyState', settings.video_url);

    // Media sources
    if (settings.video_url) document.getElementById('videoPlayer').src = settings.video_url;

    // Update live previews
    updateWelcomePreview();
    updateModalPreviewSize();
    updateSidebarPreview();

    // Live preview listeners (only once)
    if (!prefillSettings._listenersAdded) {
        document.getElementById('welcomeTitle').addEventListener('input', updateWelcomePreview);
        document.getElementById('welcomeSubtitle').addEventListener('input', updateWelcomePreview);
        document.getElementById('welcomeBtnLabel').addEventListener('input', updateWelcomePreview);
        document.getElementById('modalWidth').addEventListener('input', updateModalPreviewSize);
        document.getElementById('modalHeight').addEventListener('input', updateModalPreviewSize);
        initResizeHandles();
        prefillSettings._listenersAdded = true;
    }

    // Snapshots
    welcomeSnapshot = {
        welcome_title: settings.welcome_title || '',
        welcome_subtitle: settings.welcome_subtitle || '',
        welcome_description: settings.welcome_description || '',
        welcome_btn_label: settings.welcome_btn_label || '',
        welcome_modal_width: settings.welcome_modal_width || 600,
        welcome_modal_height: settings.welcome_modal_height || 400,
    };
    sidebarSnapshot = {
        logo_url: settings.logo_url || '',
        logo_collapsed_url: settings.logo_collapsed_url || '',
    };
}

function setImgSrc(id, url) {
    const el = document.getElementById(id);
    if (!el) return;
    const fallback = el.nextElementSibling;
    if (url) {
        el.src = url;
        el.style.display = '';
        if (fallback && fallback.classList.contains('stg-logo-fallback')) fallback.style.display = 'none';
    } else {
        el.removeAttribute('src');
        el.style.display = 'none';
        if (fallback && fallback.classList.contains('stg-logo-fallback')) fallback.style.display = 'flex';
    }
}

function setMediaFileName(id, url, fallback) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!url) { el.textContent = fallback; return; }
    // Handle comma-separated URLs (e.g. multiple BGM tracks)
    const urls = url.split(',');
    if (urls.length > 1) {
        el.textContent = urls.length + ' files loaded';
    } else {
        try { el.textContent = decodeURIComponent(url.split('/').pop()); }
        catch { el.textContent = url.split('/').pop(); }
    }
}

function toggleMediaState(bodyId, emptyId, url) {
    const body = document.getElementById(bodyId);
    const empty = document.getElementById(emptyId);
    if (!body || !empty) return;
    if (url) {
        body.classList.remove('hidden');
        empty.classList.add('hidden');
    } else {
        body.classList.add('hidden');
        empty.classList.remove('hidden');
    }
}

// ─── Live Preview Updates ─────────────────────────────────────────────────────
function updateWelcomePreview() {
    const titleVal = document.getElementById('welcomeTitle').value;
    const subtitleVal = document.getElementById('welcomeSubtitle').value;
    const btnLabelVal = document.getElementById('welcomeBtnLabel').value;

    const titleEl = document.getElementById('wpTitle');
    const subEl = document.getElementById('wpSub');
    const btnTextEl = document.getElementById('wpBtnText');
    const isEditing = !document.getElementById('welcomeCard').classList.contains('stg-locked');

    // Title placeholder
    if (titleVal) {
        titleEl.textContent = titleVal;
        titleEl.classList.remove('is-placeholder');
    } else if (isEditing) {
        titleEl.textContent = 'Write your title';
        titleEl.classList.add('is-placeholder');
    } else {
        titleEl.textContent = '';
        titleEl.classList.remove('is-placeholder');
    }

    // Subtitle placeholder
    if (subtitleVal) {
        subEl.textContent = subtitleVal;
        subEl.classList.remove('is-placeholder');
    } else if (isEditing) {
        subEl.textContent = 'Write your subtitle';
        subEl.classList.add('is-placeholder');
    } else {
        subEl.textContent = '';
        subEl.classList.remove('is-placeholder');
    }

    btnTextEl.textContent = btnLabelVal || 'Start Tour';

    // Description preview
    const descEl = document.getElementById('wpDesc');
    if (settingsQuill) {
        const html = settingsQuill.root.innerHTML;
        const isEmpty = !html || html === '<p><br></p>';
        const isEditing = !document.getElementById('welcomeCard').classList.contains('stg-locked');
        if (isEmpty && isEditing) {
            descEl.textContent = 'Write your description';
            descEl.classList.add('is-placeholder');
        } else if (isEmpty) {
            descEl.textContent = '';
            descEl.classList.remove('is-placeholder');
        } else {
            descEl.innerHTML = html;
            descEl.classList.remove('is-placeholder');
        }
    }
}

function updateSidebarPreview() {
    const spLogo = document.getElementById('spLogo');
    if (settings.logo_url) spLogo.src = settings.logo_url;

    // Collapsed logo
    const spLogoC = document.getElementById('spLogoCollapsed');
    if (spLogoC && settings.logo_collapsed_url) spLogoC.src = settings.logo_collapsed_url;

    // Category icons
    setSpIcon('spIconBuildings', settings.icon_buildings_url);
    setSpIcon('spIconFacilities', settings.icon_facilities_url);
    setSpIcon('spIconLandmarks', settings.icon_landmarks_url);
    setSpIcon('spIconGates', settings.icon_gates_url);
    setSpIcon('spIconParking', settings.icon_parking_url);

    // Collapsed category icons
    setSpIcon('spCIconBuildings', settings.icon_buildings_url);
    setSpIcon('spCIconFacilities', settings.icon_facilities_url);
    setSpIcon('spCIconLandmarks', settings.icon_landmarks_url);
    setSpIcon('spCIconGates', settings.icon_gates_url);
    setSpIcon('spCIconParking', settings.icon_parking_url);

    // Function button icons
    setSpIcon('spIconNarrative', settings.icon_narrative_url);
    setSpIcon('spIconVideo', settings.icon_video_url);
    setSpIcon('spIconBgm', settings.icon_bgm_url);

    // Collapsed function button icons
    setSpIcon('spCIconNarrative', settings.icon_narrative_url);
    setSpIcon('spCIconVideo', settings.icon_video_url);
    setSpIcon('spCIconBgm', settings.icon_bgm_url);

    // Dashboard
    setSpIcon('spIconDashboard', settings.dashboard_icon_url);
    const spDashLabel = document.getElementById('spDashboardLabel');
    if (spDashLabel) spDashLabel.textContent = settings.dashboard_label || 'Dashboard';
    setSpIcon('spCIconDashboard', settings.dashboard_icon_url);

    // Sidebar control
    setSpIcon('spIconControl', settings.icon_sb_control_url);
    setSpIcon('spCIconControl', settings.icon_sb_control_url);
}

function setSpIcon(id, url) {
    const el = document.getElementById(id);
    if (!el) return;
    if (url) { el.src = url; el.style.display = ''; }
    else { el.removeAttribute('src'); el.style.display = 'none'; }
}

// ─── Modal Preview Size ──────────────────────────────────────────────────────
const PREVIEW_SCALE = 0.55; // scale factor: VT real size → admin preview

function updateModalPreviewSize() {
    const w = parseInt(document.getElementById('modalWidth').value) || 600;
    const h = parseInt(document.getElementById('modalHeight').value) || 400;
    const modal = document.getElementById('wpModal');
    modal.style.width = (w * PREVIEW_SCALE) + 'px';
    modal.style.minHeight = (h * PREVIEW_SCALE) + 'px';
    modal.style.maxWidth = 'none';
}

// ─── Drag-to-Resize Handles ─────────────────────────────────────────────────
function initResizeHandles() {
    const modal = document.getElementById('wpModal');
    const handles = modal.querySelectorAll('.stg-resize-handle');
    const widthInput = document.getElementById('modalWidth');
    const heightInput = document.getElementById('modalHeight');
    let dragging = false;
    let startX, startY, startW, startH, dir;

    const cursorMap = {
        t: 'ns-resize', b: 'ns-resize',
        l: 'ew-resize', r: 'ew-resize',
        tl: 'nwse-resize', br: 'nwse-resize',
        tr: 'nesw-resize', bl: 'nesw-resize'
    };

    handles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dragging = true;
            dir = handle.dataset.dir;
            startX = e.clientX;
            startY = e.clientY;
            startW = modal.offsetWidth;
            startH = modal.offsetHeight;
            document.body.style.cursor = cursorMap[dir] || 'nwse-resize';
            document.body.style.userSelect = 'none';
        });
    });

    document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const minW = 200 * PREVIEW_SCALE;
        const minH = 150 * PREVIEW_SCALE;

        // Right side grows with positive dx
        if (dir === 'r' || dir === 'br' || dir === 'tr') {
            const newW = Math.max(minW, startW + dx);
            modal.style.width = newW + 'px';
            widthInput.value = Math.round(newW / PREVIEW_SCALE);
        }
        // Left side grows with negative dx
        if (dir === 'l' || dir === 'bl' || dir === 'tl') {
            const newW = Math.max(minW, startW - dx);
            modal.style.width = newW + 'px';
            widthInput.value = Math.round(newW / PREVIEW_SCALE);
        }
        // Bottom side grows with positive dy
        if (dir === 'b' || dir === 'br' || dir === 'bl') {
            const newH = Math.max(minH, startH + dy);
            modal.style.minHeight = newH + 'px';
            heightInput.value = Math.round(newH / PREVIEW_SCALE);
        }
        // Top side grows with negative dy
        if (dir === 't' || dir === 'tl' || dir === 'tr') {
            const newH = Math.max(minH, startH - dy);
            modal.style.minHeight = newH + 'px';
            heightInput.value = Math.round(newH / PREVIEW_SCALE);
        }
    });

    document.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });
}

// ─── Edit / Lock Toggle ──────────────────────────────────────────────────────
function enterEditMode(cardId) {
    const card = document.getElementById(cardId);
    card.classList.remove('stg-locked');
    card.querySelector('.stg-edit-btn').classList.add('hidden');
    card.querySelector('.cancel-btn').classList.remove('hidden');
    card.querySelector('.save-btn').classList.remove('hidden');

    // Enable inputs (form groups + size fields)
    card.querySelectorAll('.stg-form-group input, .stg-size-field input').forEach(i => i.disabled = false);

    // Enable Quill (welcome card only)
    if (cardId === 'welcomeCard' && settingsQuill) {
        settingsQuill.enable(true);
    }
}

function exitEditMode(cardId) {
    const card = document.getElementById(cardId);
    card.classList.add('stg-locked');
    card.querySelector('.stg-edit-btn').classList.remove('hidden');
    card.querySelector('.cancel-btn').classList.add('hidden');
    card.querySelector('.save-btn').classList.add('hidden');

    // Disable inputs (form groups + size fields)
    card.querySelectorAll('.stg-form-group input, .stg-size-field input').forEach(i => i.disabled = true);

    // Disable Quill (welcome card only)
    if (cardId === 'welcomeCard' && settingsQuill) {
        settingsQuill.enable(false);
    }
}

// ─── Welcome Card Edit / Cancel / Save ────────────────────────────────────────
document.getElementById('editWelcomeBtn').addEventListener('click', () => {
    enterEditMode('welcomeCard');
});

document.getElementById('cancelWelcomeBtn').addEventListener('click', () => {
    // Revert to snapshot
    if (welcomeSnapshot) {
        document.getElementById('welcomeTitle').value = welcomeSnapshot.welcome_title;
        document.getElementById('welcomeSubtitle').value = welcomeSnapshot.welcome_subtitle;
        document.getElementById('welcomeBtnLabel').value = welcomeSnapshot.welcome_btn_label;
        document.getElementById('modalWidth').value = welcomeSnapshot.welcome_modal_width;
        document.getElementById('modalHeight').value = welcomeSnapshot.welcome_modal_height;
        if (settingsQuill) settingsQuill.root.innerHTML = welcomeSnapshot.welcome_description;
    }
    updateWelcomePreview();
    updateModalPreviewSize();
    exitEditMode('welcomeCard');
});

document.getElementById('saveWelcomeBtn').addEventListener('click', async () => {
    await showLoading();
    try {
        const descContent = settingsQuill ? settingsQuill.root.innerHTML : '';
        const description = descContent === '<p><br></p>' ? '' : descContent;

        const updates = {
            welcome_title: document.getElementById('welcomeTitle').value.trim(),
            welcome_subtitle: document.getElementById('welcomeSubtitle').value.trim(),
            welcome_description: description,
            welcome_btn_label: document.getElementById('welcomeBtnLabel').value.trim(),
            welcome_modal_width: parseInt(document.getElementById('modalWidth').value) || 600,
            welcome_modal_height: parseInt(document.getElementById('modalHeight').value) || 400,
        };

        // Welcome Modal Logo upload (if changed)
        const welcomeLogoInput = document.getElementById('welcomeLogoInput');
        if (welcomeLogoInput && welcomeLogoInput.files && welcomeLogoInput.files[0]) {
            updates.welcome_logo_url = await uploadSettingsFile(welcomeLogoInput.files[0], 'welcome_logo', settings.welcome_logo_url);
        }

        const res = await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (!res.ok) {
            const data = await res.json();
            showToast('error', data.error || 'Failed to save.');
            return;
        }

        settings = await res.json();
        welcomeSnapshot = {
            welcome_title: settings.welcome_title || '',
            welcome_subtitle: settings.welcome_subtitle || '',
            welcome_description: settings.welcome_description || '',
            welcome_btn_label: settings.welcome_btn_label || '',
            welcome_modal_width: settings.welcome_modal_width || 600,
            welcome_modal_height: settings.welcome_modal_height || 400,
        };
        exitEditMode('welcomeCard');
        showToast('success', 'Welcome modal saved!');
        prefillSettings(); // Refresh UI with new URLs
    } catch (err) {
        showToast('error', 'Failed to save.');
    } finally {
        hideLoading();
    }
});

// ─── Sidebar Card Tabs ────────────────────────────────────────────────────────
document.querySelectorAll('.stg-sb-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.stg-sb-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.stg-sb-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// ─── Sidebar Card Edit / Cancel / Save ────────────────────────────────────────
document.getElementById('editSidebarBtn').addEventListener('click', () => {
    enterEditMode('sidebarCard');
});

document.getElementById('cancelSidebarBtn').addEventListener('click', () => {
    if (sidebarSnapshot) {
        setImgSrc('logoPreview', sidebarSnapshot.logo_url);
        setImgSrc('logoCollapsedPreview', sidebarSnapshot.logo_collapsed_url);
        setImgSrc('spLogo', sidebarSnapshot.logo_url);
        setImgSrc('spLogoCollapsed', sidebarSnapshot.logo_collapsed_url);
    }
    newLogo = null;
    newLogoCollapsed = null;
    exitEditMode('sidebarCard');
});

document.getElementById('saveSidebarBtn').addEventListener('click', async () => {
    await showLoading();
    try {
        // Currently logos are file uploads handled separately;
        // for now save triggers the lock and confirms
        const res = await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({})
        });

        if (!res.ok) {
            const data = await res.json();
            showToast('error', data.error || 'Failed to save.');
            return;
        }

        settings = await res.json();
        sidebarSnapshot = {
            logo_url: settings.logo_url || '',
            logo_collapsed_url: settings.logo_collapsed_url || '',
        };
        newLogo = null;
        newLogoCollapsed = null;
        exitEditMode('sidebarCard');
        showToast('success', 'Sidebar saved!');
    } catch (err) {
        showToast('error', 'Failed to save.');
    } finally {
        hideLoading();
    }
});

// ─── Upload Area Handlers ─────────────────────────────────────────────────────
function setupUploadArea(areaId, inputId, previewId, stateKey) {
    const area = document.getElementById(areaId);
    const input = document.getElementById(inputId);
    if (!area || !input) return;

    area.addEventListener('click', () => input.click());
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (stateKey === 'logo') newLogo = file;
        if (stateKey === 'logoCollapsed') newLogoCollapsed = file;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const preview = document.getElementById(previewId);
            if (preview) preview.src = ev.target.result;

            if (stateKey === 'logo') {
                document.getElementById('spLogo').src = ev.target.result;
            }
            if (stateKey === 'logoCollapsed') {
                document.getElementById('spLogoCollapsed').src = ev.target.result;
            }
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    });
}

setupUploadArea('logoUploadArea', 'logoInput', 'logoPreview', 'logo');
setupUploadArea('logoCollapsedUploadArea', 'logoCollapsedInput', 'logoCollapsedPreview', 'logoCollapsed');

// ─── Media Replace Buttons ────────────────────────────────────────────────────
function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function setupMediaReplace(btnId, inputId, stateKey, mediaId, nameId, sizeId, bodyId, emptyId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
        document.getElementById(inputId).click();
    });
    document.getElementById(inputId).addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (stateKey === 'narration') newNarration = file;
        if (stateKey === 'video') newVideo = file;

        const mediaEl = document.getElementById(mediaId);
        if (mediaEl) mediaEl.src = URL.createObjectURL(file);
        const nameEl = document.getElementById(nameId);
        if (nameEl) nameEl.textContent = file.name;
        const sizeEl = document.getElementById(sizeId);
        if (sizeEl) sizeEl.textContent = '· ' + formatFileSize(file.size);

        // Show body, hide empty state
        const body = document.getElementById(bodyId);
        const empty = document.getElementById(emptyId);
        if (body) body.classList.remove('hidden');
        if (empty) empty.classList.add('hidden');

        e.target.value = '';
    });
}

// Wire upload buttons in empty states to same file inputs
function setupUploadBtn(btnId, inputId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => document.getElementById(inputId).click());
}

// ─── BGM Playlist Logic ───────────────────────────────────────────────────────
function renderBgmTracks(urlString) {
    const list = document.getElementById('bgmTrackList');
    if (!list) return;
    list.innerHTML = '';
    newBgmTracks = [];

    if (urlString) {
        const urls = urlString.split(',').filter(Boolean);
        urls.forEach(u => {
            let name;
            try { name = decodeURIComponent(u.trim().split('/').pop()); }
            catch { name = u.trim().split('/').pop(); }
            newBgmTracks.push({ url: u.trim(), name });
        });
    }
    rebuildBgmList();
}

function rebuildBgmList() {
    const list = document.getElementById('bgmTrackList');
    if (!list) return;
    list.innerHTML = '';

    newBgmTracks.forEach((track, idx) => {
        const item = document.createElement('div');
        item.className = 'stg-track-item';

        const header = document.createElement('div');
        header.className = 'stg-track-item-header';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'stg-track-name';
        nameSpan.textContent = track.name;
        header.appendChild(nameSpan);

        const del = document.createElement('button');
        del.className = 'stg-track-delete';
        del.type = 'button';
        del.innerHTML = "<i class='bx bx-x'></i>";
        del.addEventListener('click', () => {
            newBgmTracks.splice(idx, 1);
            rebuildBgmList();
            if (newBgmTracks.length === 0) {
                toggleMediaState('bgmMediaBody', 'bgmEmptyState', null);
            }
        });
        header.appendChild(del);
        item.appendChild(header);

        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = track.url || (track.file ? URL.createObjectURL(track.file) : '');
        item.appendChild(audio);

        list.appendChild(item);
    });
}

// Add-track button
const addBgmBtn = document.getElementById('addBgmBtn');
if (addBgmBtn) {
    addBgmBtn.addEventListener('click', () => document.getElementById('bgmInput').click());
}
// BGM file input (multi-file)
const bgmInput = document.getElementById('bgmInput');
if (bgmInput) {
    bgmInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        files.forEach(f => newBgmTracks.push({ file: f, name: f.name }));
        rebuildBgmList();
        toggleMediaState('bgmMediaBody', 'bgmEmptyState', 'has-tracks');
        e.target.value = '';
    });
}

setupMediaReplace('replaceVideoBtn', 'videoInput', 'video', 'videoPlayer', 'videoFileName', 'videoFileSize', 'videoMediaBody', 'videoEmptyState');

// ─── Narration Track Rendering ────────────────────────────────────────────────
function renderNarrationTrack(url) {
    const list = document.getElementById('narrationTrackList');
    if (!list) return;
    list.innerHTML = '';
    if (!url) return;

    let name;
    try { name = decodeURIComponent(url.trim().split('/').pop()); }
    catch { name = url.trim().split('/').pop(); }

    const item = document.createElement('div');
    item.className = 'stg-track-item';

    const header = document.createElement('div');
    header.className = 'stg-track-item-header';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'stg-track-name';
    nameSpan.textContent = name;
    header.appendChild(nameSpan);
    item.appendChild(header);

    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = url;
    item.appendChild(audio);

    list.appendChild(item);
}

// Narration replace button
const replaceNarrationBtn = document.getElementById('replaceNarrationBtn');
if (replaceNarrationBtn) {
    replaceNarrationBtn.addEventListener('click', () => document.getElementById('narrationInput').click());
}
const narrationInput = document.getElementById('narrationInput');
if (narrationInput) {
    narrationInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        newNarration = file;

        const list = document.getElementById('narrationTrackList');
        if (list) {
            list.innerHTML = '';
            const item = document.createElement('div');
            item.className = 'stg-track-item';

            const header = document.createElement('div');
            header.className = 'stg-track-item-header';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'stg-track-name';
            nameSpan.textContent = file.name;
            header.appendChild(nameSpan);
            item.appendChild(header);

            const audio = document.createElement('audio');
            audio.controls = true;
            audio.src = URL.createObjectURL(file);
            item.appendChild(audio);

            list.appendChild(item);
        }
        toggleMediaState('narrationMediaBody', 'narrationEmptyState', 'has-file');
        e.target.value = '';
    });
}

setupUploadBtn('uploadBgmBtn', 'bgmInput');
setupUploadBtn('uploadNarrationBtn', 'narrationInput');
setupUploadBtn('uploadVideoBtn', 'videoInput');

// Category icon replace
function setupIconReplace(btnId, inputId, previewId) {
    document.getElementById(btnId).addEventListener('click', () => {
        document.getElementById(inputId).click();
    });
    document.getElementById(inputId).addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const preview = document.getElementById(previewId);
            if (preview) preview.src = ev.target.result;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    });
}

function setupIconUpload(areaId, inputId, previewId, spIconId, spCIconId) {
    const area = document.getElementById(areaId);
    const input = document.getElementById(inputId);
    if (!area || !input) return;
    area.addEventListener('click', () => input.click());
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const preview = document.getElementById(previewId);
            if (preview) preview.src = ev.target.result;
            // Update both expanded + collapsed sidebar previews
            const sp = document.getElementById(spIconId);
            if (sp) { sp.src = ev.target.result; sp.style.display = ''; }
            const spC = document.getElementById(spCIconId);
            if (spC) { spC.src = ev.target.result; spC.style.display = ''; }
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    });
}

setupIconUpload('iconBuildingsUploadArea', 'iconBuildingsInput', 'iconBuildingsPreview', 'spIconBuildings', 'spCIconBuildings');
setupIconUpload('iconFacilitiesUploadArea', 'iconFacilitiesInput', 'iconFacilitiesPreview', 'spIconFacilities', 'spCIconFacilities');
setupIconUpload('iconGatesUploadArea', 'iconGatesInput', 'iconGatesPreview', 'spIconGates', 'spCIconGates');
setupIconUpload('iconLandmarksUploadArea', 'iconLandmarksInput', 'iconLandmarksPreview', 'spIconLandmarks', 'spCIconLandmarks');
setupIconUpload('iconParkingUploadArea', 'iconParkingInput', 'iconParkingPreview', 'spIconParking', 'spCIconParking');

// ─── Init ─────────────────────────────────────────────────────────────────────
fetchAll();
