// ====== GLOBAL STATE ======
let locations = [];
let currentMode = 'select'; // 'select', 'move', 'add-rect', 'add-ellipse'
let selectedLocation = null;
let isCreatingShape = false;
let tempShape = null;
let startPoint = { x: 0, y: 0 };
let currentEditingId = null;

// ====== DOM ELEMENTS ======
const buildingsListView = document.getElementById('buildingsListView');
const mapEditorView = document.getElementById('mapEditorView');
const buildingsTableBody = document.getElementById('buildingsTableBody');
const searchInput = document.getElementById('searchBuildings');
const filterType = document.getElementById('filterType');
const filterSection = document.getElementById('filterSection');
const svg = document.getElementById('adminCampusMap');

// ====== INIT ======
document.addEventListener('DOMContentLoaded', () => {
    loadLocations();
    initializeEventListeners();
});

// ====== LOAD LOCATIONS FROM API ======
async function loadLocations() {
    try {
        const response = await fetch('/api/locations');
        const result = await response.json();
        
        if (result.success) {
            locations = result.data;
            renderLocationsTable();
            console.log('✅ Loaded', locations.length, 'locations');
        } else {
            customNotification('error', 'Error', 'Failed to load locations');
        }
    } catch (error) {
        console.error('Error loading locations:', error);
        customNotification('error', 'Error', 'Failed to load locations');
    }
}

// ====== RENDER LOCATIONS TABLE ======
function renderLocationsTable() {
    const searchTerm = searchInput.value.toLowerCase();
    const typeFilter = filterType.value;
    const sectionFilter = filterSection.value;
    
    let filtered = locations.filter(loc => {
        const matchesSearch = loc.name.toLowerCase().includes(searchTerm) || 
                             loc.code.toLowerCase().includes(searchTerm);
        const matchesType = !typeFilter || loc.type === typeFilter;
        const matchesSection = !sectionFilter || loc.section === sectionFilter;
        
        return matchesSearch && matchesType && matchesSection;
    });
    
    if (filtered.length === 0) {
        buildingsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class='bx bx-building'></i>
                    <h3>No locations found</h3>
                    <p>Try adjusting your filters or add a new location</p>
                </td>
            </tr>
        `;
        return;
    }
    
    buildingsTableBody.innerHTML = filtered.map(loc => `
    <tr>
        <td><strong>${loc.code}</strong></td>
        <td>${loc.name}</td>
        <td><span class="badge badge-${loc.type}">${loc.type}</span></td>
        <td>${loc.section ? `<span class="badge badge-${loc.section}">${loc.section}</span>` : '-'}</td>
        <td>${loc.images && loc.images.length > 0 ? loc.images.length : '-'}</td>
        <td>${loc.offices && loc.offices.length > 0 ? loc.offices.length : '-'}</td>
        <td>${loc.departments && loc.departments.length > 0 ? loc.departments.length : '-'}</td>
        <td>
            <div class="action-btns">
                <button class="icon-btn edit" onclick="editLocation('${loc._id}')" title="Edit">
                    <i class='bx bx-edit'></i>
                </button>
                <button class="icon-btn delete" onclick="deleteLocation('${loc._id}', '${loc.code}')" title="Delete">
                    <i class='bx bx-trash'></i>
                </button>
            </div>
        </td>
    </tr>
    `).join('');
}

// ====== INITIALIZE EVENT LISTENERS ======
function initializeEventListeners() {
    // Search and filters
    searchInput.addEventListener('input', renderLocationsTable);
    filterType.addEventListener('change', renderLocationsTable);
    filterSection.addEventListener('change', renderLocationsTable);
    
    // View buttons
    document.getElementById('viewMapBtn')?.addEventListener('click', () => {
        buildingsListView.style.display = 'none';
        mapEditorView.style.display = 'block';
        renderMapEditor();
    });
    
    document.getElementById('closeEditorBtn')?.addEventListener('click', () => {
        mapEditorView.style.display = 'none';
        buildingsListView.style.display = 'block';
        currentMode = 'select';
    });
    
    document.getElementById('addBuildingBtn')?.addEventListener('click', () => {
        buildingsListView.style.display = 'none';
        mapEditorView.style.display = 'block';
        currentMode = 'add-rect';
        setActiveMode('add-rect');
        renderMapEditor();
    });
    
    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            if (mode) {
                currentMode = mode;
                setActiveMode(mode);
            }
        });
    });
    
    // Edit form submission
    document.getElementById('editBuildingForm')?.addEventListener('submit', handleEditFormSubmit);
    
    // Add image button
    document.getElementById('addImageBtn')?.addEventListener('click', () => {
        document.getElementById('imageUploadInput').click();
    });
    
    document.getElementById('imageUploadInput')?.addEventListener('change', handleImageUpload);
    
    // Add office/department buttons
    document.getElementById('addOfficeBtn')?.addEventListener('click', addOfficeItem);
    document.getElementById('addDepartmentBtn')?.addEventListener('click', addDepartmentItem);
}

// ====== SET ACTIVE MODE ======
function setActiveMode(mode) {
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`)?.classList.add('active');
    
    svg.className = '';
    if (mode === 'move') svg.classList.add('mode-move');
    if (mode.startsWith('add-')) svg.classList.add('mode-add');
}

