// ==================== STATE MANAGEMENT ==================== //
let currentPage = 1;
let totalPages = 1;
let faqsData = [];
let selectedFAQs = new Set();
let editingFAQId = null;

// ==================== INITIALIZATION ==================== //
document.addEventListener('DOMContentLoaded', () => {
    loadFAQs();
    loadCreateFAQModal();
    initializeEventListeners();
});

// ==================== LOAD CREATE FAQ MODAL ==================== //
async function loadCreateFAQModal() {
    try {
        const response = await fetch('./component/m_create_faq.html');
        const html = await response.text();
        document.body.insertAdjacentHTML('beforeend', html);
        initializeCreateFAQModal();
    } catch (error) {
        console.error('Error loading create FAQ modal:', error);
    }
}

// ==================== INITIALIZE CREATE FAQ MODAL ==================== //
function initializeCreateFAQModal() {
    const form = document.getElementById('createFAQForm');
    const confirmBtn = document.getElementById('confirmFAQBtn');
    const cancelBtn = document.getElementById('cancelFAQBtn');

    if (!form || !confirmBtn || !cancelBtn) return;

    cancelBtn.addEventListener('click', () => closeModal('createFAQModal'));
    initOverlayClick('createFAQModal');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = document.getElementById('faqQuestion').value.trim();
        const answer = document.getElementById('faqAnswer').value.trim();
        const category = document.getElementById('faqCategory').value;

        if (!question || !answer) {
            customNotification('error', 'Validation Error', 'Question and answer are required.');
            return;
        }

        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Creating...';

        try {
            const response = await fetch('/api/faqs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, answer, category })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create FAQ');
            }

            customNotification('success', 'Success', 'FAQ created successfully.');
            form.reset();
            closeModal('createFAQModal');
            loadFAQs();

        } catch (error) {
            console.error('Create FAQ error:', error);
            customNotification('error', 'Error', error.message);
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="bx bx-save"></i> Create FAQ';
        }
    });
}

// ==================== EVENT LISTENERS ==================== //
function initializeEventListeners() {
    // Search - searches question only
    const searchInput = document.querySelector('.search-box input');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentPage = 1;
            loadFAQs(e.target.value);
        }, 500);
    });

    // Show Create FAQ Modal
    const showModalBtn = document.getElementById('showCreateFAQModal');
    showModalBtn.addEventListener('click', () => {
        openModal('createFAQModal');
    });

    // Refresh
    const refreshBtn = document.getElementById('refresh-table');
    refreshBtn.addEventListener('click', () => {
        selectedFAQs.clear();
        currentPage = 1;
        loadFAQs();
    });

    // Delete Selected
    const deleteBtn = document.getElementById('delete-selected');
    deleteBtn.addEventListener('click', deleteSelectedFAQs);

    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadFAQs();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadFAQs();
        }
    });

    const pageInput = document.getElementById('current-page');
    pageInput.addEventListener('change', (e) => {
        const page = parseInt(e.target.value);
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            loadFAQs();
        } else {
            e.target.value = currentPage;
        }
    });

    // Select All
    const selectAllCheckbox = document.querySelector('.select-all-toolbar');
    selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            const faqId = cb.dataset.id;
            if (e.target.checked) {
                selectedFAQs.add(faqId);
            } else {
                selectedFAQs.delete(faqId);
            }
        });
    });

    // Export Table
    const exportBtn = document.querySelector('.export-table');
    exportBtn.addEventListener('click', exportTable);
}

