// ====== INTERACTIVE MAP ======
let mapData = {
    locations: [],
    roads: []
};

let selectedElement = null;
const svg = document.getElementById('campusMap');
const sidePanel = document.getElementById('sidePanel');
const closePanel = document.getElementById('closePanel');

// ====== ZOOM AND PAN VARIABLES ======
let viewBox = { x: 0, y: 0, width: 1920, height: 1080 };
let isPanning = false;
let startPoint = { x: 0, y: 0 };
let scale = 1;

// ====== IMAGE CAROUSEL STATE ======
let currentImages = [];
let currentImageIndex = 0;

// ====== SIDE PANEL FUNCTIONS ======
function openSidePanel() {
    sidePanel.classList.add('show');
}

function closeSidePanel() {
    sidePanel.classList.remove('show');
    if (selectedElement) {
        selectedElement.classList.remove('selected');
        selectedElement = null;
    }
    // Reset carousel
    currentImages = [];
    currentImageIndex = 0;
}

// Close panel when clicking X button
closePanel.addEventListener('click', closeSidePanel);

// ====== IMAGE CAROUSEL FUNCTIONS ======
function updatePanelImage() {
    const panelImage = document.getElementById('panelImage');
    const imageNav = document.getElementById('imageNav');
    const imageCounter = document.getElementById('imageCounter');
    const prevBtn = document.getElementById('prevImageBtn');
    const nextBtn = document.getElementById('nextImageBtn');
    
    // Check if we have images
    if (!currentImages || currentImages.length === 0) {
        // Show no image placeholder
        panelImage.style.display = 'none';
        imageNav.style.display = 'none';
        
        const noImageDiv = document.createElement('div');
        noImageDiv.className = 'no-image';
        noImageDiv.innerHTML = `
            <i class='bx bx-image-alt'></i>
            <span>No images available</span>
        `;
        
        const panelImageContainer = panelImage.parentElement;
        // Remove existing no-image if any
        const existingNoImage = panelImageContainer.querySelector('.no-image');
        if (existingNoImage) existingNoImage.remove();
        
        panelImageContainer.appendChild(noImageDiv);
        return;
    }
    
    // Remove no-image placeholder if exists
    const existingNoImage = panelImage.parentElement.querySelector('.no-image');
    if (existingNoImage) existingNoImage.remove();
    panelImage.style.display = 'block';
    
    // Set current image
    panelImage.src = currentImages[currentImageIndex].imageUrl;
    
    // Show/hide navigation based on number of images
    if (currentImages.length > 1) {
        imageNav.style.display = 'flex';
        imageCounter.textContent = `${currentImageIndex + 1} / ${currentImages.length}`;
        
        // Enable/disable buttons
        prevBtn.disabled = currentImageIndex === 0;
        nextBtn.disabled = currentImageIndex === currentImages.length - 1;
    } else {
        imageNav.style.display = 'none';
    }
}

function nextImage() {
    if (currentImageIndex < currentImages.length - 1) {
        currentImageIndex++;
        updatePanelImage();
    }
}

function prevImage() {
    if (currentImageIndex > 0) {
        currentImageIndex--;
        updatePanelImage();
    }
}

// Hook up navigation buttons
document.getElementById('nextImageBtn')?.addEventListener('click', nextImage);
document.getElementById('prevImageBtn')?.addEventListener('click', prevImage);

// ====== ZOOM AND PAN FUNCTIONS ======
function updateViewBox() {
    svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
}

// Zoom with mouse wheel
svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const svgX = viewBox.x + (mouseX / rect.width) * viewBox.width;
    const svgY = viewBox.y + (mouseY / rect.height) * viewBox.height;
    
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    
    const newWidth = viewBox.width * zoomFactor;
    const newHeight = viewBox.height * zoomFactor;
    
    if (newWidth > 3840 || newWidth < 500) return;
    
    viewBox.x = svgX - (mouseX / rect.width) * newWidth;
    viewBox.y = svgY - (mouseY / rect.height) * newHeight;
    viewBox.width = newWidth;
    viewBox.height = newHeight;
    
    scale = 1920 / viewBox.width;
    updateViewBox();
});

// Pan with mouse drag
svg.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('selectable')) return;
    
    isPanning = true;
    startPoint = { x: e.clientX, y: e.clientY };
    svg.style.cursor = 'grabbing';
});

svg.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    
    const dx = e.clientX - startPoint.x;
    const dy = e.clientY - startPoint.y;
    
    const rect = svg.getBoundingClientRect();
    viewBox.x -= (dx / rect.width) * viewBox.width;
    viewBox.y -= (dy / rect.height) * viewBox.height;
    
    startPoint = { x: e.clientX, y: e.clientY };
    updateViewBox();
});

svg.addEventListener('mouseup', () => {
    isPanning = false;
    svg.style.cursor = 'default';
});

svg.addEventListener('mouseleave', () => {
    isPanning = false;
    svg.style.cursor = 'default';
});

// Reset zoom
function resetZoom() {
    viewBox = { x: 0, y: 0, width: 1920, height: 1080 };
    scale = 1;
    updateViewBox();
}

