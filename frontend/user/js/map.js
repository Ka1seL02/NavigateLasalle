import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── State ────────────────────────────────────────────────────────────────────
let allBuildings = [];
let allRoads = [];
let allOffices = [];
let graph = { nodes: [], edges: [] };
let selectedBuilding = null;
let selectedFromId = null;
let selectedMode = 'walking';
let currentPathElements = [];

// ─── SVG Pan/Zoom State ───────────────────────────────────────────────────────
let viewBox = { x: 0, y: 0, w: 1920, h: 1080 };
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panOrigin = { x: 0, y: 0 };

// ─── Elements ─────────────────────────────────────────────────────────────────
const svg = document.getElementById('campusMap');
const leftPanelList = document.getElementById('leftPanelList');
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const rightPanel = document.getElementById('rightPanel');
const rightPanelClose = document.getElementById('rightPanelClose');
const infoGallery = document.getElementById('infoGallery');
const infoBody = document.getElementById('infoBody');
const getDirectionsBtn = document.getElementById('getDirectionsBtn');
const directionsModal = document.getElementById('directionsModal');
const directionsModalClose = document.getElementById('directionsModalClose');
const directionsDestination = document.getElementById('directionsDestination');
const fromInput = document.getElementById('fromInput');
const fromDropdown = document.getElementById('fromDropdown');
const findRouteBtn = document.getElementById('findRouteBtn');
const routeBar = document.getElementById('routeBar');
const routeBarClear = document.getElementById('routeBarClear');
const routeBarText = document.getElementById('routeBarText');

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
    try {
        const [buildingsRes, officesRes, graphRes] = await Promise.all([
            fetch('/api/buildings'),
            fetch('/api/offices'),
            fetch('/api/mapgraph')
        ]);

        const buildingsData = await buildingsRes.json();
        const officesData = await officesRes.json();
        const graphData = await graphRes.json();

        allRoads = buildingsData.buildings.filter(b => b.category === 'road');
        allBuildings = buildingsData.buildings.filter(b => b.category !== 'road');
        allOffices = officesData.offices;
        graph = graphData;

        renderMap();
        renderLeftPanel();
    } catch (err) {
        console.error('fetchAll error:', err);
    }
}

// ─── Category Helpers ─────────────────────────────────────────────────────────
function getCategoryClass(category) {
    switch (category) {
        case 'building': return 'building';
        case 'facility': return 'facility';
        case 'gate': return 'gate';
        case 'landmark': return 'landmark';
        case 'parking': return 'parking';
        default: return 'building';
    }
}

function getCategoryIcon(category) {
    switch (category) {
        case 'building': return 'bx-buildings';
        case 'facility': return 'bx-football';
        case 'gate': return 'bx-door-open';
        case 'landmark': return 'bx-map-pin';
        case 'parking': return 'bx-car';
        default: return 'bx-buildings';
    }
}

