import showToast from './toast.js';
import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── State ────────────────────────────────────────────────────────────────────
let allBuildings = [];  // non-road buildings
let allRoads = [];      // road category only
let selectedBuildingId = null;
let currentImageIndex = 0;
let autoSwapInterval = null;
let listViewMode = 'card';   // 'card' | 'row'
let listSearchQuery = '';
let collapsedCategories = new Set();

// ─── Elements ─────────────────────────────────────────────────────────────────
const listView = document.getElementById('listView');
const mapView = document.getElementById('mapView');
const graphView = document.getElementById('graphView');
const listTabBtn = document.getElementById('listTabBtn');
const mapTabBtn = document.getElementById('mapTabBtn');
const graphTabBtn = document.getElementById('graphTabBtn');
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
} else if (savedView === 'graph') {
    graphTabBtn.classList.add('active');
    listTabBtn.classList.remove('active');
    graphView.classList.remove('hidden');
    listView.classList.add('hidden');
}

// ─── View Tabs ────────────────────────────────────────────────────────────────
listTabBtn.addEventListener('click', () => {
    listTabBtn.classList.add('active');
    mapTabBtn.classList.remove('active');
    graphTabBtn.classList.remove('active');
    listView.classList.remove('hidden');
    mapView.classList.add('hidden');
    graphView.classList.add('hidden');
});

mapTabBtn.addEventListener('click', () => {
    mapTabBtn.classList.add('active');
    listTabBtn.classList.remove('active');
    graphTabBtn.classList.remove('active');
    mapView.classList.remove('hidden');
    listView.classList.add('hidden');
    graphView.classList.add('hidden');
    renderMap();
});

graphTabBtn.addEventListener('click', () => {
    graphTabBtn.classList.add('active');
    listTabBtn.classList.remove('active');
    mapTabBtn.classList.remove('active');
    graphView.classList.remove('hidden');
    listView.classList.add('hidden');
    mapView.classList.add('hidden');
    renderGraph();
});

// ─── Add Building ─────────────────────────────────────────────────────────────
addBuildingBtn.addEventListener('click', () => {
    window.location.href = 'building-add.html';
});

// ─── List View Controls ───────────────────────────────────────────────────────
const cardViewBtn = document.getElementById('cardViewBtn');
const rowViewBtn = document.getElementById('rowViewBtn');
const listSearchInput = document.getElementById('listSearchInput');
const listSearchClear = document.getElementById('listSearchClear');

cardViewBtn.addEventListener('click', () => {
    listViewMode = 'card';
    cardViewBtn.classList.add('active');
    rowViewBtn.classList.remove('active');
    renderList();
});

rowViewBtn.addEventListener('click', () => {
    listViewMode = 'row';
    rowViewBtn.classList.add('active');
    cardViewBtn.classList.remove('active');
    renderList();
});

listSearchInput.addEventListener('input', () => {
    listSearchQuery = listSearchInput.value;
    listSearchClear.classList.toggle('hidden', listSearchQuery === '');
    renderList();
});

listSearchClear.addEventListener('click', () => {
    listSearchInput.value = '';
    listSearchQuery = '';
    listSearchClear.classList.add('hidden');
    listSearchInput.focus();
    renderList();
});