// ==================== LOAD FAQs ==================== //
async function loadFAQs(search = '') {
    try {
        const response = await fetch('/api/faqs');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to load FAQs');
        }

        // Filter by search (question only)
        let filteredFAQs = data;
        if (search) {
            filteredFAQs = data.filter(faq => 
                faq.question.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Manual pagination (10 per page)
        const limit = 10;
        const total = filteredFAQs.length;
        totalPages = Math.ceil(total / limit) || 1;
        
        // Adjust current page if out of bounds
        if (currentPage > totalPages) currentPage = totalPages;

        const startIndex = (currentPage - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedFAQs = filteredFAQs.slice(startIndex, endIndex);

        faqsData = paginatedFAQs;

        renderTable(paginatedFAQs);
        updatePagination({
            page: currentPage,
            pages: totalPages,
            total: total,
            limit: limit
        });

    } catch (error) {
        console.error('Load FAQs error:', error);
        customNotification('error', 'Error', error.message);
    }
}

// ==================== RENDER TABLE ==================== //
function renderTable(faqs) {
    const tbody = document.querySelector('.table tbody');

    if (faqs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 40px; color: var(--light-grey);">
                    No FAQs found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = faqs.map(faq => `
        <tr data-faq-id="${faq._id}">
            <td style="vertical-align: top; padding-top: 20px;">
                <input type="checkbox" data-id="${faq._id}" ${selectedFAQs.has(faq._id) ? 'checked' : ''}>
            </td>
            <td class="faq-content">
                <div class="faq-item">
                    <span class="faq-label">Question:</span>
                    <span class="faq-question" data-field="question">${escapeHtml(faq.question)}</span>
                </div>
                <div class="faq-item">
                    <span class="faq-label">Answer:</span>
                    <span class="faq-answer" data-field="answer">${escapeHtml(faq.answer)}</span>
                </div>
                <div class="faq-item">
                    <span class="faq-label">Category:</span>
                    <span class="faq-category" data-field="category">${escapeHtml(faq.category)}</span>
                </div>
                <div class="faq-actions">
                    <button data-tooltip="Edit" onclick="editFAQ('${faq._id}')">
                        <i class='bx bx-edit'></i>
                    </button>
                    <button data-tooltip="Delete" onclick="deleteFAQ('${faq._id}')">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </td>
            <td></td>
        </tr>
    `).join('');

    const checkboxes = tbody.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            const faqId = e.target.dataset.id;
            if (e.target.checked) {
                selectedFAQs.add(faqId);
            } else {
                selectedFAQs.delete(faqId);
            }
            updateSelectAllCheckbox();
        });
    });
}

// ==================== ESCAPE HTML ==================== //
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== UPDATE PAGINATION ==================== //
function updatePagination(pagination) {
    document.getElementById('start-entry').textContent =
        pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.limit + 1);
    document.getElementById('end-entry').textContent =
        Math.min(pagination.page * pagination.limit, pagination.total);
    document.getElementById('total-entries').textContent = pagination.total;
    document.getElementById('total-pages').textContent = pagination.pages;
    document.getElementById('current-page').value = pagination.page;

    document.getElementById('prev-page').disabled = pagination.page === 1;
    document.getElementById('next-page').disabled = pagination.page === pagination.pages;
}

// ==================== UPDATE SELECT ALL CHECKBOX ==================== //
function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.querySelector('.select-all-toolbar');
    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    const noneChecked = Array.from(checkboxes).every(cb => !cb.checked);

    selectAllCheckbox.checked = allChecked;
    selectAllCheckbox.indeterminate = !allChecked && !noneChecked;
}

// ==================== INLINE EDIT FAQ ==================== //
function editFAQ(faqId) {
    // If already editing another FAQ, cancel that first
    if (editingFAQId && editingFAQId !== faqId) {
        cancelEdit();
    }

    editingFAQId = faqId;
    const row = document.querySelector(`tr[data-faq-id="${faqId}"]`);
    if (!row) return;

    const faq = faqsData.find(f => f._id === faqId);
    if (!faq) return;

    const faqContent = row.querySelector('.faq-content');
    
    // Store original HTML for cancel
    faqContent.dataset.originalHtml = faqContent.innerHTML;

    faqContent.innerHTML = `
        <div class="faq-item">
            <span class="faq-label">Question:</span>
            <input type="text" class="faq-edit-input" id="edit-question-${faqId}" value="${escapeHtml(faq.question)}">
        </div>
        <div class="faq-item">
            <span class="faq-label">Answer:</span>
            <textarea class="faq-edit-textarea" id="edit-answer-${faqId}" rows="4">${escapeHtml(faq.answer)}</textarea>
        </div>
        <div class="faq-item">
            <span class="faq-label">Category:</span>
            <select class="faq-edit-select" id="edit-category-${faqId}">
                <option value="General" ${faq.category === 'General' ? 'selected' : ''}>General</option>
                <option value="News" ${faq.category === 'News' ? 'selected' : ''}>News</option>
                <option value="Interactive Map" ${faq.category === 'Interactive Map' ? 'selected' : ''}>Interactive Map</option>
                <option value="Virtual Tour" ${faq.category === 'Virtual Tour' ? 'selected' : ''}>Virtual Tour</option>
                <option value="Feedback" ${faq.category === 'Feedback' ? 'selected' : ''}>Feedback</option>
            </select>
        </div>
        <div class="faq-actions">
            <button data-tooltip="Save" onclick="saveEdit('${faqId}')">
                <i class='bx bx-check'></i>
            </button>
            <button data-tooltip="Cancel" onclick="cancelEdit()">
                <i class='bx bx-x'></i>
            </button>
        </div>
    `;
}