// ─── Render Map ───────────────────────────────────────────────────────────────
function renderMap() {
    svg.innerHTML = '';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="${getComputedStyle(document.documentElement).getPropertyValue('--light-green') || '#00c657'}" />
        </marker>
    `;
    svg.appendChild(defs);

    allRoads.forEach(road => renderShape(road, 'road'));

    allBuildings.forEach(b => {
        const cls = getCategoryClass(b.category);
        const elem = renderShape(b, cls);
        if (elem) {
            elem.dataset.id = b._id;
            elem.dataset.dataId = b.dataId;
            elem.addEventListener('click', () => onBuildingClick(b));
        }
    });
}

function renderShape(b, cls) {
    let elem;
    const shape = b.shape;
    if (!shape) return null;

    if (shape.type === 'rect') {
        elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        elem.setAttribute('x', shape.x);
        elem.setAttribute('y', shape.y);
        elem.setAttribute('width', shape.width);
        elem.setAttribute('height', shape.height);
        if (shape.rotate) {
            const cx = parseFloat(shape.x) + parseFloat(shape.width) / 2;
            const cy = parseFloat(shape.y) + parseFloat(shape.height) / 2;
            elem.setAttribute('transform', `rotate(${shape.rotate}, ${cx}, ${cy})`);
        }
    } else if (shape.type === 'ellipse') {
        elem = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        elem.setAttribute('cx', shape.cx);
        elem.setAttribute('cy', shape.cy);
        elem.setAttribute('rx', shape.rx);
        elem.setAttribute('ry', shape.ry);
    }

    if (!elem) return null;
    elem.classList.add(cls);
    svg.appendChild(elem);
    return elem;
}

// ─── Building Click ───────────────────────────────────────────────────────────
function onBuildingClick(building) {
    svg.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));

    const elem = svg.querySelector(`[data-id="${building._id}"]`);
    if (elem) elem.classList.add('selected');

    selectedBuilding = building;
    openRightPanel(building);

    document.querySelectorAll('.panel-item').forEach(el => el.classList.remove('active'));
    const panelItem = leftPanelList.querySelector(`[data-id="${building._id}"]`);
    if (panelItem) panelItem.classList.add('active');
}

// ─── Left Panel Toggle ────────────────────────────────────────────────────────
const leftPanel = document.getElementById('leftPanel');
const panelToggleBtn = document.getElementById('panelToggleBtn');
const panelExpandBtn = document.getElementById('panelExpandBtn');

panelToggleBtn.addEventListener('click', () => {
    leftPanel.classList.add('collapsed');
    panelExpandBtn.classList.remove('hidden');
});

panelExpandBtn.addEventListener('click', () => {
    leftPanel.classList.remove('collapsed');
    panelExpandBtn.classList.add('hidden');
});

// ─── Right Panel ──────────────────────────────────────────────────────────────
function openRightPanel(building) {
    rightPanel.classList.remove('hidden');

    const images = building.images ?? [];
    const offices = allOffices.filter(o => o.building?._id === building._id || o.building === building._id);
    const isUnderMaintenance = !building.isVisible;

    // Gallery
    let galleryIndex = 0;
    if (images.length > 0) {
        infoGallery.innerHTML = `
            <img src="${images[0]}" alt="${building.name}" id="galleryHeroImg" />
            ${images.length > 1 ? `
                <div class="gallery-nav">
                    ${images.map((_, i) => `
                        <button class="gallery-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></button>
                    `).join('')}
                </div>
            ` : ''}
        `;
        if (images.length > 1) {
            infoGallery.querySelectorAll('.gallery-dot').forEach(dot => {
                dot.addEventListener('click', () => {
                    galleryIndex = parseInt(dot.dataset.index);
                    document.getElementById('galleryHeroImg').src = images[galleryIndex];
                    infoGallery.querySelectorAll('.gallery-dot').forEach(d => d.classList.remove('active'));
                    dot.classList.add('active');
                });
            });
        }
    } else {
        infoGallery.innerHTML = `
            <div class="no-image">
                <i class='bx bx-buildings'></i>
                <p>No images available</p>
            </div>
        `;
    }

    // Sticky Header
    const infoStickyHeader = document.getElementById('infoStickyHeader');
    infoStickyHeader.innerHTML = `
        <div class="info-header-badges">
            <span class="info-category-badge">${capitalize(building.category)}</span>
            ${isUnderMaintenance ? `<span class="info-status-badge">Under Maintenance</span>` : ''}
        </div>
        <h2 class="info-name">${building.name}</h2>
    `;

    // Scrollable Body
    infoBody.innerHTML = `
        ${building.description ? `<div class="info-description">${building.description}</div>` : ''}
        ${offices.length > 0 ? `
            <p class="info-section-title">Offices in this Building</p>
            ${offices.map(o => `
                <div class="info-office-item">
                    <span class="info-office-name">${o.name}</span>
                    ${o.officeHours ? `
                        <span class="info-office-hours">
                            <i class='bx bx-time'></i> ${o.officeHours}
                        </span>
                    ` : ''}
                </div>
            `).join('')}
        ` : ''}
    `;
}

rightPanelClose.addEventListener('click', () => {
    rightPanel.classList.add('hidden');
    svg.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.panel-item').forEach(el => el.classList.remove('active'));
    document.getElementById('infoStickyHeader').innerHTML = '';
    infoBody.innerHTML = '';
    selectedBuilding = null;
});

// ─── Left Panel ───────────────────────────────────────────────────────────────
function renderLeftPanel(search = '') {
    leftPanelList.innerHTML = '';
    const q = search.toLowerCase();

    const filteredBuildings = allBuildings.filter(b =>
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.dataId.toLowerCase().includes(q)
    );

    const filteredOffices = allOffices.filter(o =>
        q && (
            o.name.toLowerCase().includes(q) ||
            o.category.toLowerCase().includes(q)
        )
    );

    if (filteredBuildings.length === 0 && filteredOffices.length === 0) {
        leftPanelList.innerHTML = `<div class="panel-empty">No results found.</div>`;
        return;
    }

    if (filteredBuildings.length > 0) {
        const grouped = {};
        filteredBuildings.forEach(b => {
            const cat = b.category ?? 'building';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(b);
        });

        const categoryOrder = ['building', 'facility', 'gate', 'landmark', 'parking'];
        const categoryLabels = {
            building: 'Buildings',
            facility: 'Facilities',
            gate: 'Gates',
            landmark: 'Landmarks',
            parking: 'Parking'
        };

        categoryOrder.forEach(cat => {
            if (!grouped[cat] || grouped[cat].length === 0) return;

            const items = grouped[cat];
            const cls = getCategoryClass(cat);

            const section = document.createElement('div');
            section.className = 'panel-category-section';

            const header = document.createElement('div');
            header.className = 'panel-category-header';
            header.innerHTML = `
                <div class="panel-item-icon ${cls}">
                    <i class='bx ${getCategoryIcon(cat)}'></i>
                </div>
                <span class="panel-category-label">${categoryLabels[cat]} (${items.length})</span>
                <i class='bx bx-chevron-down panel-category-chevron'></i>
            `;

            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'panel-category-items';

            items.forEach(b => {
                const item = createPanelItem(b.name, b.dataId, cls, () => {
                    onBuildingClick(b);
                    focusOnBuilding(b);
                }, () => {
                    selectedBuilding = b;
                    openDirectionsModal(b);
                });
                item.dataset.id = b._id;
                itemsContainer.appendChild(item);
            });

            header.addEventListener('click', () => {
                const isCollapsed = itemsContainer.classList.toggle('collapsed');
                header.querySelector('.panel-category-chevron').classList.toggle('collapsed', isCollapsed);
            });

            section.appendChild(header);
            section.appendChild(itemsContainer);
            leftPanelList.appendChild(section);
        });
    }

    if (filteredOffices.length > 0) {
        const title = document.createElement('p');
        title.className = 'panel-section-title';
        title.textContent = `Offices (${filteredOffices.length})`;
        leftPanelList.appendChild(title);

        filteredOffices.forEach(o => {
            const buildingName = o.building?.name ?? 'Unknown Building';
            const item = createPanelItem(o.name, buildingName, 'office', () => {
                const building = allBuildings.find(b => b._id === (o.building?._id ?? o.building));
                if (building) {
                    onBuildingClick(building);
                    focusOnBuilding(building);
                }
            }, () => {
                const building = allBuildings.find(b => b._id === (o.building?._id ?? o.building));
                if (building) {
                    selectedBuilding = building;
                    openDirectionsModal(building);
                } else {
                    routeBarText.textContent = 'No location assigned for this office.';
                    routeBar.classList.remove('hidden');
                }
            });
            leftPanelList.appendChild(item);
        });
    }
}

function createPanelItem(name, sub, iconClass, onFocus, onDirections) {
    const item = document.createElement('div');
    item.className = 'panel-item';

    const iconMap = {
        building: 'bx-buildings',
        facility: 'bx-football',
        gate: 'bx-door-open',
        landmark: 'bx-map-pin',
        parking: 'bx-car',
        office: 'bx-briefcase'
    };

    item.innerHTML = `
        <div class="panel-item-left">
            <div class="panel-item-icon ${iconClass}">
                <i class='bx ${iconMap[iconClass] || 'bx-buildings'}'></i>
            </div>
            <div class="panel-item-info">
                <p class="panel-item-name">${name}</p>
                <p class="panel-item-sub">${sub}</p>
            </div>
        </div>
        <div class="panel-item-actions">
            <button class="panel-action-btn focus-btn" title="Focus on map">
                <i class='bx bx-crosshair'></i>
            </button>
            <button class="panel-action-btn dir-btn" title="Get directions">
                <i class='bx bx-navigation'></i>
            </button>
        </div>
    `;

    item.querySelector('.focus-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        onFocus();
    });
    item.querySelector('.dir-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        onDirections();
    });
    item.addEventListener('click', onFocus);

    return item;
}

// ─── Search ───────────────────────────────────────────────────────────────────
searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();
    searchClear.classList.toggle('hidden', !q);
    renderLeftPanel(q);
});

searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.classList.add('hidden');
    renderLeftPanel('');
});

// ─── Focus on Building ────────────────────────────────────────────────────────
function focusOnBuilding(building) {
    const shape = building.shape;
    if (!shape) return;

    let cx, cy;
    if (shape.type === 'rect') {
        cx = parseFloat(shape.x) + parseFloat(shape.width) / 2;
        cy = parseFloat(shape.y) + parseFloat(shape.height) / 2;
    } else if (shape.type === 'ellipse') {
        cx = parseFloat(shape.cx);
        cy = parseFloat(shape.cy);
    }

    if (cx === undefined) return;

    const targetW = 600;
    const targetH = 400;
    viewBox.x = cx - targetW / 2;
    viewBox.y = cy - targetH / 2;
    viewBox.w = targetW;
    viewBox.h = targetH;
    clampViewBox();
    applyViewBox();
}

// ─── Zoom / Pan ───────────────────────────────────────────────────────────────
function applyViewBox() {
    svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
}

function clampViewBox() {
    viewBox.x = Math.max(0, Math.min(viewBox.x, 1920 - viewBox.w));
    viewBox.y = Math.max(0, Math.min(viewBox.y, 1080 - viewBox.h));
}

svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    const newW = viewBox.w * factor;
    const newH = viewBox.h * factor;

    const scaleW = 1920 / newW;
    if (scaleW < MIN_ZOOM || scaleW > MAX_ZOOM) return;

    const rect = svg.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;

    viewBox.x += (viewBox.w - newW) * mx;
    viewBox.y += (viewBox.h - newH) * my;
    viewBox.w = newW;
    viewBox.h = newH;

    clampViewBox();
    applyViewBox();
}, { passive: false });

svg.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('building') ||
        e.target.classList.contains('facility') ||
        e.target.classList.contains('gate') ||
        e.target.classList.contains('landmark') ||
        e.target.classList.contains('parking')) return;
    isPanning = true;
    panStart = { x: e.clientX, y: e.clientY };
    panOrigin = { x: viewBox.x, y: viewBox.y };
    svg.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = viewBox.w / rect.width;
    const scaleY = viewBox.h / rect.height;
    viewBox.x = panOrigin.x - (e.clientX - panStart.x) * scaleX;
    viewBox.y = panOrigin.y - (e.clientY - panStart.y) * scaleY;
    clampViewBox();
    applyViewBox();
});

window.addEventListener('mouseup', () => {
    isPanning = false;
    svg.style.cursor = 'grab';
});

document.getElementById('zoomIn').addEventListener('click', () => {
    const factor = 0.8;
    const newW = viewBox.w * factor;
    const newH = viewBox.h * factor;
    const scaleW = 1920 / newW;
    if (scaleW > MAX_ZOOM) return;
    viewBox.x += (viewBox.w - newW) / 2;
    viewBox.y += (viewBox.h - newH) / 2;
    viewBox.w = newW;
    viewBox.h = newH;
    clampViewBox();
    applyViewBox();
});

document.getElementById('zoomOut').addEventListener('click', () => {
    const factor = 1.2;
    const newW = viewBox.w * factor;
    const newH = viewBox.h * factor;
    const scaleW = 1920 / newW;
    if (scaleW < MIN_ZOOM) return;
    viewBox.x += (viewBox.w - newW) / 2;
    viewBox.y += (viewBox.h - newH) / 2;
    viewBox.w = newW;
    viewBox.h = newH;
    clampViewBox();
    applyViewBox();
});

document.getElementById('resetView').addEventListener('click', () => {
    viewBox = { x: 0, y: 0, w: 1920, h: 1080 };
    applyViewBox();
});

// ─── Directions Modal ─────────────────────────────────────────────────────────
function openDirectionsModal(building) {
    directionsDestination.textContent = building.name;
    fromInput.value = '';
    fromDropdown.classList.add('hidden');
    selectedFromId = null;
    document.querySelectorAll('.quick-start-btn').forEach(btn => btn.classList.remove('active'));
    directionsModal.classList.remove('hidden');
}

getDirectionsBtn.addEventListener('click', () => {
    if (selectedBuilding) openDirectionsModal(selectedBuilding);
});

directionsModalClose.addEventListener('click', () => {
    directionsModal.classList.add('hidden');
});

directionsModal.addEventListener('click', (e) => {
    if (e.target === directionsModal) directionsModal.classList.add('hidden');
});

fromInput.addEventListener('input', () => {
    const q = fromInput.value.trim().toLowerCase();
    if (!q) {
        fromDropdown.classList.add('hidden');
        return;
    }

    const matches = allBuildings.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.dataId.toLowerCase().includes(q)
    ).slice(0, 8);

    if (matches.length === 0) {
        fromDropdown.classList.add('hidden');
        return;
    }

    fromDropdown.innerHTML = matches.map(b => `
        <div class="from-dropdown-item" data-id="${b._id}" data-dataid="${b.dataId}">
            ${b.name} <span>${b.dataId}</span>
        </div>
    `).join('');

    fromDropdown.querySelectorAll('.from-dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            selectedFromId = item.dataset.id;
            fromInput.value = item.textContent.trim();
            fromDropdown.classList.add('hidden');
            document.querySelectorAll('.quick-start-btn').forEach(b => b.classList.remove('active'));
        });
    });

    fromDropdown.classList.remove('hidden');
});

document.querySelectorAll('.quick-start-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const dataId = btn.dataset.id;
        const building = allBuildings.find(b => b.dataId === dataId);
        if (!building) return;

        selectedFromId = building._id;
        fromInput.value = building.name;
        fromDropdown.classList.add('hidden');

        document.querySelectorAll('.quick-start-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMode = btn.dataset.mode;
    });
});

// ─── A* Pathfinding ───────────────────────────────────────────────────────────
function heuristic(nodeA, nodeB) {
    return Math.sqrt(
        Math.pow(nodeA.x - nodeB.x, 2) +
        Math.pow(nodeA.y - nodeB.y, 2)
    );
}

function getNeighbors(nodeId, nodes, edges, mode) {
    const neighbors = [];
    edges.forEach(edge => {
        const isWalkable = edge.type === 'pedestrian' || edge.type === 'both';
        const isDrivable = edge.type === 'vehicle' || edge.type === 'both';

        if (mode === 'walking') {
            // Walking: only walkable edges, always bidirectional
            if (!isWalkable) return;
            if (edge.from === nodeId) neighbors.push({ id: edge.to, weight: edge.weight });
            else if (edge.to === nodeId) neighbors.push({ id: edge.from, weight: edge.weight });
        } else {
            // Vehicle: only drivable edges, respect oneWay
            if (!isDrivable) return;
            if (!edge.oneWay) {
                if (edge.from === nodeId) neighbors.push({ id: edge.to, weight: edge.weight });
                else if (edge.to === nodeId) neighbors.push({ id: edge.from, weight: edge.weight });
            } else {
                // One-way — check direction
                if (edge.direction === 'from→to' && edge.from === nodeId) {
                    neighbors.push({ id: edge.to, weight: edge.weight });
                } else if (edge.direction === 'to→from' && edge.to === nodeId) {
                    neighbors.push({ id: edge.from, weight: edge.weight });
                }
            }
        }
    });
    return neighbors;
}

function aStar(startNodeId, endNodeId, nodes, edges, mode) {
    const nodeMap = {};
    nodes.forEach(n => nodeMap[n.id] = n);

    const openSet = new Set([startNodeId]);
    const cameFrom = {};
    const gScore = {};
    const fScore = {};

    nodes.forEach(n => {
        gScore[n.id] = Infinity;
        fScore[n.id] = Infinity;
    });

    gScore[startNodeId] = 0;
    fScore[startNodeId] = heuristic(nodeMap[startNodeId], nodeMap[endNodeId]);

    while (openSet.size > 0) {
        let current = null;
        let lowestF = Infinity;
        openSet.forEach(id => {
            if (fScore[id] < lowestF) {
                lowestF = fScore[id];
                current = id;
            }
        });

        if (current === endNodeId) {
            const path = [];
            let cur = current;
            while (cur) {
                path.unshift(cur);
                cur = cameFrom[cur];
            }
            return path;
        }

        openSet.delete(current);
        const neighbors = getNeighbors(current, nodes, edges, mode);

        neighbors.forEach(({ id: neighborId, weight }) => {
            const tentativeG = gScore[current] + weight;
            if (tentativeG < gScore[neighborId]) {
                cameFrom[neighborId] = current;
                gScore[neighborId] = tentativeG;
                fScore[neighborId] = tentativeG + heuristic(nodeMap[neighborId], nodeMap[endNodeId]);
                openSet.add(neighborId);
            }
        });
    }

    return null;
}

// ─── Find Route ───────────────────────────────────────────────────────────────
findRouteBtn.addEventListener('click', () => {
    if (!selectedFromId) {
        fromInput.classList.add('input-error');
        setTimeout(() => fromInput.classList.remove('input-error'), 2000);
        return;
    }

    if (!selectedBuilding) return;

    const fromNode = graph.nodes.find(n => n.buildingId === selectedFromId);
    const toNode = graph.nodes.find(n => n.buildingId === selectedBuilding._id);

    if (!fromNode || !toNode) {
        routeBarText.textContent = 'No route data available for this location.';
        routeBar.classList.remove('hidden');
        directionsModal.classList.add('hidden');
        return;
    }

    const path = aStar(fromNode.id, toNode.id, graph.nodes, graph.edges, selectedMode);

    if (!path) {
        routeBarText.textContent = 'No route found. Try a different mode.';
        routeBar.classList.remove('hidden');
        directionsModal.classList.add('hidden');
        return;
    }

    drawPath(path);
    directionsModal.classList.add('hidden');

    const fromBuilding = allBuildings.find(b => b._id === selectedFromId);
    routeBarText.textContent = `${fromBuilding?.name ?? 'Start'} → ${selectedBuilding.name}`;
    routeBar.classList.remove('hidden');
});

// ─── Draw Path ────────────────────────────────────────────────────────────────
function drawPath(nodeIds) {
    clearPath();

    const nodeMap = {};
    graph.nodes.forEach(n => nodeMap[n.id] = n);

    const points = nodeIds.map(id => nodeMap[id]).filter(Boolean);
    if (points.length < 2) return;

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', points.map(n => `${n.x},${n.y}`).join(' '));
    polyline.classList.add('path-line');
    svg.appendChild(polyline);
    currentPathElements.push(polyline);

    const start = points[0];
    const startCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    startCircle.setAttribute('cx', start.x);
    startCircle.setAttribute('cy', start.y);
    startCircle.setAttribute('r', 10);
    startCircle.classList.add('path-start');
    svg.appendChild(startCircle);
    currentPathElements.push(startCircle);

    const end = points[points.length - 1];
    const endCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    endCircle.setAttribute('cx', end.x);
    endCircle.setAttribute('cy', end.y);
    endCircle.setAttribute('r', 10);
    endCircle.classList.add('path-end');
    svg.appendChild(endCircle);
    currentPathElements.push(endCircle);

    const midIndex = Math.floor(points.length / 2);
    const mid = points[midIndex];
    viewBox.x = mid.x - 500;
    viewBox.y = mid.y - 300;
    viewBox.w = 1000;
    viewBox.h = 600;
    clampViewBox();
    applyViewBox();
}

function clearPath() {
    currentPathElements.forEach(el => el.remove());
    currentPathElements = [];
}

// ─── Clear Route ──────────────────────────────────────────────────────────────
routeBarClear.addEventListener('click', () => {
    clearPath();
    routeBar.classList.add('hidden');
    selectedFromId = null;
    document.querySelectorAll('.quick-start-btn').forEach(b => b.classList.remove('active'));
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
(async () => {
    await showLoading();
    await fetchAll();
    applyViewBox();
    hideLoading();
})();