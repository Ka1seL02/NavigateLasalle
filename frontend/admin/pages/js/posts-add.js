import showToast from './toast.js';
import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── State ────────────────────────────────────────────────────────────────────
let selectedFiles = [];

// ─── Elements ─────────────────────────────────────────────────────────────────
const titleInput = document.getElementById('titleInput');
const typeSelect = document.getElementById('typeSelect');
const officeSelect = document.getElementById('officeSelect');
const imageInput = document.getElementById('imageInput');
const newImagePreviews = document.getElementById('newImagePreviews');
const saveBtn = document.getElementById('saveBtn');

// ─── Quill ────────────────────────────────────────────────────────────────────
const quill = new Quill('#quillEditor', {
    theme: 'snow',
    placeholder: 'Write your post content here...',
    modules: {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link'],
            ['clean']
        ]
    }
});

// ─── Fetch Offices ────────────────────────────────────────────────────────────
async function fetchOffices() {
    try {
        const res = await fetch('/api/offices', { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        data.offices.forEach(o => {
            const option = document.createElement('option');
            option.value = o._id;
            option.textContent = o.name;
            officeSelect.appendChild(option);
        });
    } catch (err) {
        showToast('error', 'Failed to load offices.');
    }
}

// ─── Image Upload ─────────────────────────────────────────────────────────────
imageInput.addEventListener('change', () => {
    const files = Array.from(imageInput.files);
    files.forEach(file => {
        if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) return;
        selectedFiles.push(file);
    });
    imageInput.value = '';
    renderPreviews();
});

function renderPreviews() {
    newImagePreviews.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const url = URL.createObjectURL(file);
        const item = document.createElement('div');
        item.classList.add('preview-item');
        item.innerHTML = `
            <img src="${url}" alt="Preview" />
            <button type="button" class="remove-preview-btn" data-index="${index}">
                <i class='bx bx-x'></i>
            </button>
        `;
        item.querySelector('.remove-preview-btn').addEventListener('click', () => {
            selectedFiles.splice(index, 1);
            renderPreviews();
        });
        newImagePreviews.appendChild(item);
    });
}

// ─── Submit ───────────────────────────────────────────────────────────────────
saveBtn.addEventListener('click', async () => {
    const title = titleInput.value.trim();
    const type = typeSelect.value;
    const office = officeSelect.value;
    const content = quill.root.innerHTML.trim();

    if (!title) return showToast('error', 'Title is required.');
    if (!type) return showToast('error', 'Please select a type.');
    if (quill.getText().trim().length === 0) return showToast('error', 'Content is required.');
    if (selectedFiles.length === 0) return showToast('error', 'At least one image is required.');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('type', type);
    formData.append('content', content);
    if (office) formData.append('office', office);
    selectedFiles.forEach(file => formData.append('images', file));

    saveBtn.disabled = true;
    await showLoading();
    try {
        const res = await fetch('/api/posts', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (!res.ok) {
            showToast('error', data.message || 'Failed to create post.');
        } else {
            showToast('success', 'Post published successfully!');
            setTimeout(() => window.location.href = 'posts.html', 1000);
        }
    } catch (err) {
        showToast('error', 'Failed to create post.');
    } finally {
        hideLoading();
        saveBtn.disabled = false;
    }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
fetchOffices();