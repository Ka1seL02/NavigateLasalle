import showToast from './toast.js';
import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── State ────────────────────────────────────────────────────────────────────
let shapeType = 'rect';
let shapeData = { type: 'rect', x: 900, y: 500, width: 100, height: 60 };
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let newShapeEl = null;
let newFiles = [];
let confirmedShape = null;
let existingBuildings = [];
let getSVGCoords = null; // set by initZoomPan

// ─── Elements ─────────────────────────────────────────────────────────────────
const svg = document.getElementById('addCampusMap');
const rectBtn = document.getElementById('rectBtn');
const ellipseBtn = document.getElementById('ellipseBtn');
const rectDimensions = document.getElementById('rectDimensions');
const ellipseDimensions = document.getElementById('ellipseDimensions');
const applyShapeBtn = document.getElementById('applyShapeBtn');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const confirmPositionBtn = document.getElementById('confirmPositionBtn');
const backToStep1Btn = document.getElementById('backToStep1Btn');

// ─── Zoom / Pan ───────────────────────────────────────────────────────────────
function initZoomPan(svgEl) {
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
        svgEl.setAttribute('viewBox', `${-panX / scale} ${-panY / scale} ${VIEWBOX_W / scale} ${VIEWBOX_H / scale}`);
    }

    svgEl.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * delta));
        const svgRect = svgEl.getBoundingClientRect();
        const mouseX = e.clientX - svgRect.left;
        const mouseY = e.clientY - svgRect.top;
        panX = mouseX - (mouseX - panX) * (newScale / scale);
        panY = mouseY - (mouseY - panY) * (newScale / scale);
        scale = newScale;
        applyTransform();
    }, { passive: false });

    svgEl.addEventListener('mousedown', (e) => {
        if (e.button === 1 || e.altKey) {
            e.preventDefault();
            isPanning = true;
            panStart = { x: e.clientX - panX, y: e.clientY - panY };
            svgEl.style.cursor = 'grabbing';
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
            svgEl.style.cursor = '';
        }
    });

    svgEl.addEventListener('contextmenu', (e) => e.preventDefault());
    applyTransform();

    return function getCoords(e) {
        const pt = svgEl.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        return pt.matrixTransform(svgEl.getScreenCTM().inverse());
    };
}

// ─── Overlap Detection ────────────────────────────────────────────────────────
function getBoundingBox(shape) {
    if (shape.type === 'rect') {
        return {
            x: parseFloat(shape.x),
            y: parseFloat(shape.y),
            width: parseFloat(shape.width),
            height: parseFloat(shape.height)
        };
    } else {
        return {
            x: parseFloat(shape.cx) - parseFloat(shape.rx),
            y: parseFloat(shape.cy) - parseFloat(shape.ry),
            width: parseFloat(shape.rx) * 2,
            height: parseFloat(shape.ry) * 2
        };
    }
}

function isOverlapping(a, b) {
    return !(
        a.x + a.width < b.x ||
        b.x + b.width < a.x ||
        a.y + a.height < b.y ||
        b.y + b.height < a.y
    );
}

