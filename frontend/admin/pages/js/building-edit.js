import showToast from './toast.js';
import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── Check ID from URL ────────────────────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const buildingId = params.get('id');
const view = params.get('view') || 'list';

if (!buildingId) {
    window.location.href = 'building.html';
}

// ─── State ────────────────────────────────────────────────────────────────────
let existingImages = [];
let removedImages = [];
let newFiles = [];

// ─── Fetch Building ───────────────────────────────────────────────────────────
await showLoading();

let building;
try {
    const res = await fetch(`/api/buildings/${buildingId}`, {
        headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
        window.location.href = `building.html?view=${view}`;
    }

    const data = await res.json();
    building = data.building;

} catch (err) {
    window.location.href = `building.html?view=${view}`;
} finally {
    hideLoading();
}

// ─── Prefill Form ─────────────────────────────────────────────────────────────
document.getElementById('name').value = building.name;
document.getElementById('dataId').value = building.dataId;
document.getElementById('category').value = building.category;
document.getElementById('isVisible').checked = building.isVisible;
document.getElementById('visibilityLabel').textContent = building.isVisible ? 'Visible' : 'Hidden';

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

if (building.description) {
    quill.root.innerHTML = building.description;
}

// ─── Visibility Toggle ────────────────────────────────────────────────────────
const isVisibleInput = document.getElementById('isVisible');
const visibilityLabel = document.getElementById('visibilityLabel');

isVisibleInput.addEventListener('change', () => {
    visibilityLabel.textContent = isVisibleInput.checked ? 'Visible' : 'Hidden';
});

// ─── Existing Images ──────────────────────────────────────────────────────────
existingImages = building.images ? [...building.images] : [];
const existingImagesContainer = document.getElementById('existingImages');

function renderExistingImages() {
    existingImagesContainer.innerHTML = '';
    existingImages.forEach((url, index) => {
        const item = document.createElement('div');
        item.classList.add('existing-image-item');
        item.innerHTML = `
            <img src="${url}" alt="Building image ${index + 1}" />
            <button class="remove-image-btn" data-url="${url}">
                <i class='bx bx-x'></i>
            </button>
        `;
        item.querySelector('.remove-image-btn').addEventListener('click', () => {
            removedImages.push(url);
            existingImages = existingImages.filter(img => img !== url);
            renderExistingImages();
        });
        existingImagesContainer.appendChild(item);
    });
}

renderExistingImages();

// ─── New Image Upload ─────────────────────────────────────────────────────────
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

// ─── Cancel ───────────────────────────────────────────────────────────────────
document.getElementById('cancelBtn').addEventListener('click', () => {
    window.location.href = `building.html?view=${view}`;
});

// ─── Save ─────────────────────────────────────────────────────────────────────
document.getElementById('saveBtn').addEventListener('click', async () => {
    const name = document.getElementById('name').value.trim();
    const dataId = document.getElementById('dataId').value.trim();
    const category = document.getElementById('category').value;
    const isVisible = document.getElementById('isVisible').checked;
    const description = quill.root.innerHTML;

    if (!name || !dataId || !category) {
        showToast('error', 'Name, Data ID and Category are required.');
        return;
    }

    await showLoading();

    try {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('dataId', dataId);
        formData.append('category', category);
        formData.append('description', description);
        formData.append('isVisible', isVisible);

        if (removedImages.length > 0) {
            formData.append('removeImages', JSON.stringify(removedImages));
        }

        newFiles.forEach(file => {
            formData.append('images', file);
        });

        const res = await fetch(`/api/buildings/${buildingId}`, {
            method: 'PATCH',
            headers: { 'Accept': 'application/json' },
            body: formData
        });

        const data = await res.json();

        if (!res.ok) {
            showToast('error', data.error || 'Failed to save changes.');
            return;
        }

        showToast('success', 'Building updated successfully!');
        setTimeout(() => {
            window.location.href = `building.html?view=${view}`;
        }, 1500);

    } catch (err) {
        showToast('error', 'Failed to save changes.');
    } finally {
        hideLoading();
    }
});