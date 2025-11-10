// ---------------- Elements ----------------
const tbody = document.querySelector('.table tbody');
const searchInput = document.querySelector('.search-box input'); // optional
const statusTabsContainer = document.querySelector('.status-tabs');
const refreshBtn = document.getElementById('refresh-table');

const selectAllToolbar = document.querySelector('.select-all-toolbar');
const markReadBtn = document.getElementById('mark-read-selected');
const markUnreadBtn = document.getElementById('mark-unread-selected');
const deleteSelectedBtn = document.getElementById('delete-selected');

const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const entriesCountSpan = document.querySelector('.entries-count');

// Date filter
const dateInput = document.getElementById('filter-date');
const clearDateBtn = document.getElementById('clear-date');

let feedbackData = [];
let filteredData = [];
let currentPage = 1;
const maxPerPage = 50;
let totalPages = 1;

// ---------------- Format Date ----------------
function formatDate(dateString) {
    if (!dateString) return '';
    const fetchDate = new Date(dateString);
    const currentDate = new Date();
    fetchDate.setHours(0,0,0,0);
    currentDate.setHours(0,0,0,0);

    const diffMs = currentDate - fetchDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 365) {
        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays >= 2 && diffDays < 7) return `${diffDays} days ago`;
        const weeks = Math.floor(diffDays / 7);
        if (weeks >= 1 && weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        return fetchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return fetchDate.toLocaleDateString('en-GB');
}

// ---------------- Load Feedbacks ----------------
async function loadFeedbacks() {
    try {
        const res = await fetch('/api/feedbacks');
        feedbackData = await res.json();
        applyFilters();
        currentPage = 1;
        totalPages = Math.ceil(filteredData.length / maxPerPage);
        renderTable();
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="5" class="empty-list">Failed to load feedbacks.</td></tr>`;
    }
}

// ---------------- Filter ----------------
function applyFilters() {
    const activeTab = statusTabsContainer?.querySelector('.status.active');
    const status = activeTab?.textContent.toLowerCase();
    const selectedDate = dateInput?.value;

    filteredData = feedbackData.filter(f => {
        // Filter by status
        if (status === 'read' && !f.isRead) return false;
        if (status === 'unread' && f.isRead) return false;

        // Filter by date
        if (selectedDate) {
            const feedbackDate = new Date(f.dateSubmitted);
            feedbackDate.setHours(0,0,0,0);
            const filterDate = new Date(selectedDate);
            filterDate.setHours(0,0,0,0);
            if (feedbackDate.getTime() !== filterDate.getTime()) return false;
        }

        return true;
    });

    totalPages = Math.ceil(filteredData.length / maxPerPage);
}

// ---------------- Render Table ----------------
function renderTable() {
    const start = (currentPage - 1) * maxPerPage;
    const end = start + maxPerPage;
    const pageData = filteredData.slice(start, end);

    if (!pageData.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-list">No feedback found.</td></tr>`;
        entriesCountSpan.textContent = `0 of 0`;
        disableControls();
        return;
    }

    tbody.innerHTML = pageData.map(f => {
        const date = formatDate(f.dateSubmitted);
        return `
      <tr class="main-row" data-id="${f._id}">
        <td class="checkbox-column">
          <input type="checkbox" class="select-account" data-id="${f._id}">
        </td>
        <td>${f.feedback}</td>
        <td>${f.rating}</td>
        <td>${date}</td>
        <td class="dropdown"><i class="bx bx-caret-down"></i></td>
      </tr>
      <tr class="detail-row" style="display:none;">
        <td colspan="5">
          <div class="detail-content">
            <p><strong>Rating:</strong> ${f.rating}</p>
            <p><strong>Feedback:</strong> ${f.feedback}</p>
            <p><strong>Date Submitted:</strong> ${date}</p>
          </div>
          <div class="details-button-group">
            <button class="detail-button delete" data-id="${f._id}">DELETE</button>
            <button class="detail-button close">CLOSE</button>
          </div>
        </td>
      </tr>
    `;
    }).join('');

    updateEntriesCount();
    updatePaginationButtons();
    updateToolbarState();
}

// ---------------- Entries Count ----------------
function updateEntriesCount() {
    const start = filteredData.length ? (currentPage - 1) * maxPerPage + 1 : 0;
    const end = Math.min(currentPage * maxPerPage, filteredData.length);
    entriesCountSpan.textContent = `${start}-${end} of ${filteredData.length}`;
}

// ---------------- Pagination ----------------
function updatePaginationButtons() {
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
    prevPageBtn.style.opacity = prevPageBtn.disabled ? 0.5 : 1;
    nextPageBtn.style.opacity = nextPageBtn.disabled ? 0.5 : 1;
}

prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) currentPage--;
    renderTable();
});

nextPageBtn.addEventListener('click', () => {
    if (currentPage < totalPages) currentPage++;
    renderTable();
});

