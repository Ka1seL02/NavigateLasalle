// a_feedback.js
let currentDate = '';
let currentStatus = 'all';
let currentSort = { column: 'dateSubmitted', order: 'desc' };
let feedbacksData = []; // store fetched feedbacks

async function loadFeedbacks() {
    try {
        const queryParams = new URLSearchParams();
        if (currentDate) queryParams.append('date', currentDate);
        if (currentStatus !== 'all') queryParams.append('status', currentStatus);
        if (currentSort.column) {
            queryParams.append('sortBy', currentSort.column);
            queryParams.append('order', currentSort.order);
        }

        const res = await fetch(`/api/feedbacks?${queryParams.toString()}`);
        feedbacksData = await res.json();

        renderFeedbacks();
    } catch (err) {
        alert('Error loading feedbacks: ' + err.message);
    }
}

function renderFeedbacks() {
    const tableBody = document.querySelector('.table tbody');
    tableBody.innerHTML = '';

    if (!feedbacksData.length) {
        tableBody.innerHTML = `<tr><td colspan="4">No feedbacks found.</td></tr>`;
        document.querySelector('.entries-count').textContent = 'Showing 0 of 0 entries';
        updatePaginationUI(0, renderFeedbacks);
        return;
    }

    const paginated = paginateArray(feedbacksData);

    paginated.forEach(fb => {
        const date = new Date(fb.dateSubmitted);
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${fb.feedback}</td>
            <td>${fb.rating}</td>
            <td>
                <span class="main-text">${formattedDate}</span>
                <span class="sub-text">${formattedTime}</span>
            </td>
            <td>
                ${fb.isRead ? '<button disabled>Read</button>' : `<button class="mark-read" data-id="${fb._id}">Mark Read</button>`}
            </td>
        `;
        tableBody.appendChild(tr);
    });

    document.querySelector('.entries-count').textContent = `Showing ${paginated.length} of ${feedbacksData.length} entries`;
    updatePaginationUI(feedbacksData.length, renderFeedbacks);
}

// Sorting
document.addEventListener('click', (e) => {
    const th = e.target.closest('th[data-sort]');
    if (!th) return;

    const column = th.getAttribute('data-sort');
    if (currentSort.column === column) {
        currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.order = 'asc';
    }

    resetPagination();
    loadFeedbacks();
});

// Status tabs
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.status-tabs .status');
    if (!btn) return;

    document.querySelectorAll('.status-tabs .status').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentStatus = btn.textContent.trim().toLowerCase();

    resetPagination();
    loadFeedbacks();
});

// Date filter
document.addEventListener('change', (e) => {
    if (e.target.matches('.news-date-filter')) {
        currentDate = e.target.value;
        resetPagination();
        loadFeedbacks();
    }
});

// Mark as read
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.mark-read');
    if (!btn || !btn.dataset.id) return;

    try {
        const res = await fetch(`/api/feedbacks/${btn.dataset.id}`, { method: 'PATCH' });
        const data = await res.json();
        alert(data.message);
        loadFeedbacks();
    } catch (err) {
        alert('Error updating feedback: ' + err.message);
    }
});

// DOM Ready
document.addEventListener('DOMContentLoaded', loadFeedbacks);