// ====== Fetch locations from API ======
async function fetchLocations() {
    try {
        const response = await fetch('/api/locations');
        const result = await response.json();
        
        if (result.success) {
            mapData.locations = result.data;
            console.log('✅ Loaded locations:', mapData.locations.length);
            return mapData.locations;
        } else {
            console.error('❌ Failed to fetch locations:', result.error);
            return [];
        }
    } catch (error) {
        console.error('❌ Error fetching locations:', error);
        return [];
    }
}

// ====== Create SVG Element from location data ======
function createSVGElement(location) {
    const { shape } = location;
    let elem;
    
    if (shape.type === 'rect') {
        elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        elem.setAttribute('x', shape.x);
        elem.setAttribute('y', shape.y);
        elem.setAttribute('width', shape.width);
        elem.setAttribute('height', shape.height);
        
        if (shape.rx) elem.setAttribute('rx', shape.rx);
        if (shape.ry) elem.setAttribute('ry', shape.ry);
        
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
        
    } else if (shape.type === 'polygon') {
        elem = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        elem.setAttribute('points', shape.points.join(' '));
    }
    
    elem.setAttribute('stroke', 'black');
    elem.setAttribute('stroke-width', '2');
    
    elem.classList.add(location.type, 'selectable');
    elem.dataset.id = location.code;
    elem.dataset.name = location.name;
    elem.dataset.location = JSON.stringify(location);
    
    return elem;
}

// ====== Render all locations on the map ======
function renderLocations() {
    const existingLocations = svg.querySelectorAll('.selectable');
    existingLocations.forEach(el => el.remove());
    
    mapData.locations.forEach(location => {
        const elem = createSVGElement(location);
        svg.appendChild(elem);
    });
    
    console.log('✅ Rendered', mapData.locations.length, 'locations on map');
}

// ====== Handle click events ======
svg.addEventListener('click', (e) => {
    const target = e.target;

    // If clicked something not selectable → close panel and unselect
    if (!target.classList.contains('selectable')) {
        closeSidePanel();
        return;
    }

    // Same element clicked again → close panel and unselect
    if (target === selectedElement) {
        closeSidePanel();
        return;
    }

    // New element clicked → switch highlight and open panel
    if (selectedElement) {
        selectedElement.classList.remove('selected');
    }
    target.classList.add('selected');
    selectedElement = target;

    // Get location data from dataset
    const locationData = JSON.parse(target.dataset.location);
    console.log('📍 Selected location:', locationData);

    // ⭐ UPDATE IMAGES
    currentImages = locationData.images || [];
    currentImageIndex = 0;
    updatePanelImage();

    // ⭐ Populate side panel main text info
    const codeEl = sidePanel.querySelector('.building-code');
    const sectionEl = sidePanel.querySelector('.building-section');
    const titleEl = sidePanel.querySelector('h2');
    const descEl = sidePanel.querySelector('.building-description');

    if (codeEl) codeEl.textContent = locationData.code || '';
    if (sectionEl) {
        if (locationData.section) {
            sectionEl.textContent = locationData.section;
            sectionEl.style.display = 'inline-block';
        } else {
            sectionEl.style.display = 'none';
        }
    }
    if (titleEl) titleEl.textContent = locationData.name || '';
    if (descEl) descEl.textContent = locationData.description || 'No description available.';

    // ⭐ Dynamically populate Offices and Departments
    const infoSections = sidePanel.querySelectorAll('.info-section');
    let officesContainer = null;
    let departmentsContainer = null;

    infoSections.forEach(section => {
        const heading = section.querySelector('h3')?.textContent.toLowerCase();
        if (heading?.includes('offices')) officesContainer = section.querySelector('.tags-container');
        if (heading?.includes('departments')) departmentsContainer = section.querySelector('.tags-container');
    });

    // Clear existing tags
    if (officesContainer) officesContainer.innerHTML = '';
    if (departmentsContainer) departmentsContainer.innerHTML = '';

    // Offices
    if (locationData.offices && locationData.offices.length > 0) {
        locationData.offices.forEach(office => {
            const span = document.createElement('span');
            span.classList.add('tag');
            span.textContent = office.name;
            officesContainer.appendChild(span);
        });
        officesContainer.parentElement.style.display = 'block';
    } else if (officesContainer) {
        officesContainer.parentElement.style.display = 'none';
    }

    // Departments
    if (locationData.departments && locationData.departments.length > 0) {
        locationData.departments.forEach(dept => {
            const span = document.createElement('span');
            span.classList.add('tag');
            span.textContent = dept.name;
            departmentsContainer.appendChild(span);
        });
        departmentsContainer.parentElement.style.display = 'block';
    } else if (departmentsContainer) {
        departmentsContainer.parentElement.style.display = 'none';
    }

    // Open side panel
    openSidePanel();
});

// Close panel when clicking outside (on the map background)
document.addEventListener('click', (e) => {
    // If click is outside both the SVG and the side panel
    if (!svg.contains(e.target) && !sidePanel.contains(e.target)) {
        closeSidePanel();
    }
});

// ====== Initialize map ======
async function initializeMap() {
    console.log('🗺️  Initializing map...');
    
    await fetchLocations();
    renderLocations();
    
    console.log('✅ Map initialized successfully');
}

// ====== Start when DOM is ready ======
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    
    const resetZoomBtn = document.getElementById('resetZoom');
    if (resetZoomBtn) {
        resetZoomBtn.addEventListener('click', resetZoom);
    }
});