// ─── Load Existing Buildings on Map ──────────────────────────────────────────
async function loadExistingBuildings() {
    try {
        const res = await fetch('/api/buildings', { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        const ns = 'http://www.w3.org/2000/svg';

        existingBuildings = data.buildings.filter(b => b.category !== 'road');

        data.buildings.forEach(b => {
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

            if (b.category === 'road') {
                elem.classList.add('existing');
                elem.setAttribute('fill', '#cecece');
                elem.setAttribute('stroke', 'none');
            } else {
                elem.classList.add('existing');
                elem.setAttribute('fill', '#ccc');
                elem.setAttribute('stroke', '#999');
                elem.setAttribute('stroke-width', '1');
            }

            svg.appendChild(elem);
        });

    } catch (err) {
        console.error('Failed to load existing buildings');
    }
}

// ─── Create/Update New Shape ──────────────────────────────────────────────────
function createNewShape() {
    if (newShapeEl) newShapeEl.remove();

    const ns = 'http://www.w3.org/2000/svg';

    if (shapeType === 'rect') {
        newShapeEl = document.createElementNS(ns, 'rect');
        newShapeEl.setAttribute('x', shapeData.x);
        newShapeEl.setAttribute('y', shapeData.y);
        newShapeEl.setAttribute('width', shapeData.width);
        newShapeEl.setAttribute('height', shapeData.height);
        if (shapeData.rotate) {
            const cx = shapeData.x + shapeData.width / 2;
            const cy = shapeData.y + shapeData.height / 2;
            newShapeEl.setAttribute('transform', `rotate(${shapeData.rotate}, ${cx}, ${cy})`);
        }
    } else {
        newShapeEl = document.createElementNS(ns, 'ellipse');
        newShapeEl.setAttribute('cx', shapeData.cx);
        newShapeEl.setAttribute('cy', shapeData.cy);
        newShapeEl.setAttribute('rx', shapeData.rx);
        newShapeEl.setAttribute('ry', shapeData.ry);
    }

    newShapeEl.classList.add('new-shape');
    svg.appendChild(newShapeEl);
    updatePositionDisplay();
}

// ─── Update Position Display ──────────────────────────────────────────────────
function updatePositionDisplay() {
    if (shapeType === 'rect') {
        document.getElementById('posX').textContent = Math.round(shapeData.x);
        document.getElementById('posY').textContent = Math.round(shapeData.y);
        document.getElementById('posW').textContent = Math.round(shapeData.width);
        document.getElementById('posH').textContent = Math.round(shapeData.height);
        document.getElementById('posRect').classList.remove('hidden');
        document.getElementById('posEllipse').classList.add('hidden');
    } else {
        document.getElementById('posCx').textContent = Math.round(shapeData.cx);
        document.getElementById('posCy').textContent = Math.round(shapeData.cy);
        document.getElementById('posRx').textContent = Math.round(shapeData.rx);
        document.getElementById('posRy').textContent = Math.round(shapeData.ry);
        document.getElementById('posEllipse').classList.remove('hidden');
        document.getElementById('posRect').classList.add('hidden');
    }
}

// ─── Drag Logic ───────────────────────────────────────────────────────────────
function startDrag(e) {
    if (e.altKey) return; // let alt+drag pan the map
    e.preventDefault();
    isDragging = true;
    const coords = getSVGCoords(e);

    if (shapeType === 'rect') {
        dragOffsetX = coords.x - shapeData.x;
        dragOffsetY = coords.y - shapeData.y;
    } else {
        dragOffsetX = coords.x - shapeData.cx;
        dragOffsetY = coords.y - shapeData.cy;
    }
}

svg.addEventListener('mousemove', (e) => {
    if (!isDragging || !newShapeEl) return;
    const coords = getSVGCoords(e);

    if (shapeType === 'rect') {
        shapeData.x = coords.x - dragOffsetX;
        shapeData.y = coords.y - dragOffsetY;
        newShapeEl.setAttribute('x', shapeData.x);
        newShapeEl.setAttribute('y', shapeData.y);
        if (shapeData.rotate) {
            const cx = shapeData.x + shapeData.width / 2;
            const cy = shapeData.y + shapeData.height / 2;
            newShapeEl.setAttribute('transform', `rotate(${shapeData.rotate}, ${cx}, ${cy})`);
        }
    } else {
        shapeData.cx = coords.x - dragOffsetX;
        shapeData.cy = coords.y - dragOffsetY;
        newShapeEl.setAttribute('cx', shapeData.cx);
        newShapeEl.setAttribute('cy', shapeData.cy);
    }

    updatePositionDisplay();
});

svg.addEventListener('mouseup', () => { isDragging = false; });
svg.addEventListener('mouseleave', () => { isDragging = false; });

// ─── Shape Type Toggle ────────────────────────────────────────────────────────
rectBtn.addEventListener('click', () => {
    shapeType = 'rect';
    rectBtn.classList.add('active');
    ellipseBtn.classList.remove('active');
    rectDimensions.classList.remove('hidden');
    ellipseDimensions.classList.add('hidden');
    shapeData = { type: 'rect', x: 900, y: 500, width: 100, height: 60 };
    createNewShape();
});

ellipseBtn.addEventListener('click', () => {
    shapeType = 'ellipse';
    ellipseBtn.classList.add('active');
    rectBtn.classList.remove('active');
    ellipseDimensions.classList.remove('hidden');
    rectDimensions.classList.add('hidden');
    shapeData = { type: 'ellipse', cx: 960, cy: 540, rx: 50, ry: 30 };
    createNewShape();
});

// ─── Apply Dimensions ─────────────────────────────────────────────────────────
applyShapeBtn.addEventListener('click', () => {
    if (shapeType === 'rect') {
        shapeData.width = parseFloat(document.getElementById('shapeWidth').value) || 100;
        shapeData.height = parseFloat(document.getElementById('shapeHeight').value) || 60;
        shapeData.rotate = parseFloat(document.getElementById('shapeRotate').value) || 0;
    } else {
        shapeData.rx = parseFloat(document.getElementById('shapeRx').value) || 50;
        shapeData.ry = parseFloat(document.getElementById('shapeRy').value) || 30;
    }
    createNewShape();
});

// ─── Confirm Position ─────────────────────────────────────────────────────────
confirmPositionBtn.addEventListener('click', () => {
    const newBox = getBoundingBox({ ...shapeData, type: shapeType });

    const overlapping = existingBuildings.some(b => {
        if (!b.shape) return false;
        const existingBox = getBoundingBox(b.shape);
        return isOverlapping(newBox, existingBox);
    });

    if (overlapping) {
        showToast('error', 'This shape overlaps an existing building. Please reposition it.');
        return;
    }

    confirmedShape = { ...shapeData, type: shapeType };
    step1.classList.add('hidden');
    step2.classList.remove('hidden');
    showToast('success', 'Position confirmed! Fill in the building details.');
});

// ─── Back to Step 1 ───────────────────────────────────────────────────────────
backToStep1Btn.addEventListener('click', () => {
    step2.classList.add('hidden');
    step1.classList.remove('hidden');
});

// ─── Quill Editor ─────────────────────────────────────────────────────────────
const quill = new Quill('#quillEditor', {
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

// ─── Visibility Toggle ────────────────────────────────────────────────────────
const isVisibleInput = document.getElementById('isVisible');
const visibilityLabel = document.getElementById('visibilityLabel');
isVisibleInput.addEventListener('change', () => {
    visibilityLabel.textContent = isVisibleInput.checked ? 'Open' : 'Under Maintenance';
});

// ─── Image Upload ─────────────────────────────────────────────────────────────
const imageInput = document.getElementById('imageInput');
const newImagePreviews = document.getElementById('newImagePreviews');

imageInput.addEventListener('change', () => {
    const files = Array.from(imageInput.files);
    files.forEach(file => {
        newFiles.push(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            const item = document.createElement('div');
            item.classList.add('preview-item');
            item.dataset.name = file.name;
            item.innerHTML = `
                <img src="${e.target.result}" alt="Preview" />
                <button class="remove-preview-btn" data-name="${file.name}">
                    <i class='bx bx-x'></i>
                </button>
            `;
            item.querySelector('.remove-preview-btn').addEventListener('click', () => {
                newFiles = newFiles.filter(f => f.name !== file.name);
                item.remove();
            });
            newImagePreviews.appendChild(item);
        };
        reader.readAsDataURL(file);
    });
    imageInput.value = '';
});

// ─── Save ─────────────────────────────────────────────────────────────────────
document.getElementById('saveBtn').addEventListener('click', async () => {
    const name = document.getElementById('name').value.trim();
    const dataId = document.getElementById('dataId').value.trim();
    const category = document.getElementById('category').value;
    const isVisible = document.getElementById('isVisible').checked;
    const descriptionContent = quill.root.innerHTML;
    const description = descriptionContent === '<p><br></p>' ? null : descriptionContent;

    if (!name || !dataId || !category) {
        showToast('error', 'Name, Building ID and Category are required.');
        return;
    }

    if (!confirmedShape) {
        showToast('error', 'Please confirm the position on the map first.');
        return;
    }

    await showLoading();

    try {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('dataId', dataId);
        formData.append('category', category);
        formData.append('description', description || '');
        formData.append('isVisible', isVisible);
        formData.append('shape', JSON.stringify(confirmedShape));

        newFiles.forEach(file => {
            formData.append('images', file);
        });

        const res = await fetch('/api/buildings', {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: formData
        });

        const data = await res.json();

        if (!res.ok) {
            showToast('error', data.error || 'Failed to create building.');
            return;
        }

        showToast('success', 'Building created successfully!');
        setTimeout(() => {
            window.location.href = 'building.html';
        }, 1500);

    } catch (err) {
        showToast('error', 'Failed to create building.');
    } finally {
        hideLoading();
    }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
await loadExistingBuildings();

// Init zoom/pan — replaces the old getSVGCoords function
getSVGCoords = initZoomPan(svg);

createNewShape();

// Wire drag after shape is created
svg.addEventListener('mousedown', (e) => {
    if (e.target === newShapeEl) {
        startDrag(e);
    }
});