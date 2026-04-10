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
        if (savedView === 'graph') renderGraph();
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
    const ns = 'http://www.w3.org/2000/svg';

    // ── Roads (hardcoded, non-interactive) ──
    roadData.forEach(r => {
        let elem;
        if (r.type === 'rect') {
            elem = document.createElementNS(ns, 'rect');
            elem.setAttribute('x', r.x);
            elem.setAttribute('y', r.y);
            elem.setAttribute('width', r.width);
            elem.setAttribute('height', r.height);
            if (r.rotate) {
                const cx = r.x + r.width / 2;
                const cy = r.y + r.height / 2;
                elem.setAttribute('transform', `rotate(${r.rotate}, ${cx}, ${cy})`);
            }
        } else if (r.type === 'ellipse') {
            elem = document.createElementNS(ns, 'ellipse');
            elem.setAttribute('cx', r.cx);
            elem.setAttribute('cy', r.cy);
            elem.setAttribute('rx', r.rx);
            elem.setAttribute('ry', r.ry);
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
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── GRAPH VIEW ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Hardcoded Road Data (from campus SVG) ────────────────────────────────────
const roadData = [
    // EAST
    { id: 'AEA-Rd.', type: 'rect', x: 98, y: 497, width: 333, height: 30 },
    { id: 'AP-Rd.', type: 'rect', x: 205, y: 696, width: 30, height: 287 },
    { id: 'Chapel-Rd.', type: 'rect', x: 272, y: 443, width: 30, height: 55 },
    { id: 'G1-Entry', type: 'rect', x: 429, y: 1012, width: 30, height: 52 },
    { id: 'Gate-4-Way-Rd.', type: 'rect', x: 69, y: 444, width: 30, height: 620 },
    { id: 'IL-Rd.', type: 'rect', x: 459, y: 982, width: 188, height: 30 },
    { id: 'JPAC-Rd.', type: 'rect', x: 98, y: 982, width: 331, height: 30 },
    { id: 'JS-Rd.', type: 'rect', x: 353, y: 696, width: 30, height: 287 },
    { id: 'Lake-Ave.', type: 'rect', x: 429, y: 165, width: 30, height: 816 },
    { id: 'LCDC-Rd.', type: 'rect', x: 98, y: 667, width: 333, height: 30 },
    { id: 'Museo-Drive', type: 'rect', x: 218, y: 414, width: 213, height: 30 },
    { id: 'Park-Trail-1', type: 'rect', x: 458, y: 243, width: 219, height: 12 },
    { id: 'Park-Trail-2', type: 'rect', x: 532, y: 276.5, width: 177.43, height: 12, rotate: 22.47 },
    { id: 'PC-Campos-Ave.-1', type: 'rect', x: 646, y: 555.5, width: 30, height: 507.5 },
    { id: 'PC-Campos-Ave.-2', type: 'rect', x: 647, y: 527, width: 149.3, height: 30, rotate: -21 },
    { id: 'PC-Campos-Ave.-3', type: 'rect', x: 708, y: 144, width: 30, height: 400, rotate: -19 },
    { id: 'West-Ave.-1', type: 'rect', x: 429, y: 136, width: 801, height: 30 },
    // WEST
    { id: 'Acacia-Ave.', type: 'rect', x: 720, y: 352, width: 510, height: 30 },
    { id: 'Academy-Lane', type: 'rect', x: 704, y: 254, width: 497, height: 12 },
    { id: 'G3-Entry', type: 'rect', x: 1862, y: 136, width: 44, height: 30 },
    { id: 'GS-Drive-PA-Rd.', type: 'rect', x: 1227, y: 136, width: 461, height: 30 },
    { id: 'Oval-Rd.-1', type: 'rect', x: 1228, y: 352, width: 488, height: 30 },
    { id: 'Oval-Rd.-2', type: 'rect', x: 1686, y: 136, width: 30, height: 217 },
    { id: 'Oval-Rd.-3', type: 'rect', x: 1715, y: 136, width: 118, height: 30 },
    { id: 'PA-Rd.', type: 'rect', x: 1686, y: 27, width: 30, height: 110 },
    { id: 'West-Ave.-2', type: 'rect', x: 1200, y: 165, width: 30, height: 188 },
    // ROTUNDAS
    { id: 'G1-Rotunda', type: 'ellipse', cx: 411 + 66 / 2, cy: 968 + 58 / 2, rx: 66 / 2, ry: 58 / 2 },
    { id: 'G3-Rotunda', type: 'ellipse', cx: 1822 + 56 / 2, cy: 124 + 53 / 2, rx: 56 / 2, ry: 53 / 2 },
];

// ─── Graph State ──────────────────────────────────────────────────────────────
let graphNodes = [];       // [{ id, x, y, buildingId }]
let graphEdges = [];       // [{ from, to, weight, type, direction }]
let graphMode = 'node';    // 'node' | 'edge' | 'assign' | 'delete'
let selectedNodeId = null; // id of first selected node (for edge drawing)
let edgeDirection = 'both';
let graphInitialized = false;

// ─── Graph Elements ───────────────────────────────────────────────────────────
const graphMapSvg = document.getElementById('graphMap');
const graphStatus = document.getElementById('graphStatus');
const saveGraphBtn = document.getElementById('saveGraphBtn');
const modeNodeBtn = document.getElementById('modeNodeBtn');
const modeEdgeBtn = document.getElementById('modeEdgeBtn');
const modeAssignBtn = document.getElementById('modeAssignBtn');
const modeDeleteBtn = document.getElementById('modeDeleteBtn');
const edgeOptions = document.getElementById('edgeOptions');
const edgeBothBtn = document.getElementById('edgeBothBtn');
const edgeOneWayBtn = document.getElementById('edgeOneWayBtn');

// ─── Mode Switcher ────────────────────────────────────────────────────────────
function setGraphMode(mode) {
    graphMode = mode;
    selectedNodeId = null;

    [modeNodeBtn, modeEdgeBtn, modeAssignBtn, modeDeleteBtn].forEach(b => b.classList.remove('active'));

    if (mode === 'node') {
        modeNodeBtn.classList.add('active');
        graphStatus.textContent = 'Click anywhere on the map to place a node';
        edgeOptions.classList.add('hidden');
        graphMapSvg.style.cursor = 'crosshair';
    } else if (mode === 'edge') {
        modeEdgeBtn.classList.add('active');
        graphStatus.textContent = 'Click a node to start an edge';
        edgeOptions.classList.remove('hidden');
        graphMapSvg.style.cursor = 'default';
    } else if (mode === 'assign') {
        modeAssignBtn.classList.add('active');
        graphStatus.textContent = 'Click a node, then click a building to assign it';
        edgeOptions.classList.add('hidden');
        graphMapSvg.style.cursor = 'default';
    } else if (mode === 'delete') {
        modeDeleteBtn.classList.add('active');
        graphStatus.textContent = 'Click a node or edge to delete it';
        edgeOptions.classList.add('hidden');
        graphMapSvg.style.cursor = 'default';
    }

    redrawGraph();
}

modeNodeBtn.addEventListener('click', () => setGraphMode('node'));
modeEdgeBtn.addEventListener('click', () => setGraphMode('edge'));
modeAssignBtn.addEventListener('click', () => setGraphMode('assign'));
modeDeleteBtn.addEventListener('click', () => setGraphMode('delete'));

edgeBothBtn.addEventListener('click', () => {
    edgeDirection = 'both';
    edgeBothBtn.classList.add('active');
    edgeOneWayBtn.classList.remove('active');
});
edgeOneWayBtn.addEventListener('click', () => {
    edgeDirection = 'one-way';
    edgeOneWayBtn.classList.add('active');
    edgeBothBtn.classList.remove('active');
});

// ─── Generate Node ID ─────────────────────────────────────────────────────────
function generateNodeId() {
    return 'node_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

// ─── SVG Coordinate Helper ────────────────────────────────────────────────────
function getSVGCoords(e) {
    const svg = graphMapSvg;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: Math.round(svgP.x), y: Math.round(svgP.y) };
}

// ─── Edge Weight (Euclidean distance) ─────────────────────────────────────────
function calcWeight(n1, n2) {
    return Math.round(Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2)));
}

// ─── Render Graph ─────────────────────────────────────────────────────────────
async function renderGraph() {
    if (!graphInitialized) {
        await fetchGraph();
        graphInitialized = true;
    }
    redrawGraph();
}

// ─── Fetch existing graph from backend ───────────────────────────────────────
async function fetchGraph() {
    try {
        const res = await fetch('/api/mapgraph', { headers: { 'Accept': 'application/json' } });
        if (res.ok) {
            const data = await res.json();
            graphNodes = data.nodes || [];
            graphEdges = data.edges || [];
        }
    } catch (err) {
        // No graph yet, start fresh
        graphNodes = [];
        graphEdges = [];
    }
}

// ─── Full SVG Redraw ──────────────────────────────────────────────────────────
function redrawGraph() {
    const ns = 'http://www.w3.org/2000/svg';
    graphMapSvg.innerHTML = '';

    // ── Defs (arrow marker for one-way edges) ──
    const defs = document.createElementNS(ns, 'defs');
    defs.innerHTML = `
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" class="graph-edge-arrow" />
        </marker>
    `;
    graphMapSvg.appendChild(defs);

    // ── Roads (background) ──
    roadData.forEach(r => {
        let elem;
        if (r.type === 'rect') {
            elem = document.createElementNS(ns, 'rect');
            elem.setAttribute('x', r.x);
            elem.setAttribute('y', r.y);
            elem.setAttribute('width', r.width);
            elem.setAttribute('height', r.height);
            if (r.rotate) {
                const cx = r.x + r.width / 2;
                const cy = r.y + r.height / 2;
                elem.setAttribute('transform', `rotate(${r.rotate}, ${cx}, ${cy})`);
            }
        } else if (r.type === 'ellipse') {
            elem = document.createElementNS(ns, 'ellipse');
            elem.setAttribute('cx', r.cx);
            elem.setAttribute('cy', r.cy);
            elem.setAttribute('rx', r.rx);
            elem.setAttribute('ry', r.ry);
        }
        if (!elem) return;
        elem.classList.add('graph-road');
        graphMapSvg.appendChild(elem);
    });

    // ── Ghost Buildings ──
    const assignedBuildingIds = new Set(graphNodes.filter(n => n.buildingId).map(n => n.buildingId));

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

        elem.setAttribute('fill', '#888');
        elem.setAttribute('stroke', '#333');
        elem.setAttribute('stroke-width', '1.5');
        elem.classList.add('ghost-building');
        elem.dataset.buildingId = b.dataId;
        elem.dataset.buildingName = b.name;

        if (assignedBuildingIds.has(b.dataId)) {
            elem.classList.add('assigned');
        }

        if (graphMode === 'assign' && selectedNodeId) {
            elem.classList.add('assignable');
        }

        graphMapSvg.appendChild(elem);
    });

    // ── Edges ──
    graphEdges.forEach(edge => {
        const fromNode = graphNodes.find(n => n.id === edge.from);
        const toNode = graphNodes.find(n => n.id === edge.to);
        if (!fromNode || !toNode) return;

        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', fromNode.x);
        line.setAttribute('y1', fromNode.y);
        line.setAttribute('x2', toNode.x);
        line.setAttribute('y2', toNode.y);
        line.classList.add('graph-edge');

        if (edge.type === 'one-way') {
            line.classList.add('one-way');
            line.setAttribute('marker-end', 'url(#arrowhead)');
        }

        line.dataset.from = edge.from;
        line.dataset.to = edge.to;

        // Delete mode — edges are clickable
        if (graphMode === 'delete') {
            line.style.cursor = 'pointer';
            line.style.pointerEvents = 'all';
            line.addEventListener('click', (e) => {
                e.stopPropagation();
                graphEdges = graphEdges.filter(ed => !(ed.from === edge.from && ed.to === edge.to));
                redrawGraph();
            });
        }

        graphMapSvg.appendChild(line);
    });

    // ── Nodes ──
    graphNodes.forEach(node => {
        const g = document.createElementNS(ns, 'g');

        const circle = document.createElementNS(ns, 'circle');
        circle.setAttribute('cx', node.x);
        circle.setAttribute('cy', node.y);
        circle.setAttribute('r', 6);
        circle.classList.add('graph-node');
        if (node.buildingId) circle.classList.add('assigned');
        if (node.id === selectedNodeId) circle.classList.add('selected');
        circle.dataset.nodeId = node.id;

        // Label if assigned to a building
        if (node.buildingId) {
            const label = document.createElementNS(ns, 'text');
            label.setAttribute('x', node.x);
            label.setAttribute('y', node.y - 10);
            label.classList.add('graph-node-label');
            label.textContent = node.buildingId;
            g.appendChild(label);
        }

        g.appendChild(circle);
        graphMapSvg.appendChild(g);
    });

    // ── SVG Click (place node or handle edge/assign/delete) ──
    graphMapSvg.addEventListener('click', handleGraphClick);
}

