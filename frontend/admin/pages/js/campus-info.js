import showToast from './toast.js';
import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── State ────────────────────────────────────────────────────────────────────
let sections = [];
const quillInstances = {};

// ─── Icon map ─────────────────────────────────────────────────────────────────
const iconMap = {
    mission:     'bx-target-lock',
    vision:      'bx-glasses',
    core_values: 'bx-heart',
    about:       'bx-buildings',
    hymn:        'bx-music',
    contact:     'bx-phone'
};

// ─── Fetch Sections ───────────────────────────────────────────────────────────
async function fetchSections() {
    await showLoading();
    try {
        const res = await fetch('/api/campus-info', { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        sections = data.sections;
        renderSections();
    } catch (err) {
        showToast('error', 'Failed to load campus info.');
    } finally {
        hideLoading();
    }
}

// ─── Render Sections ──────────────────────────────────────────────────────────
function renderSections() {
    const container = document.getElementById('infoSections');
    container.innerHTML = '';

    sections.forEach(section => {
        const updated = new Date(section.updatedAt).toLocaleDateString('en-PH', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        const card = document.createElement('div');
        card.className = 'section-card';
        card.dataset.key = section.key;
        card.innerHTML = `
            <div class="section-card-header">
                <div class="section-card-header-left">
                    <div class="section-card-icon">
                        <i class='bx ${iconMap[section.key] || 'bx-file'}'></i>
                    </div>
                    <div>
                        <p class="section-card-title">${section.label}</p>
                        <p class="section-card-updated">Last updated: ${updated}</p>
                    </div>
                </div>
                <button class="section-edit-btn" data-key="${section.key}">
                    <i class='bx bx-edit'></i> Edit
                </button>
            </div>
            <div class="section-card-body">
                <div class="section-content-preview" id="preview-${section.key}">
                    ${section.content
                        ? section.content
                        : `<p class="section-content-empty">No content yet. Click Edit to add content.</p>`
                    }
                </div>
                <div class="section-quill-wrap" id="quill-wrap-${section.key}">
                    <div class="section-quill-editor-wrap">
                        <div id="quill-${section.key}"></div>
                    </div>
                </div>
            </div>
            <div class="section-card-footer" id="footer-${section.key}">
                <button class="cancel-edit-btn" data-key="${section.key}">Cancel</button>
                <button class="save-section-btn" data-key="${section.key}">
                    <i class='bx bx-save'></i> Save Changes
                </button>
            </div>
        `;

        container.appendChild(card);

        // Init Quill for this section
        const quill = new Quill(`#quill-${section.key}`, {
            theme: 'snow',
            placeholder: `Write ${section.label} content here...`,
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

        if (section.content) {
            quill.root.innerHTML = section.content;
        }

        quillInstances[section.key] = quill;

        // Edit button
        card.querySelector('.section-edit-btn').addEventListener('click', () => {
            openEdit(section.key);
        });

        // Cancel button
        card.querySelector('.cancel-edit-btn').addEventListener('click', () => {
            closeEdit(section.key, section.content);
        });

        // Save button
        card.querySelector('.save-section-btn').addEventListener('click', async () => {
            await saveSection(section);
        });
    });
}

// ─── Open Edit ────────────────────────────────────────────────────────────────
function openEdit(key) {
    const preview = document.getElementById(`preview-${key}`);
    const quillWrap = document.getElementById(`quill-wrap-${key}`);
    const footer = document.getElementById(`footer-${key}`);
    const editBtn = document.querySelector(`.section-edit-btn[data-key="${key}"]`);

    preview.classList.add('hidden');
    quillWrap.classList.add('active');
    footer.classList.add('active');
    editBtn.classList.add('editing');
    editBtn.innerHTML = `<i class='bx bx-edit'></i> Editing...`;
}

// ─── Close Edit ───────────────────────────────────────────────────────────────
function closeEdit(key, originalContent) {
    const preview = document.getElementById(`preview-${key}`);
    const quillWrap = document.getElementById(`quill-wrap-${key}`);
    const footer = document.getElementById(`footer-${key}`);
    const editBtn = document.querySelector(`.section-edit-btn[data-key="${key}"]`);

    // Reset quill to original content
    quillInstances[key].root.innerHTML = originalContent || '';

    preview.classList.remove('hidden');
    quillWrap.classList.remove('active');
    footer.classList.remove('active');
    editBtn.classList.remove('editing');
    editBtn.innerHTML = `<i class='bx bx-edit'></i> Edit`;
}

// ─── Save Section ─────────────────────────────────────────────────────────────
async function saveSection(section) {
    const saveBtn = document.querySelector(`.save-section-btn[data-key="${section.key}"]`);
    const content = quillInstances[section.key].root.innerHTML.trim();

    saveBtn.disabled = true;
    await showLoading();
    try {
        const res = await fetch(`/api/campus-info/${section.key}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        const data = await res.json();

        if (!res.ok) {
            showToast('error', data.error || 'Failed to save changes.');
        } else {
            showToast('success', `${section.label} updated successfully!`);
            // Update local state
            section.content = content;
            section.updatedAt = new Date().toISOString();

            // Update preview
            const preview = document.getElementById(`preview-${section.key}`);
            preview.innerHTML = content || `<p class="section-content-empty">No content yet. Click Edit to add content.</p>`;

            // Update last updated text
            const card = document.querySelector(`.section-card[data-key="${section.key}"]`);
            card.querySelector('.section-card-updated').textContent = `Last updated: ${new Date().toLocaleDateString('en-PH', {
                year: 'numeric', month: 'short', day: 'numeric'
            })}`;

            closeEdit(section.key, content);
        }
    } catch (err) {
        showToast('error', 'Failed to save changes.');
    } finally {
        hideLoading();
        saveBtn.disabled = false;
    }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
fetchSections();