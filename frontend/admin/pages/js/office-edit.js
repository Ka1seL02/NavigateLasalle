import showToast from './toast.js';
import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── State ────────────────────────────────────────────────────────────────────
let officeId = null;
let newFiles = [];
let imagesToRemove = [];
let selectedSubOffices = [];
let allOffices = [];
let allBuildings = [];

// ─── Elements ─────────────────────────────────────────────────────────────────
const imageInput = document.getElementById('imageInput');
const newImagePreviews = document.getElementById('newImagePreviews');
const existingImagesEl = document.getElementById('existingImages');
const isVisibleInput = document.getElementById('isVisible');
const visibilityLabel = document.getElementById('visibilityLabel');
const addPersonnelBtn = document.getElementById('addPersonnelBtn');
const personnelList = document.getElementById('personnelList');
const subOfficeSearch = document.getElementById('subOfficeSearch');
const subOfficeDropdown = document.getElementById('subOfficeDropdown');
const selectedSubOfficesEl = document.getElementById('selectedSubOffices');
const buildingSelect = document.getElementById('building');
const categorySelect = document.getElementById('category');
const newCategoryInput = document.getElementById('newCategoryInput');

// ─── Quill ────────────────────────────────────────────────────────────────────
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
isVisibleInput.addEventListener('change', () => {
    visibilityLabel.textContent = isVisibleInput.checked ? 'Open' : 'Under Maintenance';
});

// ─── Category — Dynamic ───────────────────────────────────────────────────────
function populateCategoryDropdown(existingCategories, currentValue) {
    categorySelect.innerHTML = `<option value="">— Select a section —</option>`;
    categorySelect.innerHTML += `<option value="Unaffiliated">Unaffiliated</option>`;

    existingCategories.forEach(cat => {
        if (cat === 'Unaffiliated') return;
        categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });

    categorySelect.innerHTML += `<option value="__new__">+ Create New Section</option>`;

    // Set current value — if not in list, add it dynamically
    if (currentValue) {
        const exists = categorySelect.querySelector(`option[value="${CSS.escape(currentValue)}"]`);
        if (exists) {
            categorySelect.value = currentValue;
        } else {
            const newOpt = document.createElement('option');
            newOpt.value = currentValue;
            newOpt.textContent = currentValue;
            const newOptEl = categorySelect.querySelector('option[value="__new__"]');
            categorySelect.insertBefore(newOpt, newOptEl);
            categorySelect.value = currentValue;
        }
    }
}

categorySelect.addEventListener('change', () => {
    if (categorySelect.value === '__new__') {
        newCategoryInput.classList.remove('hidden');
        newCategoryInput.focus();
    } else {
        newCategoryInput.classList.add('hidden');
        newCategoryInput.value = '';
    }
});

function getCategory() {
    if (categorySelect.value === '__new__') {
        return newCategoryInput.value.trim();
    }
    return categorySelect.value;
}

