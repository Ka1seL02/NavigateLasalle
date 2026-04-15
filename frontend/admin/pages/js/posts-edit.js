import showToast from './toast.js';
import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── Guard — redirect immediately if no id ────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const postId = params.get('id');
if (!postId) window.location.replace('posts.html');

// ─── State ────────────────────────────────────────────────────────────────────
let existingImages = [];     // URLs still kept
let imagesToRemove = [];     // URLs marked for removal
let selectedFiles = [];      // newly picked files

// ─── Elements ─────────────────────────────────────────────────────────────────
const titleInput = document.getElementById('titleInput');
const typeSelect = document.getElementById('typeSelect');
const officeSelect = document.getElementById('officeSelect');
const imageInput = document.getElementById('imageInput');
const existingImagePreviews = document.getElementById('existingImagePreviews');
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
async function fetchOffices(selectedId) {
    try {
        const res = await fetch('/api/offices', { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        data.offices.forEach(o => {
            const option = document.createElement('option');
            option.value = o._id;
            option.textContent = o.name;
            if (o._id === selectedId) option.selected = true;
            officeSelect.appendChild(option);
        });
    } catch (err) {
        showToast('error', 'Failed to load offices.');
    }
}

// ─── Fetch Post & Prefill ─────────────────────────────────────────────────────
async function fetchPost() {
    await showLoading();
    try {
        const res = await fetch(`/api/posts/${postId}`, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) {
            window.location.replace('posts.html');
            return;
        }
        const data = await res.json();
        const post = data.post;

        // Prefill fields
        titleInput.value = post.title;
        typeSelect.value = post.type;
        quill.root.innerHTML = post.content;

        // Offices (pass current office id to preselect)
        await fetchOffices(post.office?._id ?? '');

        // Existing images
        existingImages = [...post.images];
        renderExistingPreviews();

    } catch (err) {
        window.location.replace('posts.html');
    } finally {
        hideLoading();
    }
}

// ─── Existing Image Previews ──────────────────────────────────────────────────
function renderExistingPreviews() {
    existingImagePreviews.innerHTML = '';
    existingImages.forEach(url => {
        const item = document.createElement('div');
        item.classList.add('existing-preview-item');
        if (imagesToRemove.includes(url)) item.classList.add('marked-remove');

        item.innerHTML = `
            <img src="${url}" alt="Image" />
            <div class="remove-overlay"><i class='bx bx-trash'></i></div>
        `;

        item.addEventListener('click', () => {
            if (imagesToRemove.includes(url)) {
                imagesToRemove = imagesToRemove.filter(u => u !== url);
                item.classList.remove('marked-remove');
            } else {
                imagesToRemove.push(url);
                item.classList.add('marked-remove');
            }
        });

        existingImagePreviews.appendChild(item);
    });
}

// ─── New Image Upload ─────────────────────────────────────────────────────────
imageInput.addEventListener('change', () => {
    const files = Array.from(imageInput.files);
    files.forEach(file => {
        if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) return;
        selectedFiles.push(file);
    });
    imageInput.value = '';
    renderNewPreviews();
});

function renderNewPreviews() {
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
            renderNewPreviews();
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

    // Check at least 1 image will remain
    const remainingExisting = existingImages.filter(u => !imagesToRemove.includes(u));
    if (remainingExisting.length === 0 && selectedFiles.length === 0) {
        return showToast('error', 'At least one image is required.');
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('type', type);
    formData.append('content', content);
    formData.append('office', office);
    if (imagesToRemove.length > 0) formData.append('removeImages', JSON.stringify(imagesToRemove));
    selectedFiles.forEach(file => formData.append('images', file));

    saveBtn.disabled = true;
    await showLoading();
    try {
        const res = await fetch(`/api/posts/${postId}`, {
            method: 'PATCH',
            body: formData
        });
        const data = await res.json();
        if (!res.ok) {
            showToast('error', data.message || 'Failed to save changes.');
        } else {
            showToast('success', 'Post updated successfully!');
            setTimeout(() => window.location.href = 'posts.html', 1000);
        }
    } catch (err) {
        showToast('error', 'Failed to save changes.');
    } finally {
        hideLoading();
        saveBtn.disabled = false;
    }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
fetchPost();