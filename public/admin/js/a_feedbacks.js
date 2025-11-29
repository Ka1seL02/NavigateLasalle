// ==================== STATE MANAGEMENT ==================== //
let currentPage = 1;
let totalPages = 1;
let feedbacksData = [];
let allFeedbacksData = []; // Store all feedbacks for filtering
let selectedFeedbacks = new Set();
let currentFilter = 'all'; // all, read, unread
let currentSort = { field: 'date', order: 'desc' }; // Default sort by date descending

// ==================== INITIALIZATION ==================== //
document.addEventListener('DOMContentLoaded', () => {
    loadFeedbacks();
    initializeEventListeners();
});

// ==================== EVENT LISTENERS ==================== //
function initializeEventListeners() {
    // Filter Buttons
    const filterButtons = document.querySelectorAll('.filter-buttons button');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            currentPage = 1;
            selectedFeedbacks.clear();
            applyFilter();
        });
    });

    // Refresh
    const refreshBtn = document.getElementById('refresh-table');
    refreshBtn.addEventListener('click', () => {
        selectedFeedbacks.clear();
        currentPage = 1;
        loadFeedbacks();
    });

    // Delete Selected
    const deleteBtn = document.getElementById('delete-selected');
    deleteBtn.addEventListener('click', deleteSelectedFeedbacks);

    // Mark as Read
    const readBtn = document.getElementById('read-selected');
    readBtn.addEventListener('click', () => markSelectedAs(true));

    // Mark as Unread
    const unreadBtn = document.getElementById('unread-selected');
    unreadBtn.addEventListener('click', () => markSelectedAs(false));

    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            applyFilter();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            applyFilter();
        }
    });

    const pageInput = document.getElementById('current-page');
    pageInput.addEventListener('change', (e) => {
        const page = parseInt(e.target.value);
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            applyFilter();
        } else {
            e.target.value = currentPage;
        }
    });

    // Select All
    const selectAllCheckbox = document.querySelector('.select-all-toolbar');
    selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('tbody .feedback-row input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            const feedbackId = cb.dataset.id;
            if (e.target.checked) {
                selectedFeedbacks.add(feedbackId);
            } else {
                selectedFeedbacks.delete(feedbackId);
            }
        });
    });

    // Sorting
    const sortableHeaders = document.querySelectorAll('th[data-sort]');
    sortableHeaders.forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            const sortField = header.dataset.sort;
            
            // Toggle sort order if clicking same column
            if (currentSort.field === sortField) {
                currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.field = sortField;
                currentSort.order = 'desc'; // Default to descending for new column
            }
            
            currentPage = 1;
            applyFilter();
            updateSortIndicators();
        });
    });
    
    updateSortIndicators();
}

// ==================== LOAD FEEDBACKS ==================== //
async function loadFeedbacks() {
    try {
        const response = await fetch('/api/feedbacks');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to load feedbacks');
        }

        allFeedbacksData = data;
        applyFilter();

    } catch (error) {
        console.error('Load feedbacks error:', error);
        customNotification('error', 'Error', error.message);
    }
}

// ==================== APPLY FILTER ==================== //
function applyFilter() {
    let filteredData = [...allFeedbacksData];

    // Apply read/unread filter
    if (currentFilter === 'read') {
        filteredData = filteredData.filter(fb => fb.isRead === true);
    } else if (currentFilter === 'unread') {
        filteredData = filteredData.filter(fb => fb.isRead === false);
    }

    // Apply sorting
    filteredData.sort((a, b) => {
        let compareA, compareB;
        
        if (currentSort.field === 'rating') {
            compareA = a.rating;
            compareB = b.rating;
        } else if (currentSort.field === 'date') {
            compareA = new Date(a.dateSubmitted);
            compareB = new Date(b.dateSubmitted);
        }
        
        if (currentSort.order === 'asc') {
            return compareA > compareB ? 1 : -1;
        } else {
            return compareA < compareB ? 1 : -1;
        }
    });

    // Pagination (20 per page, but counting only feedback rows, not detail rows)
    const limit = 20;
    const total = filteredData.length;
    totalPages = Math.ceil(total / limit) || 1;
    
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    feedbacksData = paginatedData;

    renderTable(paginatedData);
    updatePagination({
        page: currentPage,
        pages: totalPages,
        total: total,
        limit: limit
    });
}