// ─── Image Upload ─────────────────────────────────────────────────────────────
imageInput.addEventListener('change', () => {
    const files = Array.from(imageInput.files);
    files.forEach(file => {
        newFiles.push(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            const item = document.createElement('div');
            item.classList.add('preview-item');
            item.innerHTML = `
                <img src="${e.target.result}" alt="Preview" />
                <button class="remove-preview-btn" type="button">
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

// ─── Existing Images ──────────────────────────────────────────────────────────
function renderExistingImages(images) {
    existingImagesEl.innerHTML = '';
    if (!images || images.length === 0) return;

    images.forEach(url => {
        const item = document.createElement('div');
        item.classList.add('existing-image-item');
        item.dataset.url = url;
        item.innerHTML = `
            <img src="${url}" alt="Image" />
            <button class="remove-existing-btn" type="button">
                <i class='bx bx-x'></i>
            </button>
        `;
        item.querySelector('.remove-existing-btn').addEventListener('click', () => {
            if (item.classList.contains('marked-remove')) {
                item.classList.remove('marked-remove');
                imagesToRemove = imagesToRemove.filter(u => u !== url);
            } else {
                item.classList.add('marked-remove');
                imagesToRemove.push(url);
            }
        });
        existingImagesEl.appendChild(item);
    });
}

// ─── Personnel ────────────────────────────────────────────────────────────────
addPersonnelBtn.addEventListener('click', () => addPersonnelRow());

function addPersonnelRow(role = '', name = '') {
    const row = document.createElement('div');
    row.classList.add('personnel-row');
    row.innerHTML = `
        <input type="text" placeholder="Role (e.g. University Registrar)" value="${role}" class="personnel-role-input" />
        <input type="text" placeholder="Name (e.g. Juan Dela Cruz)" value="${name}" class="personnel-name-input" />
        <button class="remove-personnel-btn" type="button">
            <i class='bx bx-trash'></i>
        </button>
    `;
    row.querySelector('.remove-personnel-btn').addEventListener('click', () => row.remove());
    personnelList.appendChild(row);
}

// ─── Sub Offices Search Dropdown ──────────────────────────────────────────────
subOfficeSearch.addEventListener('focus', () => {
    renderDropdown(subOfficeSearch.value);
    subOfficeDropdown.classList.remove('hidden');
});

subOfficeSearch.addEventListener('input', () => {
    renderDropdown(subOfficeSearch.value);
    subOfficeDropdown.classList.remove('hidden');
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-select-wrapper')) {
        subOfficeDropdown.classList.add('hidden');
    }
});

function renderDropdown(search = '') {
    const lower = search.toLowerCase();
    const filtered = allOffices.filter(o =>
        o._id !== officeId &&
        o.name.toLowerCase().includes(lower) &&
        !selectedSubOffices.find(s => s._id === o._id)
    );

    if (filtered.length === 0) {
        subOfficeDropdown.innerHTML = `<div class="dropdown-empty">No offices found</div>`;
        return;
    }

    subOfficeDropdown.innerHTML = filtered.map(o => `
        <div class="dropdown-item" data-id="${o._id}" data-name="${o.name}">
            ${o.name}
        </div>
    `).join('');

    subOfficeDropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            selectedSubOffices.push({ _id: item.dataset.id, name: item.dataset.name });
            renderSelectedTags();
            subOfficeSearch.value = '';
            subOfficeDropdown.classList.add('hidden');
        });
    });
}

function renderSelectedTags() {
    selectedSubOfficesEl.innerHTML = selectedSubOffices.map(s => `
        <div class="selected-tag" data-id="${s._id}">
            ${s.name}
            <button type="button" data-id="${s._id}"><i class='bx bx-x'></i></button>
        </div>
    `).join('');

    selectedSubOfficesEl.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedSubOffices = selectedSubOffices.filter(s => s._id !== btn.dataset.id);
            renderSelectedTags();
        });
    });
}

// ─── Load Data + Prefill ──────────────────────────────────────────────────────
async function loadData() {
    const params = new URLSearchParams(window.location.search);
    officeId = params.get('id');

    if (!officeId) {
        showToast('error', 'No office ID provided.');
        setTimeout(() => { window.location.href = 'office.html'; }, 1500);
        return;
    }

    await showLoading();
    try {
        const [officeRes, allOfficesRes, buildingsRes] = await Promise.all([
            fetch(`/api/offices/${officeId}`, { headers: { 'Accept': 'application/json' } }),
            fetch('/api/offices', { headers: { 'Accept': 'application/json' } }),
            fetch('/api/buildings', { headers: { 'Accept': 'application/json' } })
        ]);

        if (!officeRes.ok) {
            showToast('error', 'Office not found.');
            setTimeout(() => { window.location.href = 'office.html'; }, 1500);
            return;
        }

        const officeData = await officeRes.json();
        const allOfficesData = await allOfficesRes.json();
        const buildingsData = await buildingsRes.json();

        const office = officeData.office;
        allOffices = allOfficesData.offices || [];
        allBuildings = (buildingsData.buildings || []).filter(b => b.category !== 'road');

        // Populate building dropdown
        allBuildings.forEach(b => {
            const option = document.createElement('option');
            option.value = b._id;
            option.textContent = `${b.name} (${b.dataId})`;
            buildingSelect.appendChild(option);
        });

        // Get unique existing categories and populate dropdown
        const existingCategories = [...new Set(allOffices.map(o => o.category).filter(Boolean))].sort();
        populateCategoryDropdown(existingCategories, office.category);

        // ── Prefill fields ──
        document.getElementById('name').value = office.name || '';
        document.getElementById('head').value = office.head || '';
        document.getElementById('email').value = office.email || '';
        document.getElementById('phone').value = office.phone || '';
        document.getElementById('officeHours').value = office.officeHours || '';

        // Visibility
        isVisibleInput.checked = office.isVisible;
        visibilityLabel.textContent = office.isVisible ? 'Open' : 'Under Maintenance';

        // Description
        if (office.description) {
            quill.root.innerHTML = office.description;
        }

        // Existing images
        renderExistingImages(office.images);

        // Building
        if (office.building) {
            const buildingId = office.building._id || office.building;
            buildingSelect.value = buildingId;
        }

        // Sub offices
        if (office.subOffices && office.subOffices.length > 0) {
            selectedSubOffices = office.subOffices.map(s => ({
                _id: s._id || s,
                name: s.name || s
            }));
            renderSelectedTags();
        }

        // Personnel
        if (office.personnel && office.personnel.length > 0) {
            office.personnel.forEach(p => addPersonnelRow(p.role, p.name));
        }

    } catch (err) {
        showToast('error', 'Failed to load office data.');
    } finally {
        hideLoading();
    }
}

// ─── Save ─────────────────────────────────────────────────────────────────────
document.getElementById('saveBtn').addEventListener('click', async () => {
    const name = document.getElementById('name').value.trim();
    const category = getCategory();
    const head = document.getElementById('head').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const officeHours = document.getElementById('officeHours').value.trim();
    const building = buildingSelect.value;
    const isVisible = isVisibleInput.checked;
    const descriptionContent = quill.root.innerHTML;
    const description = descriptionContent === '<p><br></p>' ? null : descriptionContent;

    if (!name) { showToast('error', 'Office name is required.'); return; }
    if (!category) { showToast('error', 'Please select or enter a section.'); return; }
    if (categorySelect.value === '__new__' && !newCategoryInput.value.trim()) {
        showToast('error', 'Please enter a name for the new section.');
        return;
    }

    // Collect personnel
    const personnel = [];
    document.querySelectorAll('.personnel-row').forEach(row => {
        const role = row.querySelector('.personnel-role-input').value.trim();
        const pName = row.querySelector('.personnel-name-input').value.trim();
        if (role && pName) personnel.push({ role, name: pName });
    });

    await showLoading();
    try {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('category', category);
        if (head) formData.append('head', head);
        formData.append('description', description || '');
        if (email) formData.append('email', email);
        if (phone) formData.append('phone', phone);
        if (officeHours) formData.append('officeHours', officeHours);
        formData.append('building', building || '');
        formData.append('isVisible', isVisible);
        formData.append('personnel', JSON.stringify(personnel));
        formData.append('subOffices', JSON.stringify(selectedSubOffices.map(s => s._id)));

        if (imagesToRemove.length > 0) {
            formData.append('removeImages', JSON.stringify(imagesToRemove));
        }

        newFiles.forEach(file => formData.append('images', file));

        const res = await fetch(`/api/offices/${officeId}`, {
            method: 'PATCH',
            headers: { 'Accept': 'application/json' },
            body: formData
        });

        const data = await res.json();

        if (!res.ok) {
            showToast('error', data.error || 'Failed to save changes.');
            return;
        }

        showToast('success', 'Office updated successfully!');
        setTimeout(() => { window.location.href = 'office.html'; }, 1500);

    } catch (err) {
        showToast('error', 'Failed to save changes.');
    } finally {
        hideLoading();
    }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
await loadData();