// ====== RENDER MAP EDITOR ======
function renderMapEditor() {
    svg.innerHTML = '';
    
    locations.forEach(loc => {
        const elem = createSVGElement(loc);
        elem.classList.add('admin-building');
        elem.dataset.locationId = loc._id;
        
        // Add click handler based on mode
        elem.addEventListener('click', (e) => handleBuildingClick(e, loc));
        
        svg.appendChild(elem);
    });
}

// ====== CREATE SVG ELEMENT ======
function createSVGElement(location) {
    const { shape } = location;
    let elem;
    
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
    
    elem.setAttribute('fill', 'white');
    elem.setAttribute('stroke', 'black');
    elem.setAttribute('stroke-width', '2');
    elem.classList.add(location.type);
    
    return elem;
}

// ====== HANDLE BUILDING CLICK ======
function handleBuildingClick(e, location) {
    e.stopPropagation();
    
    if (currentMode === 'select') {
        // Deselect previous
        document.querySelectorAll('.admin-building').forEach(el => el.classList.remove('selected'));
        // Select current
        e.target.classList.add('selected');
        selectedLocation = location;
        
        // Open edit modal
        editLocation(location._id);
    } else if (currentMode === 'move') {
        // TODO: Implement move functionality
        customNotification('info', 'Move Mode', 'Click and drag to move this location');
    }
}

// ====== EDIT LOCATION ======
window.editLocation = function(locationId) {
    const location = locations.find(l => l._id === locationId);
    if (!location) return;
    
    currentEditingId = locationId;
    
    // Populate form
    document.getElementById('editBuildingId').value = locationId;
    document.getElementById('editCode').value = location.code;
    document.getElementById('editName').value = location.name;
    document.getElementById('editType').value = location.type;
    document.getElementById('editSection').value = location.section || '';
    document.getElementById('editDescription').value = location.description || '';
    
    // Populate images
    renderImageGallery(location.images || []);
    
    // Populate offices
    renderOfficesList(location.offices || []);
    
    // Populate departments
    renderDepartmentsList(location.departments || []);
    
    openModal('editBuildingModal');
};