// ==================== FORMAT DATE (FEEDBACK ROW) ==================== //
function formatDate(dateString) {
    if (!dateString) return '';
    
    const feedbackDate = new Date(dateString);
    const currentDate = new Date();
    
    feedbackDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    const diffMs = currentDate - feedbackDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Today
    if (diffDays === 0) return "Today";
    
    // 1-6 days ago
    if (diffDays >= 1 && diffDays <= 6) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
    
    // 7+ days (weeks)
    if (diffDays >= 7 && diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    
    // Month ago (within same year) - format: Mar 13
    const yearDiff = currentDate.getFullYear() - feedbackDate.getFullYear();
    if (yearDiff === 0 || (yearDiff === 1 && currentDate.getMonth() < feedbackDate.getMonth())) {
        return feedbackDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    // Year+ ago - format: yyyy/mm/dd
    const year = feedbackDate.getFullYear();
    const month = String(feedbackDate.getMonth() + 1).padStart(2, '0');
    const day = String(feedbackDate.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// ==================== FORMAT TIMESTAMP (DETAIL ROW) ==================== //
function formatTimestamp(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    // Time format: 11:36 AM
    const time = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    
    // Date format: March 26, 2025
    const fullDate = date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    });
    
    return `${time} • ${fullDate}`;
}

// ==================== RENDER TABLE ==================== //
function renderTable(feedbacks) {
    const tbody = document.querySelector('.table tbody');

    if (feedbacks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--light-grey);">
                    No feedbacks found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = feedbacks.map(fb => {
        const unreadClass = fb.isRead ? '' : 'unread';
        const formattedDate = formatDate(fb.dateSubmitted);
        const formattedTimestamp = formatTimestamp(fb.dateSubmitted);
        
        return `
            <tr class="feedback-row ${unreadClass}" data-feedback-id="${fb._id}">
                <td><input type="checkbox" data-id="${fb._id}" ${selectedFeedbacks.has(fb._id) ? 'checked' : ''}></td>
                <td class="rating rating-${fb.rating}">${fb.rating}</td>
                <td class="feedback">${escapeHtml(fb.feedback)}</td>
                <td class="date">${formattedDate}</td>
                <td style="cursor: pointer;" onclick="toggleDetails('${fb._id}')">
                    <i class='bx bx-chevron-down'></i>
                </td>
                <td><i class='bx bx-dots-vertical-rounded'></i></td>
            </tr>
            <tr class="details-row hidden" data-details-id="${fb._id}">
                <td></td>
                <td></td>
                <td>
                    <p class="details-feedback">${escapeHtml(fb.feedback)}</p>
                    <br>
                    <small class="details-timestamp">${formattedTimestamp}</small>
                </td>
                <td></td>
                <td>
                    <button data-tooltip="Delete" onclick="deleteFeedback('${fb._id}')">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
                <td></td>
            </tr>
        `;
    }).join('');

    // Add checkbox listeners
    const checkboxes = tbody.querySelectorAll('.feedback-row input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            const feedbackId = e.target.dataset.id;
            if (e.target.checked) {
                selectedFeedbacks.add(feedbackId);
            } else {
                selectedFeedbacks.delete(feedbackId);
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

// ==================== TOGGLE DETAILS (COLLAPSE) ==================== //
async function toggleDetails(feedbackId) {
    const feedbackRow = document.querySelector(`.feedback-row[data-feedback-id="${feedbackId}"]`);
    const detailsRow = document.querySelector(`.details-row[data-details-id="${feedbackId}"]`);
    
    if (!feedbackRow || !detailsRow) return;

    const isHidden = detailsRow.classList.contains('hidden');
    
    // Toggle visibility
    detailsRow.classList.toggle('hidden');
    
    // If expanding and is unread, mark as read
    if (isHidden && feedbackRow.classList.contains('unread')) {
        await markAsRead(feedbackId);
        feedbackRow.classList.remove('unread');
    }
}

// ==================== MARK AS READ ==================== //
async function markAsRead(feedbackId) {
    try {
        const response = await fetch(`/api/feedbacks/${feedbackId}/read`, {
            method: 'PATCH'
        });

        if (!response.ok) {
            throw new Error('Failed to mark as read');
        }

        // Update local data
        const feedback = allFeedbacksData.find(fb => fb._id === feedbackId);
        if (feedback) feedback.isRead = true;

    } catch (error) {
        console.error('Mark as read error:', error);
    }
}

// ==================== MARK SELECTED AS READ/UNREAD ==================== //
async function markSelectedAs(isRead) {
    if (selectedFeedbacks.size === 0) {
        customNotification('error', 'No Selection', 'Please select at least one feedback.');
        return;
    }

    const action = isRead ? 'read' : 'unread';
    
    showConfirmModal({
        icon: isRead ? 'bx-envelope-open' : 'bx-envelope',
        iconColor: 'var(--cream)',
        title: `Mark as ${action.charAt(0).toUpperCase() + action.slice(1)}?`,
        message: `Mark ${selectedFeedbacks.size} feedback(s) as ${action}?`,
        confirmText: `Yes, Mark as ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        confirmColor: 'var(--green)',
        onConfirm: async (btn) => {
            btn.disabled = true;
            btn.textContent = 'Processing...';

            try {
                const response = await fetch(`/api/feedbacks/bulk/${action}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: Array.from(selectedFeedbacks) })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || `Failed to mark as ${action}`);
                }

                customNotification('success', 'Success', data.message);
                
                // Update local data
                selectedFeedbacks.forEach(id => {
                    const feedback = allFeedbacksData.find(fb => fb._id === id);
                    if (feedback) feedback.isRead = isRead;
                });

                selectedFeedbacks.clear();
                applyFilter();

            } catch (error) {
                console.error(`Mark as ${action} error:`, error);
                customNotification('error', 'Error', error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = `Yes, Mark as ${action.charAt(0).toUpperCase() + action.slice(1)}`;
            }
        }
    });
}

