import showToast from './toast.js';
import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── State ────────────────────────────────────────────────────────────────────
let sections = [];
const quillInstances = {};
const selectedIcons = {};

// ─── Icon map for rich_text sections ─────────────────────────────────────────
const sectionIconMap = {
    mission_vision: 'bx-bullseye',
    about:          'bx-buildings',
    hymn:           'bx-music',
    contact:        'bx-phone'
};

// ─── Available icons for core values ─────────────────────────────────────────
const availableIcons = [
    'bx-church', 'bx-donate-heart', 'bx-group', 'bx-heart',
    'bx-star', 'bx-shield', 'bx-bulb', 'bx-leaf',
    'bx-book', 'bx-globe', 'bx-flag', 'bx-crown',
    'bx-award', 'bx-hand', 'bx-peace', 'bx-candles'
];

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

        const isCoreValue = section.type === 'core_value';
        selectedIcons[section.key] = section.icon;

        const card = document.createElement('div');
        card.className = 'section-card';
        card.dataset.key = section.key;

        card.innerHTML = `
            <div class="section-card-header">
                <div class="section-card-header-left">
                    <div class="section-card-icon">
                        <i class='bx ${isCoreValue ? (section.icon || 'bx-star') : (sectionIconMap[section.key] || 'bx-file')}'></i>
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
                <!-- Preview -->
                <div id="preview-${section.key}">
                    ${isCoreValue ? renderCoreValuePreview(section) : renderRichTextPreview(section)}
                </div>

                <!-- Edit mode -->
                ${isCoreValue ? `
                    <div class="icon-selector-wrap" id="icon-wrap-${section.key}">
                        <span class="icon-selector-label">Icon</span>
                        <div class="icon-selector-grid">
                            ${availableIcons.map(icon => `
                                <button class="icon-option ${section.icon === icon ? 'selected' : ''}"
                                    data-icon="${icon}" data-key="${section.key}">
                                    <i class='bx ${icon}'></i>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

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

        // Init Quill
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

        if (section.content) quill.root.innerHTML = section.content;
        quillInstances[section.key] = quill;

        // Icon selector
        if (isCoreValue) {
            card.querySelectorAll('.icon-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    card.querySelectorAll('.icon-option').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    selectedIcons[section.key] = btn.dataset.icon;
                });
            });
        }

        // Edit button
        card.querySelector('.section-edit-btn').addEventListener('click', () => openEdit(section.key, isCoreValue));

        // Cancel button
        card.querySelector('.cancel-edit-btn').addEventListener('click', () => closeEdit(section.key, section, isCoreValue));

        // Save button
        card.querySelector('.save-section-btn').addEventListener('click', async () => await saveSection(section, isCoreValue));
    });
}

// ─── Preview Renderers ────────────────────────────────────────────────────────
function renderRichTextPreview(section) {
    if (!section.content) return `<p class="section-content-empty">No content yet. Click Edit to add content.</p>`;
    return `<div class="section-content-preview">${section.content}</div>`;
}

function renderCoreValuePreview(section) {
    return `
        <div class="core-value-preview">
            <div class="core-value-preview-icon">
                <i class='bx ${section.icon || 'bx-star'}'></i>
            </div>
            <div class="core-value-preview-content">
                <p class="core-value-preview-name">${section.label}</p>
                <div class="core-value-preview-desc">
                    ${section.content || `<p class="section-content-empty">No description yet.</p>`}
                </div>
            </div>
        </div>
    `;
}

// ─── Open / Close Edit ────────────────────────────────────────────────────────
function openEdit(key, isCoreValue) {
    document.getElementById(`preview-${key}`).classList.add('hidden');
    document.getElementById(`quill-wrap-${key}`).classList.add('active');
    document.getElementById(`footer-${key}`).classList.add('active');
    if (isCoreValue) document.getElementById(`icon-wrap-${key}`).classList.add('active');

    const editBtn = document.querySelector(`.section-edit-btn[data-key="${key}"]`);
    editBtn.classList.add('editing');
    editBtn.innerHTML = `<i class='bx bx-edit'></i> Editing...`;
}

function closeEdit(key, section, isCoreValue) {
    quillInstances[key].root.innerHTML = section.content || '';
    selectedIcons[key] = section.icon;

    // Reset icon selection UI
    if (isCoreValue) {
        document.getElementById(`icon-wrap-${key}`).classList.remove('active');
        document.querySelectorAll(`.icon-option[data-key="${key}"]`).forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.icon === section.icon);
        });
    }

    document.getElementById(`preview-${key}`).classList.remove('hidden');
    document.getElementById(`quill-wrap-${key}`).classList.remove('active');
    document.getElementById(`footer-${key}`).classList.remove('active');

    const editBtn = document.querySelector(`.section-edit-btn[data-key="${key}"]`);
    editBtn.classList.remove('editing');
    editBtn.innerHTML = `<i class='bx bx-edit'></i> Edit`;
}

// ─── Save Section ─────────────────────────────────────────────────────────────
async function saveSection(section, isCoreValue) {
    const saveBtn = document.querySelector(`.save-section-btn[data-key="${section.key}"]`);
    const content = quillInstances[section.key].root.innerHTML.trim();
    const icon = isCoreValue ? selectedIcons[section.key] : null;

    saveBtn.disabled = true;
    await showLoading();
    try {
        const body = { content };
        if (isCoreValue) body.icon = icon;

        const res = await fetch(`/api/campus-info/${section.key}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (!res.ok) {
            showToast('error', data.error || 'Failed to save changes.');
        } else {
            showToast('success', `${section.label} updated successfully!`);

            // Update local state
            section.content = content;
            section.icon = icon ?? section.icon;
            section.updatedAt = new Date().toISOString();

            // Update preview
            const preview = document.getElementById(`preview-${section.key}`);
            preview.innerHTML = isCoreValue
                ? renderCoreValuePreview(section)
                : renderRichTextPreview(section);

            // Update last updated
            const card = document.querySelector(`.section-card[data-key="${section.key}"]`);
            card.querySelector('.section-card-updated').textContent = `Last updated: ${new Date().toLocaleDateString('en-PH', {
                year: 'numeric', month: 'short', day: 'numeric'
            })}`;

            // Update header icon for core values
            if (isCoreValue && icon) {
                card.querySelector('.section-card-icon i').className = `bx ${icon}`;
            }

            closeEdit(section.key, section, isCoreValue);
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