// ─── Fetch All Data ───────────────────────────────────────────────────────────
async function fetchBuildings() {
    await showLoading();
    try {
        const res = await fetch('/api/buildings', { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        allRoads = data.buildings.filter(b => b.category === 'road');
        allBuildings = data.buildings.filter(b => b.category !== 'road');
        buildingsCount.textContent = allBuildings.length;
        renderList();
        if (savedView === 'map') renderMap();
        if (savedView === 'graph') renderGraph();
    } catch (err) {
        showToast('error', 'Failed to load buildings.');
    } finally {
        hideLoading();
    }
}

// ─── Refresh Roads Only ───────────────────────────────────────────────────────
async function refreshRoads() {
    try {
        const res = await fetch('/api/buildings', { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        allRoads = data.buildings.filter(b => b.category === 'road');
        allBuildings = data.buildings.filter(b => b.category !== 'road');
        buildingsCount.textContent = allBuildings.length;
    } catch (err) {
        showToast('error', 'Failed to refresh roads.');
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
    const categoryIcons = {
        building: 'bx-building-house',
        facility: 'bx-server',
        gate: 'bx-door-open',
        landmark: 'bx-map-pin',
        parking: 'bx-car'
    };

    const q = listSearchQuery.trim().toLowerCase();

    listView.innerHTML = '';

    // When searching, flatten all results into one section
    if (q) {
        const matched = allBuildings.filter(b =>
            b.name.toLowerCase().includes(q) || b.dataId.toLowerCase().includes(q)
        );

        if (matched.length === 0) {
            listView.innerHTML = `
                <div class="list-empty-state">
                    <i class='bx bx-search-alt'></i>
                    <p>No buildings match "<strong>${q}</strong>"</p>
                </div>`;
            return;
        }

        const section = document.createElement('div');
        section.classList.add('category-section');
        section.innerHTML = `
            <div class="category-header">
                <h3 class="category-title"><i class='bx bx-search-alt'></i> Results (${matched.length})</h3>
            </div>`;
        const container = document.createElement('div');
        container.classList.add(listViewMode === 'card' ? 'cards-grid' : 'rows-list');
        matched.forEach(b => {
            container.appendChild(buildItem(b));
        });
        section.appendChild(container);
        listView.appendChild(section);
        return;
    }

    categories.forEach(cat => {
        const items = allBuildings.filter(b => b.category === cat);
        if (items.length === 0) return;

        const isCollapsed = collapsedCategories.has(cat);

        const section = document.createElement('div');
        section.classList.add('category-section');
        if (isCollapsed) section.classList.add('collapsed');

        const header = document.createElement('div');
        header.classList.add('category-header');
        header.innerHTML = `
            <h3 class="category-title">
                <i class='bx ${categoryIcons[cat]}'></i>
                ${categoryLabels[cat]}
                <span class="category-count">${items.length}</span>
            </h3>
            <button class="category-collapse-btn" title="${isCollapsed ? 'Expand' : 'Collapse'}">
                <i class='bx ${isCollapsed ? 'bx-chevron-down' : 'bx-chevron-up'}'></i>
            </button>`;

        header.addEventListener('click', () => {
            if (collapsedCategories.has(cat)) {
                collapsedCategories.delete(cat);
            } else {
                collapsedCategories.add(cat);
            }
            renderList();
        });

        const container = document.createElement('div');
        container.classList.add(listViewMode === 'card' ? 'cards-grid' : 'rows-list');
        container.classList.add('category-body');

        items.forEach(b => {
            container.appendChild(buildItem(b));
        });

        section.appendChild(header);
        section.appendChild(container);
        listView.appendChild(section);
    });
}

function buildItem(b) {
    if (listViewMode === 'card') {
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
            </div>`;
        card.addEventListener('click', () => openViewModal(b));
        return card;
    } else {
        const row = document.createElement('div');
        row.classList.add('building-row');
        if (!b.isVisible) row.classList.add('card-hidden');
        row.innerHTML = `
            <div class="row-thumb">
                ${b.images && b.images.length > 0
                    ? `<img src="${b.images[0]}" alt="${b.name}" />`
                    : `<div class="row-thumb-placeholder"><i class='bx bx-building'></i></div>`
                }
            </div>
            <div class="row-info">
                <p class="row-name">${b.name}</p>
                <p class="row-dataid">${b.dataId}</p>
            </div>
            <div class="row-meta">
                ${!b.isVisible ? `<span class="row-badge hidden-badge"><i class='bx bx-hide'></i> Hidden</span>` : ''}
            </div>
            <i class='bx bx-chevron-right row-arrow'></i>`;
        row.addEventListener('click', () => openViewModal(b));
        return row;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ZOOM / PAN HELPER ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function initZoomPan(svg) {
    const VIEWBOX_W = 1920;
    const VIEWBOX_H = 1080;
    const MIN_SCALE = 0.5;
    const MAX_SCALE = 8;

    let scale = 1;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let panStart = { x: 0, y: 0 };

    function applyTransform() {
        svg.setAttribute('viewBox', `${-panX / scale} ${-panY / scale} ${VIEWBOX_W / scale} ${VIEWBOX_H / scale}`);
    }

    svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * delta));
        const svgRect = svg.getBoundingClientRect();
        const mouseX = e.clientX - svgRect.left;
        const mouseY = e.clientY - svgRect.top;
        panX = mouseX - (mouseX - panX) * (newScale / scale);
        panY = mouseY - (mouseY - panY) * (newScale / scale);
        scale = newScale;
        applyTransform();
    }, { passive: false });

    svg.addEventListener('mousedown', (e) => {
        if (e.button === 1 || e.altKey) {
            e.preventDefault();
            isPanning = true;
            panStart = { x: e.clientX - panX, y: e.clientY - panY };
            svg.style.cursor = 'grabbing';
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        panX = e.clientX - panStart.x;
        panY = e.clientY - panStart.y;
        applyTransform();
    });

    window.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            svg.style.cursor = '';
        }
    });

    svg.addEventListener('contextmenu', (e) => e.preventDefault());
    applyTransform();

    return function getSVGCoords(e) {
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
        return { x: Math.round(svgP.x), y: Math.round(svgP.y) };
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAP VIEW ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

let mapZoomInitialized = false;

function renderMap() {
    const svg = document.getElementById('campusMap');
    svg.innerHTML = '';
    const ns = 'http://www.w3.org/2000/svg';

    // ── Roads (from DB, non-interactive) ──
    allRoads.forEach(r => {
        if (!r.shape) return;
        let elem;
        if (r.shape.type === 'rect') {
            elem = document.createElementNS(ns, 'rect');
            elem.setAttribute('x', r.shape.x);
            elem.setAttribute('y', r.shape.y);
            elem.setAttribute('width', r.shape.width);
            elem.setAttribute('height', r.shape.height);
            if (r.shape.rotate) {
                const cx = r.shape.x + r.shape.width / 2;
                const cy = r.shape.y + r.shape.height / 2;
                elem.setAttribute('transform', `rotate(${r.shape.rotate}, ${cx}, ${cy})`);
            }
        } else if (r.shape.type === 'ellipse') {
            elem = document.createElementNS(ns, 'ellipse');
            elem.setAttribute('cx', r.shape.cx);
            elem.setAttribute('cy', r.shape.cy);
            elem.setAttribute('rx', r.shape.rx);
            elem.setAttribute('ry', r.shape.ry);
        }
        if (!elem) return;
        elem.classList.add('road');
        svg.appendChild(elem);
    });

    // ── Buildings (interactive) ──
    allBuildings.forEach(b => {
        if (!b.shape) return;
        let elem;
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

    if (!mapZoomInitialized) {
        initZoomPan(svg);
        mapZoomInitialized = true;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── GRAPH VIEW ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

let graphNodes = [];
let graphEdges = [];
let graphMode = 'node';
let selectedNodeId = null;
let edgeType = 'both';      // 'pedestrian' | 'vehicle' | 'both'
let edgeOneWay = false;     // only relevant when edgeType is 'vehicle' or 'both'
let graphInitialized = false;
let graphZoomInitialized = false;
let getGraphSVGCoords = null;

// ─── Undo / Dirty State ───────────────────────────────────────────────────────
let undoStack = [];         // array of snapshots { nodes, edges }
let savedSnapshot = null;   // deep copy of last saved state
let isDirty = false;

// ─── Road Drawing State ───────────────────────────────────────────────────────
let isDrawingRoad = false;
let roadDrawStart = null;
let roadPreviewElem = null;
let pendingRoad = null;   // { x, y, width, height, rotate } — drawn but not saved
let roadDragElem = null;  // SVG elem for the pending road (draggable)
let isMovingRoad = false;
let roadMoveOffsetX = 0;
let roadMoveOffsetY = 0;

// ─── Graph Elements ───────────────────────────────────────────────────────────
const graphMapSvg = document.getElementById('graphMap');
const graphStatus = document.getElementById('graphStatus');
const saveGraphBtn = document.getElementById('saveGraphBtn');
const undoGraphBtn = document.getElementById('undoGraphBtn');
const modeNoSelectBtn = document.getElementById('modeNoSelectBtn');
const modeNodeBtn = document.getElementById('modeNodeBtn');
const modeEdgeBtn = document.getElementById('modeEdgeBtn');
const modeAssignBtn = document.getElementById('modeAssignBtn');
const modeDeleteBtn = document.getElementById('modeDeleteBtn');
const modeRoadBtn = document.getElementById('modeRoadBtn');
const edgeOptions = document.getElementById('edgeOptions');
const edgePedestrianBtn = document.getElementById('edgePedestrianBtn');
const edgeVehicleBtn = document.getElementById('edgeVehicleBtn');
const edgeBothBtn = document.getElementById('edgeBothBtn');
const edgeDirectionToggle = document.getElementById('edgeDirectionToggle');
const edgeTwoWayBtn = document.getElementById('edgeTwoWayBtn');
const edgeOneWayBtn = document.getElementById('edgeOneWayBtn');
const roadOptions = document.getElementById('roadOptions');
const roadNameInput = document.getElementById('roadNameInput');
const roadDataIdInput = document.getElementById('roadDataIdInput');
const roadWidthInput = document.getElementById('roadWidthInput');
const roadHeightInput = document.getElementById('roadHeightInput');
const roadRotateInput = document.getElementById('roadRotateInput');
const roadApplyBtn = document.getElementById('roadApplyBtn');
const roadSaveBtn = document.getElementById('roadSaveBtn');
const roadCancelBtn = document.getElementById('roadCancelBtn');

// ─── Mode Switcher ────────────────────────────────────────────────────────────
function setGraphMode(mode) {
    graphMode = mode;
    selectedNodeId = null;
    isDrawingRoad = false;
    roadDrawStart = null;
    if (roadPreviewElem) { roadPreviewElem.remove(); roadPreviewElem = null; }

    [modeNoSelectBtn, modeNodeBtn, modeEdgeBtn, modeAssignBtn, modeDeleteBtn, modeRoadBtn]
        .forEach(b => b.classList.remove('active'));
    edgeOptions.classList.add('hidden');
    roadOptions.classList.add('hidden');

    if (mode === 'noselect') {
        modeNoSelectBtn.classList.add('active');
        graphStatus.textContent = 'No Select — freely pan and zoom without triggering actions';
        graphMapSvg.style.cursor = 'default';
    } else if (mode === 'node') {
        modeNodeBtn.classList.add('active');
        graphStatus.textContent = 'Click anywhere on the map to place a node';
        graphMapSvg.style.cursor = 'crosshair';
    } else if (mode === 'edge') {
        modeEdgeBtn.classList.add('active');
        graphStatus.textContent = 'Click a node to start an edge';
        edgeOptions.classList.remove('hidden');
        graphMapSvg.style.cursor = 'default';
    } else if (mode === 'assign') {
        modeAssignBtn.classList.add('active');
        graphStatus.textContent = 'Click a node, then click a building to assign it';
        graphMapSvg.style.cursor = 'default';
    } else if (mode === 'delete') {
        modeDeleteBtn.classList.add('active');
        graphStatus.textContent = 'Click a node, edge, or road to delete it';
        graphMapSvg.style.cursor = 'default';
    } else if (mode === 'road') {
        modeRoadBtn.classList.add('active');
        roadOptions.classList.remove('hidden');
        graphMapSvg.style.cursor = 'crosshair';
        if (pendingRoad) {
            graphStatus.textContent = 'Road drawn. Drag to reposition, adjust dimensions, then save.';
            showRoadControls(true);
        } else {
            graphStatus.textContent = 'Click and drag on the map to draw a road';
            showRoadControls(false);
        }
    }
    saveGraphBtn.style.display = mode === 'road' ? 'none' : 'flex';
    undoGraphBtn.style.display = mode === 'road' ? 'none' : 'flex';
    redrawGraph();
}

// Show/hide dimension inputs + save/cancel based on whether road is drawn
function showRoadControls(hasPending) {
    const dimGroup = document.getElementById('roadDimGroup');
    if (dimGroup) dimGroup.style.display = hasPending ? 'flex' : 'none';
    if (roadApplyBtn) roadApplyBtn.style.display = hasPending ? 'flex' : 'none';
    if (roadSaveBtn) roadSaveBtn.style.display = hasPending ? 'flex' : 'none';
    if (roadCancelBtn) roadCancelBtn.style.display = hasPending ? 'flex' : 'none';
}

modeNoSelectBtn.addEventListener('click', () => setGraphMode('noselect'));
modeNodeBtn.addEventListener('click', () => setGraphMode('node'));
modeEdgeBtn.addEventListener('click', () => setGraphMode('edge'));
modeAssignBtn.addEventListener('click', () => setGraphMode('assign'));
modeDeleteBtn.addEventListener('click', () => setGraphMode('delete'));
modeRoadBtn.addEventListener('click', () => setGraphMode('road'));

// ─── Edge Type + Direction Buttons ───────────────────────────────────────────
function updateEdgeDirectionVisibility() {
    // Pedestrian is always two-way — hide the toggle
    if (edgeType === 'pedestrian') {
        edgeDirectionToggle.classList.add('hidden');
        edgeOneWay = false;
    } else {
        edgeDirectionToggle.classList.remove('hidden');
    }
}

edgePedestrianBtn.addEventListener('click', () => {
    edgeType = 'pedestrian';
    edgeOneWay = false;
    [edgePedestrianBtn, edgeVehicleBtn, edgeBothBtn].forEach(b => b.classList.remove('active'));
    edgePedestrianBtn.classList.add('active');
    updateEdgeDirectionVisibility();
});
edgeVehicleBtn.addEventListener('click', () => {
    edgeType = 'vehicle';
    [edgePedestrianBtn, edgeVehicleBtn, edgeBothBtn].forEach(b => b.classList.remove('active'));
    edgeVehicleBtn.classList.add('active');
    updateEdgeDirectionVisibility();
});
edgeBothBtn.addEventListener('click', () => {
    edgeType = 'both';
    [edgePedestrianBtn, edgeVehicleBtn, edgeBothBtn].forEach(b => b.classList.remove('active'));
    edgeBothBtn.classList.add('active');
    updateEdgeDirectionVisibility();
});
edgeTwoWayBtn.addEventListener('click', () => {
    edgeOneWay = false;
    edgeTwoWayBtn.classList.add('active');
    edgeOneWayBtn.classList.remove('active');
});
edgeOneWayBtn.addEventListener('click', () => {
    edgeOneWay = true;
    edgeOneWayBtn.classList.add('active');
    edgeTwoWayBtn.classList.remove('active');
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateNodeId() {
    return 'node_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function calcWeight(n1, n2) {
    return Math.round(Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2)));
}

// ─── Undo / Dirty Helpers ─────────────────────────────────────────────────────
function snapshot() {
    return JSON.stringify({ nodes: graphNodes, edges: graphEdges });
}

function pushUndo() {
    undoStack.push(snapshot());
    markDirty();
}

function markDirty() {
    isDirty = true;
    saveGraphBtn.disabled = false;
    undoGraphBtn.disabled = false;
}

function markClean() {
    isDirty = false;
    undoStack = [];
    saveGraphBtn.disabled = true;
    undoGraphBtn.disabled = true;
}

undoGraphBtn.addEventListener('click', () => {
    if (undoStack.length === 0) return;
    const prev = JSON.parse(undoStack.pop());
    graphNodes = prev.nodes;
    graphEdges = prev.edges;
    selectedNodeId = null;
    // If we've undone back to the saved state, mark clean
    if (undoStack.length === 0 && savedSnapshot && snapshot() === savedSnapshot) {
        markClean();
    } else {
        // Still dirty but update button state
        saveGraphBtn.disabled = false;
        undoGraphBtn.disabled = undoStack.length === 0;
    }
    redrawGraph();
});

// ─── Render Pending Road ──────────────────────────────────────────────────────
function renderPendingRoad() {
    if (roadDragElem) { roadDragElem.remove(); roadDragElem = null; }
    if (!pendingRoad) return;

    const ns = 'http://www.w3.org/2000/svg';
    roadDragElem = document.createElementNS(ns, 'rect');
    roadDragElem.setAttribute('x', pendingRoad.x);
    roadDragElem.setAttribute('y', pendingRoad.y);
    roadDragElem.setAttribute('width', pendingRoad.width);
    roadDragElem.setAttribute('height', pendingRoad.height);
    if (pendingRoad.rotate) {
        const cx = pendingRoad.x + pendingRoad.width / 2;
        const cy = pendingRoad.y + pendingRoad.height / 2;
        roadDragElem.setAttribute('transform', `rotate(${pendingRoad.rotate}, ${cx}, ${cy})`);
    }
    roadDragElem.classList.add('road-pending');
    roadDragElem.style.cursor = 'grab';
    graphMapSvg.appendChild(roadDragElem);

    roadDragElem.addEventListener('mousedown', (e) => {
        if (e.altKey) return;
        e.stopPropagation();
        isMovingRoad = true;
        const coords = getGraphSVGCoords(e);
        roadMoveOffsetX = coords.x - pendingRoad.x;
        roadMoveOffsetY = coords.y - pendingRoad.y;
        roadDragElem.style.cursor = 'grabbing';
    });
}

// ─── Render Graph ─────────────────────────────────────────────────────────────
async function renderGraph() {
    if (!graphInitialized) {
        await fetchGraph();
        graphInitialized = true;
    }

    redrawGraph();

    if (!graphZoomInitialized) {
        getGraphSVGCoords = initZoomPan(graphMapSvg);
        graphZoomInitialized = true;
        initRoadDrawing();
        initNodeDragging();
    }
}

async function fetchGraph() {
    try {
        const res = await fetch('/api/mapgraph', { headers: { 'Accept': 'application/json' } });
        if (res.ok) {
            const data = await res.json();
            graphNodes = data.nodes || [];
            graphEdges = data.edges || [];
        }
    } catch (err) {
        graphNodes = [];
        graphEdges = [];
    }
    savedSnapshot = snapshot();
    markClean();
}

// ─── Road Drawing ─────────────────────────────────────────────────────────────
function initRoadDrawing() {
    const ns = 'http://www.w3.org/2000/svg';

    graphMapSvg.addEventListener('mousedown', (e) => {
        if (graphMode !== 'road') return;
        if (e.button !== 0 || e.altKey) return;
        if (isMovingRoad) return;
        if (roadDragElem && e.target === roadDragElem) return;

        // Clear any pending road on new draw
        if (pendingRoad) {
            pendingRoad = null;
            if (roadDragElem) { roadDragElem.remove(); roadDragElem = null; }
            showRoadControls(false);
        }

        const coords = getGraphSVGCoords(e);
        roadDrawStart = coords;
        isDrawingRoad = true;

        roadPreviewElem = document.createElementNS(ns, 'rect');
        roadPreviewElem.setAttribute('x', coords.x);
        roadPreviewElem.setAttribute('y', coords.y);
        roadPreviewElem.setAttribute('width', 0);
        roadPreviewElem.setAttribute('height', 0);
        roadPreviewElem.classList.add('road-preview');
        graphMapSvg.appendChild(roadPreviewElem);
    });

    graphMapSvg.addEventListener('mousemove', (e) => {
        // Drawing preview
        if (isDrawingRoad && roadPreviewElem && roadDrawStart) {
            const coords = getGraphSVGCoords(e);
            const x = Math.min(coords.x, roadDrawStart.x);
            const y = Math.min(coords.y, roadDrawStart.y);
            const w = Math.abs(coords.x - roadDrawStart.x);
            const h = Math.abs(coords.y - roadDrawStart.y);
            roadPreviewElem.setAttribute('x', x);
            roadPreviewElem.setAttribute('y', y);
            roadPreviewElem.setAttribute('width', w);
            roadPreviewElem.setAttribute('height', h);
            graphStatus.textContent = `w:${Math.round(w)} h:${Math.round(h)}`;
        }

        // Moving pending road
        if (isMovingRoad && pendingRoad && roadDragElem) {
            const coords = getGraphSVGCoords(e);
            pendingRoad.x = Math.round(coords.x - roadMoveOffsetX);
            pendingRoad.y = Math.round(coords.y - roadMoveOffsetY);
            roadDragElem.setAttribute('x', pendingRoad.x);
            roadDragElem.setAttribute('y', pendingRoad.y);
            if (pendingRoad.rotate) {
                const cx = pendingRoad.x + pendingRoad.width / 2;
                const cy = pendingRoad.y + pendingRoad.height / 2;
                roadDragElem.setAttribute('transform', `rotate(${pendingRoad.rotate}, ${cx}, ${cy})`);
            }
            graphStatus.textContent = `Position: x:${pendingRoad.x} y:${pendingRoad.y}`;
        }
    });

    graphMapSvg.addEventListener('mouseup', (e) => {
        // Finish drawing
        if (isDrawingRoad && roadDrawStart && e.button === 0) {
            const coords = getGraphSVGCoords(e);
            const x = Math.min(coords.x, roadDrawStart.x);
            const y = Math.min(coords.y, roadDrawStart.y);
            const w = Math.abs(coords.x - roadDrawStart.x);
            const h = Math.abs(coords.y - roadDrawStart.y);

            isDrawingRoad = false;
            roadDrawStart = null;
            if (roadPreviewElem) { roadPreviewElem.remove(); roadPreviewElem = null; }

            if (w < 5 && h < 5) {
                graphStatus.textContent = 'Click and drag on the map to draw a road';
                return;
            }

            pendingRoad = { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h), rotate: 0 };
            if (roadWidthInput) roadWidthInput.value = pendingRoad.width;
            if (roadHeightInput) roadHeightInput.value = pendingRoad.height;
            if (roadRotateInput) roadRotateInput.value = 0;

            renderPendingRoad();
            showRoadControls(true);
            graphStatus.textContent = 'Road drawn. Drag to reposition, adjust dimensions, then save.';
        }

        // Finish moving
        if (isMovingRoad) {
            isMovingRoad = false;
            if (roadDragElem) roadDragElem.style.cursor = 'grab';
            graphStatus.textContent = 'Road moved. Adjust dimensions or save.';
        }
    });

    // Apply dimensions
    if (roadApplyBtn) {
        roadApplyBtn.addEventListener('click', () => {
            if (!pendingRoad) return;
            pendingRoad.width = Math.max(1, parseInt(roadWidthInput.value) || pendingRoad.width);
            pendingRoad.height = Math.max(1, parseInt(roadHeightInput.value) || pendingRoad.height);
            pendingRoad.rotate = parseFloat(roadRotateInput.value) || 0;
            renderPendingRoad();
            graphStatus.textContent = `Road: w:${pendingRoad.width} h:${pendingRoad.height} rotate:${pendingRoad.rotate}°`;
        });
    }

    // Save road
    if (roadSaveBtn) {
        roadSaveBtn.addEventListener('click', async () => {
            if (!pendingRoad) return;
            const name = roadNameInput.value.trim();
            const dataId = roadDataIdInput.value.trim();
            if (!name) { showToast('error', 'Please enter a Road Name.'); return; }
            if (!dataId) { showToast('error', 'Please enter a Road ID.'); return; }

            await showLoading();
            try {
                const shape = {
                    type: 'rect',
                    x: pendingRoad.x,
                    y: pendingRoad.y,
                    width: pendingRoad.width,
                    height: pendingRoad.height
                };
                if (pendingRoad.rotate) shape.rotate = pendingRoad.rotate;

                const res = await fetch('/api/buildings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ name, dataId, category: 'road', shape })
                });
                const data = await res.json();
                if (!res.ok) {
                    showToast('error', data.error || 'Failed to save road.');
                } else {
                    showToast('success', `Road "${name}" saved!`);
                    pendingRoad = null;
                    if (roadDragElem) { roadDragElem.remove(); roadDragElem = null; }
                    roadNameInput.value = '';
                    roadDataIdInput.value = '';
                    if (roadWidthInput) roadWidthInput.value = '';
                    if (roadHeightInput) roadHeightInput.value = '';
                    if (roadRotateInput) roadRotateInput.value = '0';
                    showRoadControls(false);
                    graphStatus.textContent = 'Road saved! Click and drag to draw another.';
                    await refreshRoads();
                    redrawGraph();
                }
            } catch (err) {
                showToast('error', 'Failed to save road.');
            } finally {
                hideLoading();
            }
        });
    }

    // Cancel
    if (roadCancelBtn) {
        roadCancelBtn.addEventListener('click', () => {
            pendingRoad = null;
            if (roadDragElem) { roadDragElem.remove(); roadDragElem = null; }
            roadNameInput.value = '';
            roadDataIdInput.value = '';
            if (roadWidthInput) roadWidthInput.value = '';
            if (roadHeightInput) roadHeightInput.value = '';
            if (roadRotateInput) roadRotateInput.value = '0';
            showRoadControls(false);
            graphStatus.textContent = 'Cancelled. Click and drag to draw a road.';
        });
    }
}

// ─── Node Dragging ────────────────────────────────────────────────────────────
function initNodeDragging() {
    let isDraggingNode = false;
    let draggingNodeId = null;
    let nodeDragOffsetX = 0;
    let nodeDragOffsetY = 0;

    graphMapSvg.addEventListener('mousedown', (e) => {
        if (graphMode !== 'node') return;
        if (e.button !== 0 || e.altKey) return;
        if (!e.target.classList.contains('graph-node')) { return };

        isDraggingNode = true;
        draggingNodeId = e.target.dataset.nodeId;
        const coords = getGraphSVGCoords(e);
        const node = graphNodes.find(n => n.id === draggingNodeId);
        nodeDragOffsetX = coords.x - node.x;
        nodeDragOffsetY = coords.y - node.y;
        pushUndo(); // snapshot before drag starts
        e.stopPropagation();
    });

    graphMapSvg.addEventListener('mousemove', (e) => {
        if (!isDraggingNode || !draggingNodeId) return;
        const coords = getGraphSVGCoords(e);
        const node = graphNodes.find(n => n.id === draggingNodeId);
        if (!node) return;
        node.x = Math.round(coords.x - nodeDragOffsetX);
        node.y = Math.round(coords.y - nodeDragOffsetY);
        graphStatus.textContent = `Node: (${node.x}, ${node.y})`;
        redrawGraph();
    });

    graphMapSvg.addEventListener('mouseup', () => {
        isDraggingNode = false;
        draggingNodeId = null;
    });

    graphMapSvg.addEventListener('mousemove', (e) => {
        if (isDraggingNode) return;
        if (graphMode !== 'node') return;
        if (!e.target.classList.contains('graph-node')) {
            const coords = getGraphSVGCoords(e);
            graphStatus.textContent = `Map position: (${coords.x}, ${coords.y})`;
        }
    });
}

// ─── Full SVG Redraw ──────────────────────────────────────────────────────────
function redrawGraph() {
    const ns = 'http://www.w3.org/2000/svg';
    graphMapSvg.innerHTML = '';
    roadDragElem = null; // reset since innerHTML wipes it

    // ── Defs ──
    const defs = document.createElementNS(ns, 'defs');
    defs.innerHTML = `
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" class="graph-edge-arrow" />
        </marker>
    `;
    graphMapSvg.appendChild(defs);

    // ── Grid Lines ──
    const gridSize = 40;
    const gridGroup = document.createElementNS(ns, 'g');
    gridGroup.classList.add('graph-grid');
    for (let x = 0; x <= 1920; x += gridSize) {
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', x); line.setAttribute('y1', 0);
        line.setAttribute('x2', x); line.setAttribute('y2', 1080);
        gridGroup.appendChild(line);
    }
    for (let y = 0; y <= 1080; y += gridSize) {
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', 0); line.setAttribute('y1', y);
        line.setAttribute('x2', 1920); line.setAttribute('y2', y);
        gridGroup.appendChild(line);
    }
    graphMapSvg.appendChild(gridGroup);

    // ── Roads ──
    allRoads.forEach(r => {
        if (!r.shape) return;
        let elem;
        if (r.shape.type === 'rect') {
            elem = document.createElementNS(ns, 'rect');
            elem.setAttribute('x', r.shape.x);
            elem.setAttribute('y', r.shape.y);
            elem.setAttribute('width', r.shape.width);
            elem.setAttribute('height', r.shape.height);
            if (r.shape.rotate) {
                const cx = r.shape.x + r.shape.width / 2;
                const cy = r.shape.y + r.shape.height / 2;
                elem.setAttribute('transform', `rotate(${r.shape.rotate}, ${cx}, ${cy})`);
            }
        } else if (r.shape.type === 'ellipse') {
            elem = document.createElementNS(ns, 'ellipse');
            elem.setAttribute('cx', r.shape.cx); elem.setAttribute('cy', r.shape.cy);
            elem.setAttribute('rx', r.shape.rx); elem.setAttribute('ry', r.shape.ry);
        }
        if (!elem) return;
        elem.classList.add('graph-road');
        elem.dataset.roadId = r._id;
        elem.dataset.roadName = r.name;
        if (graphMode === 'delete') {
            elem.style.cursor = 'pointer';
            elem.style.pointerEvents = 'all';
            elem.addEventListener('click', (e) => {
                if (e.target.classList.contains('graph-edge')) return;
                if (e.target.tagName.toLowerCase() === 'line') return;
                e.stopPropagation();
                deleteRoad(r._id, r.name);
            });
        }
        graphMapSvg.appendChild(elem);
    });

    // ── Pending Road ──
    if (pendingRoad && graphMode === 'road') {
        renderPendingRoad();
    }

    // ── Ghost Buildings ──
    const assignedBuildingIds = new Set(graphNodes.filter(n => n.buildingId).map(n => n.buildingId));
    allBuildings.forEach(b => {
        if (!b.shape) return;
        let elem;
        if (b.shape.type === 'rect') {
            elem = document.createElementNS(ns, 'rect');
            elem.setAttribute('x', b.shape.x); elem.setAttribute('y', b.shape.y);
            elem.setAttribute('width', b.shape.width); elem.setAttribute('height', b.shape.height);
            if (b.shape.rx) elem.setAttribute('rx', b.shape.rx);
            if (b.shape.ry) elem.setAttribute('ry', b.shape.ry);
            if (b.shape.rotate) {
                const cx = parseFloat(b.shape.x) + parseFloat(b.shape.width) / 2;
                const cy = parseFloat(b.shape.y) + parseFloat(b.shape.height) / 2;
                elem.setAttribute('transform', `rotate(${b.shape.rotate}, ${cx}, ${cy})`);
            }
        } else if (b.shape.type === 'ellipse') {
            elem = document.createElementNS(ns, 'ellipse');
            elem.setAttribute('cx', b.shape.cx); elem.setAttribute('cy', b.shape.cy);
            elem.setAttribute('rx', b.shape.rx); elem.setAttribute('ry', b.shape.ry);
        }
        if (!elem) return;
        elem.setAttribute('fill', '#888');
        elem.setAttribute('stroke', '#333');
        elem.setAttribute('stroke-width', '1.5');
        elem.classList.add('ghost-building');
        elem.dataset.buildingId = b._id;
        elem.dataset.buildingName = b.name;
        if (assignedBuildingIds.has(b._id)) elem.classList.add('assigned');
        if (graphMode === 'assign' && selectedNodeId) elem.classList.add('assignable');
        graphMapSvg.appendChild(elem);
    });

    // ── Edges ──
    graphEdges.forEach(edge => {
        const fromNode = graphNodes.find(n => n.id === edge.from);
        const toNode = graphNodes.find(n => n.id === edge.to);
        if (!fromNode || !toNode) return;
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', fromNode.x); line.setAttribute('y1', fromNode.y);
        line.setAttribute('x2', toNode.x); line.setAttribute('y2', toNode.y);
        line.classList.add('graph-edge');
        // Color-code by edge type
        const edgeClass = edge.type === 'pedestrian' ? 'edge-pedestrian'
            : edge.type === 'vehicle' ? 'edge-vehicle'
            : 'edge-both';
        line.classList.add(edgeClass);
        // One-way marker (only applicable to vehicle or both)
        if (edge.oneWay) {
            line.classList.add('one-way');
            line.setAttribute('marker-end', 'url(#arrowhead)');
        }
        line.dataset.from = edge.from;
        line.dataset.to = edge.to;
        if (graphMode === 'delete') {
            line.style.cursor = 'pointer';
            line.style.pointerEvents = 'all';
            line.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                pushUndo();
                graphEdges = graphEdges.filter(ed => !(ed.from === edge.from && ed.to === edge.to));
                graphStatus.textContent = 'Edge deleted.';
                redrawGraph();
            });
        }
        graphMapSvg.appendChild(line);
    });

    // ── Nodes ──
    graphNodes.forEach(node => {
        const g = document.createElementNS(ns, 'g');
        if (node.buildingId) {
            const label = document.createElementNS(ns, 'text');
            label.setAttribute('x', node.x);
            label.setAttribute('y', node.y - 10);
            label.classList.add('graph-node-label');
            label.textContent = allBuildings.find(b => b._id === node.buildingId)?.dataId || node.buildingId;
            g.appendChild(label);
        }
        const circle = document.createElementNS(ns, 'circle');
        circle.setAttribute('cx', node.x); circle.setAttribute('cy', node.y);
        circle.setAttribute('r', 6);
        circle.classList.add('graph-node');
        if (node.buildingId) circle.classList.add('assigned');
        if (node.id === selectedNodeId) circle.classList.add('selected');
        circle.dataset.nodeId = node.id;
        g.appendChild(circle);
        graphMapSvg.appendChild(g);
    });

    graphMapSvg.addEventListener('click', handleGraphClick);
}

// ─── Delete Road ──────────────────────────────────────────────────────────────
async function deleteRoad(id, name) {
    if (!confirm(`Delete road "${name}"? This cannot be undone.`)) return;
    await showLoading();
    try {
        const res = await fetch(`/api/buildings/${id}`, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (!res.ok) {
            showToast('error', data.error || 'Failed to delete road.');
        } else {
            showToast('success', `Road "${name}" deleted.`);
            await refreshRoads();
            redrawGraph();
        }
    } catch (err) {
        showToast('error', 'Failed to delete road.');
    } finally {
        hideLoading();
    }
}

// ─── Handle Graph Click ───────────────────────────────────────────────────────
function handleGraphClick(e) {
    if (e.altKey) return;
    if (graphMode === 'noselect') return;
    const target = e.target;

    if (graphMode === 'node') {
        if (target.classList.contains('graph-node')) return;
        if (target.classList.contains('graph-road')) return;
        if (target.classList.contains('road-pending')) return;
        const coords = getGraphSVGCoords(e);
        pushUndo();
        graphNodes.push({ id: generateNodeId(), x: coords.x, y: coords.y, buildingId: null });
        graphStatus.textContent = `Node placed at (${coords.x}, ${coords.y})`;
        redrawGraph();
        return;
    }

    if (graphMode === 'edge') {
        if (!target.classList.contains('graph-node')) {
            if (selectedNodeId) { selectedNodeId = null; graphStatus.textContent = 'Click a node to start an edge'; redrawGraph(); }
            return;
        }
        const clickedId = target.dataset.nodeId;
        if (!selectedNodeId) { selectedNodeId = clickedId; graphStatus.textContent = 'Now click another node to connect'; redrawGraph(); return; }
        if (selectedNodeId === clickedId) { selectedNodeId = null; graphStatus.textContent = 'Click a node to start an edge'; redrawGraph(); return; }
        const fromCount = graphEdges.filter(ed => ed.from === selectedNodeId || ed.to === selectedNodeId).length;
        const toCount = graphEdges.filter(ed => ed.from === clickedId || ed.to === clickedId).length;
        if (fromCount >= 10 || toCount >= 10) { showToast('error', 'A node can have at most 10 connections.'); selectedNodeId = null; redrawGraph(); return; }
        const exists = graphEdges.some(ed => (ed.from === selectedNodeId && ed.to === clickedId) || (ed.from === clickedId && ed.to === selectedNodeId));
        if (exists) { showToast('error', 'These nodes are already connected.'); selectedNodeId = null; redrawGraph(); return; }
        const fromNode = graphNodes.find(n => n.id === selectedNodeId);
        const toNode = graphNodes.find(n => n.id === clickedId);
        const weight = calcWeight(fromNode, toNode);
        const isOneWay = edgeType !== 'pedestrian' && edgeOneWay;
        pushUndo();
        graphEdges.push({
            from: selectedNodeId,
            to: clickedId,
            weight,
            type: edgeType,
            oneWay: isOneWay,
            direction: isOneWay ? 'from→to' : null
        });
        graphStatus.textContent = `Connected! Weight: ${weight}px. Click another node to continue.`;
        selectedNodeId = clickedId;
        redrawGraph();
        return;
    }

    if (graphMode === 'assign') {
        if (target.classList.contains('graph-node')) {
            selectedNodeId = target.dataset.nodeId;
            const node = graphNodes.find(n => n.id === selectedNodeId);
            const cur = node.buildingId ? ` (currently: ${allBuildings.find(b => b._id === node.buildingId)?.dataId})` : '';
            graphStatus.textContent = `Node selected${cur}. Now click a building to assign.`;
            redrawGraph(); return;
        }
        if (target.classList.contains('ghost-building') && selectedNodeId) {
            const buildingId = target.dataset.buildingId;
            const buildingName = target.dataset.buildingName;
            pushUndo();
            graphNodes.forEach(n => { if (n.buildingId === buildingId) n.buildingId = null; });
            const node = graphNodes.find(n => n.id === selectedNodeId);
            if (node) { node.buildingId = buildingId; graphStatus.textContent = `Assigned "${buildingName}". Select another node to continue.`; selectedNodeId = null; redrawGraph(); }
            return;
        }
        selectedNodeId = null;
        graphStatus.textContent = 'Click a node, then click a building to assign it';
        redrawGraph(); return;
    }

    if (graphMode === 'delete') {
        if (target.classList.contains('graph-node')) {
            const nodeId = target.dataset.nodeId;
            pushUndo();
            graphNodes = graphNodes.filter(n => n.id !== nodeId);
            graphEdges = graphEdges.filter(ed => ed.from !== nodeId && ed.to !== nodeId);
            graphStatus.textContent = 'Node and its edges deleted.';
            redrawGraph();
        }
        return;
    }
}

// ─── Save Graph ───────────────────────────────────────────────────────────────
saveGraphBtn.addEventListener('click', async () => {
    await showLoading();
    try {
        const res = await fetch('/api/mapgraph', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ nodes: graphNodes, edges: graphEdges })
        });
        const data = await res.json();
        if (!res.ok) { showToast('error', data.error || 'Failed to save graph.'); }
        else {
            showToast('success', 'Graph saved successfully!');
            savedSnapshot = snapshot();
            markClean();
        }
    } catch (err) {
        showToast('error', 'Failed to save graph.');
    } finally {
        hideLoading();
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── VIEW MODAL ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const viewModalOverlay = document.getElementById('viewModalOverlay');
const closeViewModal = document.getElementById('closeViewModal');
const modalGallery = document.getElementById('modalGallery');
const modalCategory = document.getElementById('modalCategory');
const modalDataId = document.getElementById('modalDataId');
const modalName = document.getElementById('modalName');
const modalDescription = document.getElementById('modalDescription');
const modalOfficesSection = document.getElementById('modalOfficesSection');
const modalOfficesList = document.getElementById('modalOfficesList');
const editModalBtn = document.getElementById('editModalBtn');
const deleteModalBtn = document.getElementById('deleteModalBtn');

async function openViewModal(building) {
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
    modalDescription.innerHTML = building.description ||
        '<p style="color: var(--light-grey); font-family: Noto Sans, sans-serif; font-size: 0.9rem;">No description available.</p>';

    modalOfficesSection.classList.add('hidden');
    modalOfficesList.innerHTML = '';
    try {
        const res = await fetch(`/api/offices?building=${building._id}`, { headers: { 'Accept': 'application/json' } });
        if (res.ok) {
            const data = await res.json();
            const offices = data.offices || [];
            if (offices.length > 0) {
                modalOfficesSection.classList.remove('hidden');
                modalOfficesList.innerHTML = offices.map(o => `
                    <div class="modal-office-item">
                        <i class='bx bx-buildings'></i>
                        <div>
                            <p class="modal-office-name">${o.name}</p>
                            ${o.head ? `<p class="modal-office-head">${o.head}</p>` : ''}
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (err) {}

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

cancelDelete.addEventListener('click', () => { deleteModalOverlay.classList.add('hidden'); deleteId = null; });

confirmDelete.addEventListener('click', async () => {
    if (!deleteId) return;
    deleteModalOverlay.classList.add('hidden');
    await showLoading();
    try {
        const res = await fetch(`/api/buildings/${deleteId}`, { method: 'DELETE', headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        if (!res.ok) { showToast('error', data.error || 'Failed to delete building.'); }
        else { 
            showToast('success', 'Building deleted successfully!'); 
            await fetchBuildings(); 
            if (!mapView.classList.contains('hidden')) renderMap();
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