// ---------------- Toolbar Controls ----------------
function getSelectedIds() {
    return Array.from(document.querySelectorAll('.select-account:checked')).map(cb => cb.dataset.id);
}

function updateToolbarState() {
    const hasSelection = getSelectedIds().length > 0;
    [markReadBtn, markUnreadBtn, deleteSelectedBtn].forEach(el => {
        if (!el) return;
        el.disabled = !hasSelection;
        el.style.opacity = hasSelection ? 1 : 0.5;
    });
    if (selectAllToolbar) {
        selectAllToolbar.disabled = false;
        selectAllToolbar.style.opacity = 1;
    }
}

function disableControls() {
    [markReadBtn, markUnreadBtn, deleteSelectedBtn].forEach(el => {
        if (!el) return;
        el.disabled = true;
        el.style.opacity = 0.5;
    });
}

selectAllToolbar?.addEventListener('change', e => {
    document.querySelectorAll('.select-account').forEach(cb => cb.checked = e.target.checked);
    updateToolbarState();
});

tbody.addEventListener('change', e => {
    if (e.target.classList.contains('select-account')) updateToolbarState();
});

// ---------------- Toolbar Actions ----------------
async function markFeedbacks(ids, isRead) {
    if (!ids.length) return alert('Please select at least one feedback.');
    const confirmMsg = isRead ? `Mark ${ids.length} feedback(s) as read?` : `Mark ${ids.length} feedback(s) as unread?`;
    if (!confirm(confirmMsg)) return;
    try {
        await Promise.all(ids.map(id =>
            fetch(`/api/feedbacks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isRead })
            })
        ));
        await loadFeedbacks();
    } catch (err) {
        console.error(err);
        alert('Failed to update feedback status.');
    }
}

async function deleteFeedbacks(ids) {
    if (!ids.length) return alert('Please select at least one feedback.');
    if (!confirm(`Delete ${ids.length} feedback(s)? This cannot be undone.`)) return;
    try {
        await Promise.all(ids.map(id =>
            fetch(`/api/feedbacks/${id}`, { method: 'DELETE' })
        ));
        await loadFeedbacks();
    } catch (err) {
        console.error(err);
        alert('Failed to delete feedback.');
    }
}

markReadBtn?.addEventListener('click', () => markFeedbacks(getSelectedIds(), true));
markUnreadBtn?.addEventListener('click', () => markFeedbacks(getSelectedIds(), false));
deleteSelectedBtn?.addEventListener('click', () => deleteFeedbacks(getSelectedIds()));

// ---------------- Detail Row Buttons & Collapse ----------------
tbody.addEventListener('click', async e => {
    const btn = e.target.closest('.detail-button');
    const mainRow = e.target.closest('.main-row');

    // Collapse dropdown
    if (mainRow && e.target.closest('.dropdown')) {
        const detailRow = mainRow.nextElementSibling;
        if (!detailRow || !detailRow.classList.contains('detail-row')) return;
        const isOpening = detailRow.style.display !== 'table-row';
        detailRow.style.display = isOpening ? 'table-row' : 'none';

        // Mark as read when opening
        if (isOpening) {
            const id = mainRow.dataset.id;
            const feedback = feedbackData.find(f => f._id === id);
            if (feedback && !feedback.isRead) {
                try {
                    await fetch(`/api/feedbacks/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isRead: true })
                    });
                    feedback.isRead = true;
                } catch (err) { console.error(err); }
            }
        }
        return;
    }

    // Detail row buttons
    if (!btn) return;
    const tr = btn.closest('tr.detail-row');
    const id = btn.dataset.id || tr.previousElementSibling.dataset.id;

    if (btn.classList.contains('delete')) {
        if (!confirm('Delete this feedback?')) return;
        try {
            await fetch(`/api/feedbacks/${id}`, { method: 'DELETE' });
            loadFeedbacks();
        } catch (err) {
            console.error(err);
            alert('Failed to delete feedback.');
        }
    } else if (btn.classList.contains('close')) {
        tr.style.display = 'none';
    }
});

// ---------------- Status Tabs ----------------
statusTabsContainer?.addEventListener('click', e => {
    if (!e.target.classList.contains('status')) return;
    statusTabsContainer.querySelectorAll('.status').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    currentPage = 1;
    applyFilters();
    renderTable();
});

// ---------------- Date Filter ----------------
dateInput?.addEventListener('change', () => {
    currentPage = 1;
    applyFilters();
    renderTable();
});

clearDateBtn?.addEventListener('click', () => {
    if (dateInput) dateInput.value = '';
    currentPage = 1;
    applyFilters();
    renderTable();
});

// ---------------- Refresh Button ----------------
refreshBtn?.addEventListener('click', () => {
    if (dateInput) dateInput.value = '';
    loadFeedbacks();
});

// ---------------- Initial Load ----------------
loadFeedbacks();