// ==================== DELETE FEEDBACK ==================== //
async function deleteFeedback(feedbackId) {
    showConfirmModal({
        icon: 'bx-trash',
        iconColor: 'var(--cream)',
        title: 'Delete Feedback?',
        message: 'Are you sure you want to delete this feedback? This action cannot be undone.',
        confirmText: 'Yes, Delete',
        confirmColor: 'var(--red)',
        onConfirm: async (btn) => {
            btn.disabled = true;
            btn.textContent = 'Deleting...';

            try {
                const response = await fetch(`/api/feedbacks/${feedbackId}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to delete feedback');
                }

                customNotification('success', 'Success', data.message);
                
                // Remove from local data
                allFeedbacksData = allFeedbacksData.filter(fb => fb._id !== feedbackId);
                applyFilter();

            } catch (error) {
                console.error('Delete feedback error:', error);
                customNotification('error', 'Error', error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Yes, Delete';
            }
        }
    });
}

// ==================== DELETE SELECTED FEEDBACKS ==================== //
async function deleteSelectedFeedbacks() {
    if (selectedFeedbacks.size === 0) {
        customNotification('error', 'No Selection', 'Please select at least one feedback to delete.');
        return;
    }

    showConfirmModal({
        icon: 'bx-trash',
        iconColor: 'var(--cream)',
        title: 'Delete Feedbacks?',
        message: `Are you sure you want to delete ${selectedFeedbacks.size} feedback(s)? This action cannot be undone.`,
        confirmText: 'Yes, Delete',
        confirmColor: 'var(--red)',
        onConfirm: async (btn) => {
            btn.disabled = true;
            btn.textContent = 'Deleting...';

            try {
                const response = await fetch('/api/feedbacks/bulk-delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: Array.from(selectedFeedbacks) })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to delete feedbacks');
                }

                customNotification('success', 'Success', data.message);
                
                // Remove from local data
                allFeedbacksData = allFeedbacksData.filter(fb => !selectedFeedbacks.has(fb._id));
                selectedFeedbacks.clear();
                applyFilter();

            } catch (error) {
                console.error('Delete feedbacks error:', error);
                customNotification('error', 'Error', error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Yes, Delete';
            }
        }
    });
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
    const checkboxes = document.querySelectorAll('tbody .feedback-row input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    const noneChecked = Array.from(checkboxes).every(cb => !cb.checked);

    selectAllCheckbox.checked = allChecked;
    selectAllCheckbox.indeterminate = !allChecked && !noneChecked;
}

// ==================== UPDATE SORT INDICATORS ==================== //
function updateSortIndicators() {
    const headers = document.querySelectorAll('th[data-sort]');
    
    headers.forEach(header => {
        const sortField = header.dataset.sort;
        
        // Remove existing indicators
        header.innerHTML = header.innerHTML.replace(/ ▲| ▼/g, '');
        
        // Add indicator to active sort column
        if (currentSort.field === sortField) {
            const indicator = currentSort.order === 'asc' ? ' ▲' : ' ▼';
            header.innerHTML += indicator;
        }
    });
}