// ─── Handle SVG Click ─────────────────────────────────────────────────────────
function handleGraphClick(e) {
    const target = e.target;

    // ── NODE MODE: place a node ──
    if (graphMode === 'node') {
        // Don't place if clicked on existing node
        if (target.classList.contains('graph-node')) return;

        const coords = getSVGCoords(e);
        const newNode = { id: generateNodeId(), x: coords.x, y: coords.y, buildingId: null };
        graphNodes.push(newNode);
        graphStatus.textContent = `Node placed at (${coords.x}, ${coords.y})`;
        redrawGraph();
        return;
    }

    // ── EDGE MODE: connect two nodes ──
    if (graphMode === 'edge') {
        if (!target.classList.contains('graph-node')) {
            // Clicked empty space — deselect
            if (selectedNodeId) {
                selectedNodeId = null;
                graphStatus.textContent = 'Click a node to start an edge';
                redrawGraph();
            }
            return;
        }

        const clickedId = target.dataset.nodeId;

        if (!selectedNodeId) {
            // First node selected
            selectedNodeId = clickedId;
            graphStatus.textContent = 'Now click another node to connect';
            redrawGraph();
            return;
        }

        if (selectedNodeId === clickedId) {
            // Clicked same node — deselect
            selectedNodeId = null;
            graphStatus.textContent = 'Click a node to start an edge';
            redrawGraph();
            return;
        }

        // Check edge limit (max 10 per node)
        const fromCount = graphEdges.filter(ed => ed.from === selectedNodeId || ed.to === selectedNodeId).length;
        const toCount = graphEdges.filter(ed => ed.from === clickedId || ed.to === clickedId).length;

        if (fromCount >= 10 || toCount >= 10) {
            showToast('error', 'A node can have at most 10 connections.');
            selectedNodeId = null;
            redrawGraph();
            return;
        }

        // Check if edge already exists
        const exists = graphEdges.some(
            ed => (ed.from === selectedNodeId && ed.to === clickedId) ||
                  (ed.from === clickedId && ed.to === selectedNodeId)
        );
        if (exists) {
            showToast('error', 'These nodes are already connected.');
            selectedNodeId = null;
            redrawGraph();
            return;
        }

        // Create edge
        const fromNode = graphNodes.find(n => n.id === selectedNodeId);
        const toNode = graphNodes.find(n => n.id === clickedId);
        const weight = calcWeight(fromNode, toNode);

        graphEdges.push({
            from: selectedNodeId,
            to: clickedId,
            weight,
            type: edgeDirection,
            direction: edgeDirection === 'one-way' ? 'from→to' : null
        });

        graphStatus.textContent = `Connected! Weight: ${weight}px. Click another node to continue.`;
        selectedNodeId = clickedId; // allow chaining
        redrawGraph();
        return;
    }

    // ── ASSIGN MODE: assign building to node ──
    if (graphMode === 'assign') {
        // Clicked a node → select it
        if (target.classList.contains('graph-node')) {
            selectedNodeId = target.dataset.nodeId;
            const node = graphNodes.find(n => n.id === selectedNodeId);
            const currentAssignment = node.buildingId ? ` (currently: ${node.buildingId})` : '';
            graphStatus.textContent = `Node selected${currentAssignment}. Now click a building to assign.`;
            redrawGraph();
            return;
        }

        // Clicked a ghost building → assign to selected node
        if (target.classList.contains('ghost-building') && selectedNodeId) {
            const buildingId = target.dataset.buildingId;
            const buildingName = target.dataset.buildingName;

            const node = graphNodes.find(n => n.id === selectedNodeId);
            if (node) {
                // Remove old assignment for this building if any
                graphNodes.forEach(n => {
                    if (n.buildingId === buildingId) n.buildingId = null;
                });
                node.buildingId = buildingId;
                graphStatus.textContent = `Assigned "${buildingName}" to node. Select another node to continue.`;
                selectedNodeId = null;
                redrawGraph();
            }
            return;
        }

        // Clicked empty space — deselect
        if (!target.classList.contains('graph-node') && !target.classList.contains('ghost-building')) {
            selectedNodeId = null;
            graphStatus.textContent = 'Click a node, then click a building to assign it';
            redrawGraph();
        }
        return;
    }

    // ── DELETE MODE: delete node ──
    if (graphMode === 'delete') {
        if (target.classList.contains('graph-node')) {
            const nodeId = target.dataset.nodeId;
            // Remove node and all its edges
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
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ nodes: graphNodes, edges: graphEdges })
        });
        const data = await res.json();
        if (!res.ok) {
            showToast('error', data.error || 'Failed to save graph.');
        } else {
            showToast('success', 'Graph saved successfully!');
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