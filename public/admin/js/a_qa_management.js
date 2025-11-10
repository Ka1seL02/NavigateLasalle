// ---------------- Elements ----------------
const tbody = document.querySelector('.table tbody');
const selectAllToolbar = document.querySelector('.select-all-toolbar');
const refreshBtn = document.getElementById('refresh-table');
const deleteSelectedBtn = document.getElementById('delete-selected');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const entriesCount = document.querySelector('.entries-count');

// Modal Elements
const faqModal = document.getElementById('faqModal');
const openModalBtn = document.querySelector('.green-button');
const closeModalBtn = document.getElementById('closeFaqModal');
const cancelFaqBtn = document.getElementById('cancelFaqBtn');
const submitFaqBtn = document.getElementById('submitFaqBtn');
const faqForm = document.getElementById('faqForm');
const faqQuestion = document.getElementById('faqQuestion');
const faqAnswer = document.getElementById('faqAnswer');

let faqData = [];
let currentPage = 1;
const maxPerPage = 5;
let totalPages = 1;

// ---------------- Load FAQs ----------------
async function loadFAQs() {
    try {
        const res = await fetch('/api/faqs');
        if (!res.ok) throw new Error('Failed to fetch FAQs');

        faqData = await res.json();
        totalPages = Math.ceil(faqData.length / maxPerPage);
        currentPage = 1;
        renderTable();
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="4" class="empty-list">Failed to load FAQs.</td></tr>`;
    }
}

// ---------------- Render Table ----------------
function renderTable() {
    const start = (currentPage - 1) * maxPerPage;
    const end = start + maxPerPage;
    const pageData = faqData.slice(start, end);

    if (!pageData.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-list">No FAQ found.</td></tr>`;
        entriesCount.textContent = `0 of 0`;
        updatePaginationButtons();
        return;
    }

    tbody.innerHTML = pageData.map(f => `
        <tr class="main-row" data-id="${f._id}">
            <td class="checkbox-column">
                <input type="checkbox" class="select-faq" data-id="${f._id}">
            </td>
            <td>
                <span class="question">${f.question}</span>
                <span class="answer">${f.answer}</span>
            </td>
            <td class="dropdown"><i class="bx bx-caret-down"></i></td>
            <td class="actions">⋮</td>
        </tr>
        <tr class="detail-row" style="display:none;">
            <td colspan="4">
                <div class="detail-content">
                    <p><strong>Question:</strong> ${f.question}</p>
                    <p><strong>Answer:</strong> ${f.answer}</p>
                </div>
                <div class="details-button-group">
                    <button class="detail-button delete" data-id="${f._id}">DELETE</button>
                    <button class="detail-button close">CLOSE</button>
                </div>
            </td>
        </tr>
    `).join('');

    updateEntriesCount();
    updatePaginationButtons();
    updateDeleteButtonState();
}

// ---------------- Entries Count ----------------
function updateEntriesCount() {
    const start = (currentPage - 1) * maxPerPage + 1;
    const end = Math.min(currentPage * maxPerPage, faqData.length);
    entriesCount.textContent = `${start}-${end} of ${faqData.length}`;
}

// ---------------- Pagination ----------------
function updatePaginationButtons() {
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
    prevPageBtn.style.opacity = prevPageBtn.disabled ? 0.5 : 1;
    nextPageBtn.style.opacity = nextPageBtn.disabled ? 0.5 : 1;
}

prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
});

nextPageBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
});

// ---------------- Select All / Individual Checkboxes ----------------
function getSelectedIDs() {
    return Array.from(document.querySelectorAll('.select-faq:checked')).map(cb => cb.dataset.id);
}

selectAllToolbar?.addEventListener('change', e => {
    document.querySelectorAll('.select-faq').forEach(cb => cb.checked = e.target.checked);
    updateDeleteButtonState();
});

tbody.addEventListener('change', e => {
    if (!e.target.classList.contains('select-faq')) return;
    const all = document.querySelectorAll('.select-faq');
    const checked = document.querySelectorAll('.select-faq:checked');
    selectAllToolbar.checked = checked.length === all.length;
    selectAllToolbar.indeterminate = checked.length > 0 && checked.length < all.length;
    updateDeleteButtonState();
});

// ---------------- Delete (Single or Multiple) ----------------
async function deleteFAQs(ids) {
    if (!ids.length) return alert('No FAQs selected.');

    const confirmMsg = ids.length === 1
        ? 'Delete this FAQ?'
        : `Delete ${ids.length} selected FAQs?`;

    if (!confirm(confirmMsg)) return;

    try {
        const res = await fetch('/api/faqs', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
        });

        if (!res.ok) throw new Error('Failed to delete FAQs.');
        await loadFAQs();
    } catch (err) {
        console.error(err);
        alert('Error deleting FAQ(s).');
    }
}

deleteSelectedBtn?.addEventListener('click', () => {
    const ids = getSelectedIDs();
    deleteFAQs(ids);
});

tbody.addEventListener('click', async e => {
    const btn = e.target.closest('.detail-button');
    const mainRow = e.target.closest('.main-row');

    // Toggle detail
    if (mainRow && e.target.closest('.dropdown')) {
        const detailRow = mainRow.nextElementSibling;
        detailRow.style.display = detailRow.style.display === 'table-row' ? 'none' : 'table-row';
        return;
    }

    // Delete button
    if (btn && btn.classList.contains('delete')) {
        const id = btn.dataset.id;
        deleteFAQs([id]);
    }

    // Close button
    if (btn && btn.classList.contains('close')) {
        btn.closest('.detail-row').style.display = 'none';
    }
});

// ---------------- Refresh ----------------
refreshBtn?.addEventListener('click', loadFAQs);

// ---------------- Modal Logic ----------------
function openModal() {
    faqModal.classList.remove('hidden');
}

function closeModal() {
    faqModal.classList.add('hidden');
    faqForm.reset();
}

openModalBtn?.addEventListener('click', openModal);
closeModalBtn?.addEventListener('click', closeModal);
cancelFaqBtn?.addEventListener('click', closeModal);

// ---------------- Add New FAQ ----------------
submitFaqBtn.addEventListener('click', async () => {
    const question = faqQuestion.value.trim();
    const answer = faqAnswer.value.trim();

    if (!question || !answer) {
        alert('Please fill in both fields.');
        return;
    }

    try {
        const res = await fetch('/api/faqs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, answer })
        });

        if (!res.ok) throw new Error('Failed to add FAQ');
        closeModal();
        loadFAQs();
    } catch (err) {
        console.error(err);
        alert('Error adding FAQ.');
    }
});

// ---------------- Enable/Disable Delete Button ----------------
function updateDeleteButtonState() {
    const anyChecked = document.querySelectorAll('.select-faq:checked').length > 0;
    deleteSelectedBtn.disabled = !anyChecked;
    deleteSelectedBtn.classList.toggle('disabled', !anyChecked);
}

// ---------------- Initial Load ----------------
loadFAQs();