// ====== DELETE LOCATION ======
window.deleteLocation = function(locationId, code) {
    showConfirmModal({
        icon: 'bx-trash',
        iconColor: 'var(--red)',
        title: 'Delete Location',
        message: `Are you sure you want to delete "${code}"? This will also delete all associated images from Cloudinary.`,
        confirmText: 'Yes, Delete',
        confirmColor: 'var(--red)',
        onConfirm: async (btn) => {
            btn.disabled = true;
            btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Deleting...';
            
            try {
                // Get location to access images
                const location = locations.find(l => l._id === locationId);
                
                // Delete images from Cloudinary first
                if (location.images && location.images.length > 0) {
                    for (const img of location.images) {
                        await deleteImageFromCloudinary(img.publicId);
                    }
                }
                
                // Delete location from database
                const response = await fetch(`/api/locations/${code}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    customNotification('success', 'Deleted', 'Location deleted successfully');
                    loadLocations(); // Reload list
                } else {
                    customNotification('error', 'Error', 'Failed to delete location');
                }
            } catch (error) {
                console.error('Error deleting location:', error);
                customNotification('error', 'Error', 'Failed to delete location');
            }
        }
    });
};

// ====== IMAGE GALLERY MANAGEMENT ======
function renderImageGallery(images) {
    const gallery = document.getElementById('editImageGallery');
    
    // Check if images exist and have items
    if (!images || !Array.isArray(images) || images.length === 0) {
        gallery.innerHTML = '<p style="color: var(--grey); font-size: 14px;">No images uploaded yet</p>';
        return;
    }
    
    gallery.innerHTML = images.map((img, index) => {
        // Skip if image doesn't have required properties
        if (!img || !img.imageUrl) {
            return '';
        }
        
        return `
            <div class="image-item" data-index="${index}">
                <img src="${img.imageUrl}" alt="Location image" onerror="this.parentElement.style.display='none'">
                <div class="image-item-actions">
                    <button type="button" onclick="removeImage(${index})" title="Remove">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ====== HANDLE IMAGE UPLOAD ======
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Show loading notification
    const loadingNotif = customNotification('info', 'Uploading', 'Uploading image...');
    
    try {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('/api/upload/location-image', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Add to current editing location
            const location = locations.find(l => l._id === currentEditingId);
            if (!location.images) location.images = [];
            
            location.images.push({
                imageUrl: result.imageUrl,
                publicId: result.publicId
            });
            
            renderImageGallery(location.images);
            customNotification('success', 'Success', 'Image uploaded successfully');
        } else {
            customNotification('error', 'Error', result.message || 'Failed to upload image');
        }
    } catch (error) {
        console.error('Upload error:', error);
        customNotification('error', 'Error', 'Failed to upload image');
    }
    
    // Reset input
    e.target.value = '';
}

// ====== REMOVE IMAGE ======
window.removeImage = function(index) {
    const location = locations.find(l => l._id === currentEditingId);
    if (!location || !location.images) return;
    
    const image = location.images[index];
    
    showConfirmModal({
        icon: 'bx-trash',
        iconColor: 'var(--red)',
        title: 'Remove Image',
        message: 'Are you sure you want to remove this image? It will be deleted from Cloudinary.',
        confirmText: 'Yes, Remove',
        confirmColor: 'var(--red)',
        onConfirm: async (btn) => {
            btn.disabled = true;
            btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Removing...';
            
            try {
                // Delete from Cloudinary
                await deleteImageFromCloudinary(image.publicId);
                
                // Remove from array
                location.images.splice(index, 1);
                
                // Re-render gallery
                renderImageGallery(location.images);
                
                customNotification('success', 'Removed', 'Image removed successfully');
            } catch (error) {
                console.error('Error removing image:', error);
                customNotification('error', 'Error', 'Failed to remove image');
            }
        }
    });
};

// ====== DELETE IMAGE FROM CLOUDINARY ======
async function deleteImageFromCloudinary(publicId) {
    try {
        const encodedPublicId = publicId.replace(/\//g, '_');
        const response = await fetch(`/api/upload/location-image/${encodedPublicId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete from Cloudinary');
        }
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
    }
}

// ====== OFFICES LIST MANAGEMENT ======
function renderOfficesList(offices) {
    const container = document.getElementById('officesList');
    
    if (!offices || offices.length === 0) {
        container.innerHTML = '<p style="color: var(--grey); font-size: 14px;">No offices added yet</p>';
        return;
    }
    
    container.innerHTML = offices.map((office, index) => `
        <div class="office-item" data-index="${index}">
            <div class="item-header">
                <input type="text" value="${office.name || ''}" placeholder="Office name" onchange="updateOfficeName(${index}, this.value)">
                <button type="button" class="remove-item-btn" onclick="removeOffice(${index})">
                    <i class='bx bx-x'></i>
                </button>
            </div>
            <div class="form-group">
                <label>Floor</label>
                <input type="text" value="${office.floor || ''}" placeholder="e.g. Ground Floor" onchange="updateOfficeFloor(${index}, this.value)">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Phone</label>
                    <input type="text" value="${office.contact?.phone || ''}" placeholder="+63 123 456 7890" onchange="updateOfficePhone(${index}, this.value)">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" value="${office.contact?.email || ''}" placeholder="office@dlsud.edu.ph" onchange="updateOfficeEmail(${index}, this.value)">
                </div>
            </div>
        </div>
    `).join('');
}

function addOfficeItem() {
    const location = locations.find(l => l._id === currentEditingId);
    if (!location) return;
    
    if (!location.offices) location.offices = [];
    
    location.offices.push({
        name: '',
        floor: '',
        contact: { phone: '', email: '' }
    });
    
    renderOfficesList(location.offices);
}

window.removeOffice = function(index) {
    const location = locations.find(l => l._id === currentEditingId);
    if (!location || !location.offices) return;
    
    location.offices.splice(index, 1);
    renderOfficesList(location.offices);
};

window.updateOfficeName = function(index, value) {
    const location = locations.find(l => l._id === currentEditingId);
    if (location && location.offices && location.offices[index]) {
        location.offices[index].name = value;
    }
};

window.updateOfficeFloor = function(index, value) {
    const location = locations.find(l => l._id === currentEditingId);
    if (location && location.offices && location.offices[index]) {
        location.offices[index].floor = value;
    }
};

window.updateOfficePhone = function(index, value) {
    const location = locations.find(l => l._id === currentEditingId);
    if (location && location.offices && location.offices[index]) {
        if (!location.offices[index].contact) location.offices[index].contact = {};
        location.offices[index].contact.phone = value;
    }
};

window.updateOfficeEmail = function(index, value) {
    const location = locations.find(l => l._id === currentEditingId);
    if (location && location.offices && location.offices[index]) {
        if (!location.offices[index].contact) location.offices[index].contact = {};
        location.offices[index].contact.email = value;
    }
};

// ====== DEPARTMENTS LIST MANAGEMENT ======
function renderDepartmentsList(departments) {
    const container = document.getElementById('departmentsList');
    
    if (!departments || departments.length === 0) {
        container.innerHTML = '<p style="color: var(--grey); font-size: 14px;">No departments added yet</p>';
        return;
    }
    
    container.innerHTML = departments.map((dept, index) => `
        <div class="department-item" data-index="${index}">
            <div class="item-header">
                <input type="text" value="${dept.name || ''}" placeholder="Department name" onchange="updateDepartmentName(${index}, this.value)">
                <button type="button" class="remove-item-btn" onclick="removeDepartment(${index})">
                    <i class='bx bx-x'></i>
                </button>
            </div>
            <div class="form-group">
                <label>Floor</label>
                <input type="text" value="${dept.floor || ''}" placeholder="e.g. 2nd Floor" onchange="updateDepartmentFloor(${index}, this.value)">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Phone</label>
                    <input type="text" value="${dept.contact?.phone || ''}" placeholder="+63 123 456 7890" onchange="updateDepartmentPhone(${index}, this.value)">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" value="${dept.contact?.email || ''}" placeholder="dept@dlsud.edu.ph" onchange="updateDepartmentEmail(${index}, this.value)">
                </div>
            </div>
        </div>
    `).join('');
}

function addDepartmentItem() {
    const location = locations.find(l => l._id === currentEditingId);
    if (!location) return;
    
    if (!location.departments) location.departments = [];
    
    location.departments.push({
        name: '',
        floor: '',
        contact: { phone: '', email: '' }
    });
    
    renderDepartmentsList(location.departments);
}

window.removeDepartment = function(index) {
    const location = locations.find(l => l._id === currentEditingId);
    if (!location || !location.departments) return;
    
    location.departments.splice(index, 1);
    renderDepartmentsList(location.departments);
};

window.updateDepartmentName = function(index, value) {
    const location = locations.find(l => l._id === currentEditingId);
    if (location && location.departments && location.departments[index]) {
        location.departments[index].name = value;
    }
};

window.updateDepartmentFloor = function(index, value) {
    const location = locations.find(l => l._id === currentEditingId);
    if (location && location.departments && location.departments[index]) {
        location.departments[index].floor = value;
    }
};

window.updateDepartmentPhone = function(index, value) {
    const location = locations.find(l => l._id === currentEditingId);
    if (location && location.departments && location.departments[index]) {
        if (!location.departments[index].contact) location.departments[index].contact = {};
        location.departments[index].contact.phone = value;
    }
};

window.updateDepartmentEmail = function(index, value) {
    const location = locations.find(l => l._id === currentEditingId);
    if (location && location.departments && location.departments[index]) {
        if (!location.departments[index].contact) location.departments[index].contact = {};
        location.departments[index].contact.email = value;
    }
};

// ====== HANDLE EDIT FORM SUBMIT ======
async function handleEditFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Saving...';
    
    try {
        const location = locations.find(l => l._id === currentEditingId);
        if (!location) return;
        
        // Update location data
        location.code = document.getElementById('editCode').value.toUpperCase();
        location.name = document.getElementById('editName').value;
        location.type = document.getElementById('editType').value;
        location.section = document.getElementById('editSection').value || null;
        location.description = document.getElementById('editDescription').value;
        
        // Send to API
        const response = await fetch(`/api/locations/${location.code}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(location)
        });
        
        if (response.ok) {
            customNotification('success', 'Success', 'Location updated successfully');
            closeModal('editBuildingModal');
            loadLocations(); // Reload
        } else {
            customNotification('error', 'Error', 'Failed to update location');
        }
    } catch (error) {
        console.error('Update error:', error);
        customNotification('error', 'Error', 'Failed to update location');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Save Changes';
    }
}

// ====== SHAPE CREATION MODE ======
let newShapeData = null;

// Initialize SVG mouse events for shape creation
svg.addEventListener('mousedown', handleSVGMouseDown);
svg.addEventListener('mousemove', handleSVGMouseMove);
svg.addEventListener('mouseup', handleSVGMouseUp);

function handleSVGMouseDown(e) {
    if (!currentMode.startsWith('add-')) return;
    if (e.target !== svg) return; // Only on empty canvas
    
    isCreatingShape = true;
    const rect = svg.getBoundingClientRect();
    const svgPoint = getSVGPoint(e, rect);
    
    startPoint = { x: svgPoint.x, y: svgPoint.y };
    
    // Create temporary shape
    if (currentMode === 'add-rect') {
        tempShape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        tempShape.setAttribute('x', startPoint.x);
        tempShape.setAttribute('y', startPoint.y);
        tempShape.setAttribute('width', 0);
        tempShape.setAttribute('height', 0);
    } else if (currentMode === 'add-ellipse') {
        tempShape = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        tempShape.setAttribute('cx', startPoint.x);
        tempShape.setAttribute('cy', startPoint.y);
        tempShape.setAttribute('rx', 0);
        tempShape.setAttribute('ry', 0);
    }
    
    tempShape.classList.add('temp-shape');
    svg.appendChild(tempShape);
}

function handleSVGMouseMove(e) {
    if (!isCreatingShape || !tempShape) return;
    
    const rect = svg.getBoundingClientRect();
    const svgPoint = getSVGPoint(e, rect);
    
    if (currentMode === 'add-rect') {
        const width = Math.abs(svgPoint.x - startPoint.x);
        const height = Math.abs(svgPoint.y - startPoint.y);
        const x = Math.min(startPoint.x, svgPoint.x);
        const y = Math.min(startPoint.y, svgPoint.y);
        
        tempShape.setAttribute('x', x);
        tempShape.setAttribute('y', y);
        tempShape.setAttribute('width', width);
        tempShape.setAttribute('height', height);
    } else if (currentMode === 'add-ellipse') {
        const rx = Math.abs(svgPoint.x - startPoint.x);
        const ry = Math.abs(svgPoint.y - startPoint.y);
        
        tempShape.setAttribute('rx', rx);
        tempShape.setAttribute('ry', ry);
    }
}

function handleSVGMouseUp(e) {
    if (!isCreatingShape || !tempShape) return;
    
    isCreatingShape = false;
    
    // Get final dimensions
    if (currentMode === 'add-rect') {
        const x = parseFloat(tempShape.getAttribute('x'));
        const y = parseFloat(tempShape.getAttribute('y'));
        const width = parseFloat(tempShape.getAttribute('width'));
        const height = parseFloat(tempShape.getAttribute('height'));
        
        // Minimum size check
        if (width < 20 || height < 20) {
            tempShape.remove();
            tempShape = null;
            customNotification('error', 'Too Small', 'Shape must be at least 20x20 pixels');
            return;
        }
        
        newShapeData = {
            type: 'rect',
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(width),
            height: Math.round(height),
            rotate: 0
        };
    } else if (currentMode === 'add-ellipse') {
        const cx = parseFloat(tempShape.getAttribute('cx'));
        const cy = parseFloat(tempShape.getAttribute('cy'));
        const rx = parseFloat(tempShape.getAttribute('rx'));
        const ry = parseFloat(tempShape.getAttribute('ry'));
        
        // Minimum size check
        if (rx < 10 || ry < 10) {
            tempShape.remove();
            tempShape = null;
            customNotification('error', 'Too Small', 'Shape must be at least 20x20 pixels');
            return;
        }
        
        newShapeData = {
            type: 'ellipse',
            cx: Math.round(cx),
            cy: Math.round(cy),
            rx: Math.round(rx),
            ry: Math.round(ry)
        };
    }
    
    // Show shape controls
    showShapeControls();
}

// ====== SHAPE CONTROLS ======
function showShapeControls() {
    const controls = document.getElementById('shapeControls');
    controls.style.display = 'block';
    
    // Populate current values
    if (newShapeData.type === 'rect') {
        document.getElementById('shapeWidth').value = newShapeData.width;
        document.getElementById('shapeHeight').value = newShapeData.height;
        document.getElementById('shapeRotation').value = newShapeData.rotate || 0;
    } else if (newShapeData.type === 'ellipse') {
        document.getElementById('shapeWidth').value = newShapeData.rx * 2;
        document.getElementById('shapeHeight').value = newShapeData.ry * 2;
        document.getElementById('shapeRotation').value = 0;
        document.getElementById('shapeRotation').disabled = true; // Ellipses don't rotate
    }
    
    // Live update
    document.getElementById('shapeWidth').oninput = updateTempShape;
    document.getElementById('shapeHeight').oninput = updateTempShape;
    document.getElementById('shapeRotation').oninput = updateTempShape;
}

function updateTempShape() {
    if (!tempShape || !newShapeData) return;
    
    const width = parseFloat(document.getElementById('shapeWidth').value);
    const height = parseFloat(document.getElementById('shapeHeight').value);
    const rotation = parseFloat(document.getElementById('shapeRotation').value) || 0;
    
    if (newShapeData.type === 'rect') {
        newShapeData.width = width;
        newShapeData.height = height;
        newShapeData.rotate = rotation;
        
        tempShape.setAttribute('width', width);
        tempShape.setAttribute('height', height);
        
        if (rotation !== 0) {
            const cx = newShapeData.x + width / 2;
            const cy = newShapeData.y + height / 2;
            tempShape.setAttribute('transform', `rotate(${rotation}, ${cx}, ${cy})`);
        } else {
            tempShape.removeAttribute('transform');
        }
    } else if (newShapeData.type === 'ellipse') {
        newShapeData.rx = width / 2;
        newShapeData.ry = height / 2;
        
        tempShape.setAttribute('rx', newShapeData.rx);
        tempShape.setAttribute('ry', newShapeData.ry);
    }
}

// Save shape button
document.getElementById('saveShapeBtn')?.addEventListener('click', async () => {
    if (!newShapeData) return;
    
    // Open a prompt modal for location details
    showNewLocationModal();
});

// Cancel shape button
document.getElementById('cancelShapeBtn')?.addEventListener('click', () => {
    if (tempShape) tempShape.remove();
    tempShape = null;
    newShapeData = null;
    document.getElementById('shapeControls').style.display = 'none';
});

// ====== NEW LOCATION MODAL ======
function showNewLocationModal() {
    // For now, use a simple prompt-based approach
    // You can create a proper modal later
    const code = prompt('Enter location code (e.g., ADG):');
    if (!code) return;
    
    const name = prompt('Enter location name:');
    if (!name) return;
    
    const type = prompt('Enter type (building/facility/gate/landmark/parking):');
    if (!type) return;
    
    // Create new location object
    const newLocation = {
        code: code.toUpperCase(),
        name: name,
        type: type.toLowerCase(),
        section: '',
        description: '',
        shape: newShapeData,
        images: [],
        offices: [],
        departments: []
    };
    
    // Save to database
    saveNewLocation(newLocation);
}

async function saveNewLocation(locationData) {
    const saveBtn = document.getElementById('saveShapeBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Saving...';
    
    try {
        const response = await fetch('/api/locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(locationData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            customNotification('success', 'Success', 'Location created successfully');
            
            // Clean up
            if (tempShape) tempShape.remove();
            tempShape = null;
            newShapeData = null;
            document.getElementById('shapeControls').style.display = 'none';
            
            // Reload locations
            await loadLocations();
            renderMapEditor();
            
            // Switch back to select mode
            currentMode = 'select';
            setActiveMode('select');
        } else {
            customNotification('error', 'Error', result.error || 'Failed to create location');
        }
    } catch (error) {
        console.error('Save error:', error);
        customNotification('error', 'Error', 'Failed to create location');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Save Shape';
    }
}

// ====== HELPER: GET SVG POINT FROM MOUSE EVENT ======
function getSVGPoint(event, rect) {
    const viewBox = svg.viewBox.baseVal;
    const scaleX = viewBox.width / rect.width;
    const scaleY = viewBox.height / rect.height;
    
    return {
        x: (event.clientX - rect.left) * scaleX + viewBox.x,
        y: (event.clientY - rect.top) * scaleY + viewBox.y
    };
}