// ==================== SAVE EDIT ==================== //
async function saveEdit(faqId) {
    const question = document.getElementById(`edit-question-${faqId}`).value.trim();
    const answer = document.getElementById(`edit-answer-${faqId}`).value.trim();
    const category = document.getElementById(`edit-category-${faqId}`).value;

    if (!question || !answer) {
        customNotification('error', 'Validation Error', 'Question and answer are required.');
        return;
    }

    try {
        const response = await fetch(`/api/faqs/${faqId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, answer, category })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update FAQ');
        }

        customNotification('success', 'Success', 'FAQ updated successfully.');
        editingFAQId = null;
        loadFAQs();

    } catch (error) {
        console.error('Update FAQ error:', error);
        customNotification('error', 'Error', error.message);
    }
}

// ==================== CANCEL EDIT ==================== //
function cancelEdit() {
    if (!editingFAQId) return;

    const row = document.querySelector(`tr[data-faq-id="${editingFAQId}"]`);
    if (!row) return;

    const faqContent = row.querySelector('.faq-content');
    if (faqContent && faqContent.dataset.originalHtml) {
        faqContent.innerHTML = faqContent.dataset.originalHtml;
    }

    editingFAQId = null;
}

// ==================== DELETE FAQ ==================== //
async function deleteFAQ(faqId) {
    showConfirmModal({
        icon: 'bx-trash',
        iconColor: 'var(--cream)',
        title: 'Delete FAQ?',
        message: 'Are you sure you want to delete this FAQ? This action cannot be undone.',
        confirmText: 'Yes, Delete',
        confirmColor: 'var(--red)',
        onConfirm: async (btn) => {
            btn.disabled = true;
            btn.textContent = 'Deleting...';

            try {
                const response = await fetch(`/api/faqs/${faqId}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to delete FAQ');
                }

                customNotification('success', 'Success', data.message);
                loadFAQs();

            } catch (error) {
                console.error('Delete FAQ error:', error);
                customNotification('error', 'Error', error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Yes, Delete';
            }
        }
    });
}

// ==================== DELETE SELECTED FAQs ==================== //
async function deleteSelectedFAQs() {
    if (selectedFAQs.size === 0) {
        customNotification('error', 'No Selection', 'Please select at least one FAQ to delete.');
        return;
    }

    showConfirmModal({
        icon: 'bx-trash',
        iconColor: 'var(--cream)',
        title: 'Delete FAQs?',
        message: `Are you sure you want to delete ${selectedFAQs.size} FAQ(s)? This action cannot be undone.`,
        confirmText: 'Yes, Delete',
        confirmColor: 'var(--red)',
        onConfirm: async (btn) => {
            btn.disabled = true;
            btn.textContent = 'Deleting...';

            try {
                const response = await fetch('/api/faqs/bulk-delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: Array.from(selectedFAQs) })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to delete FAQs');
                }

                customNotification('success', 'Success', data.message);
                selectedFAQs.clear();
                loadFAQs();

            } catch (error) {
                console.error('Delete FAQs error:', error);
                customNotification('error', 'Error', error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Yes, Delete';
            }
        }
    });
}

// ==================== EXPORT TABLE ==================== //
function exportTable() {
    if (faqsData.length === 0) {
        customNotification('error', 'No Data', 'No data available to export.');
        return;
    }

    const headers = ['Question', 'Answer', 'Category'];
    const rows = faqsData.map(faq => [
        faq.question,
        faq.answer,
        faq.category
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faqs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    customNotification('success', 'Success', 'FAQs exported successfully.');
}