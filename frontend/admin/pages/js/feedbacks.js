import showToast from './toast.js';
import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── State ────────────────────────────────────────────────────────────────────
let allFeedbacks = [];
let activeFilter = 'all';
let selectedFeedbackId = null;

// ─── Elements ─────────────────────────────────────────────────────────────────
const feedbackList = document.getElementById('feedbackList');
const unreadCount = document.getElementById('unreadCount');
const viewModalOverlay = document.getElementById('viewModalOverlay');
const closeViewModalBtn = document.getElementById('closeViewModal');
const modalRating = document.getElementById('modalRating');
const modalComment = document.getElementById('modalComment');
const modalDate = document.getElementById('modalDate');
const deleteModalBtn = document.getElementById('deleteModalBtn');
const deleteModalOverlay = document.getElementById('deleteModalOverlay');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');

// ─── Fetch Feedbacks ──────────────────────────────────────────────────────────
async function fetchFeedbacks() {
    await showLoading();
    try {
        const res = await fetch('/api/feedbacks', { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        allFeedbacks = data.feedbacks;
        updateUnreadCount();
        renderList();
    } catch (err) {
        showToast('error', 'Failed to load feedbacks.');
    } finally {
        hideLoading();
    }
}

// ─── Unread Count ─────────────────────────────────────────────────────────────
function updateUnreadCount() {
    const count = allFeedbacks.filter(f => !f.isRead).length;
    if (count > 0) {
        unreadCount.textContent = count;
        unreadCount.classList.remove('hidden');
    } else {
        unreadCount.classList.add('hidden');
    }
}

// ─── Render List ──────────────────────────────────────────────────────────────
function renderList() {
    feedbackList.innerHTML = '';

    const filtered = allFeedbacks.filter(f => {
        if (activeFilter === 'unread') return !f.isRead;
        if (activeFilter === 'read') return f.isRead;
        return true;
    });

    if (filtered.length === 0) {
        feedbackList.innerHTML = `
            <div class="empty-state">
                <i class='bx bx-comment-x'></i>
                <p>No feedbacks found.</p>
            </div>
        `;
        return;
    }

    filtered.forEach(feedback => {
        const date = new Date(feedback.createdAt).toLocaleDateString('en-PH', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        const card = document.createElement('div');
        card.classList.add('feedback-card');
        if (!feedback.isRead) card.classList.add('unread');

        card.innerHTML = `
            <div class="card-stars">
                ${renderStars(feedback.rating)}
            </div>
            ${feedback.comment
                ? `<p class="card-comment">${feedback.comment}</p>`
                : `<p class="card-no-comment">No comment provided.</p>`
            }
            <p class="card-date">
                <i class='bx bx-calendar'></i> ${date}
            </p>
        `;

        card.addEventListener('click', () => openViewModal(feedback));
        feedbackList.appendChild(card);
    });
}

// ─── Stars Helper ─────────────────────────────────────────────────────────────
function renderStars(rating) {
    return Array.from({ length: 5 }, (_, i) =>
        `<i class='bx bxs-star ${i < rating ? 'filled' : ''}'></i>`
    ).join('');
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeFilter = tab.dataset.filter;
        renderList();
    });
});

// ─── View Modal ───────────────────────────────────────────────────────────────
async function openViewModal(feedback) {
    selectedFeedbackId = feedback._id;

    const date = new Date(feedback.createdAt).toLocaleDateString('en-PH', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    modalRating.innerHTML = renderStars(feedback.rating);
    modalComment.className = feedback.comment ? 'modal-comment' : 'modal-no-comment';
    modalComment.textContent = feedback.comment || 'No comment provided.';
    modalDate.innerHTML = `<i class='bx bx-calendar'></i> ${date}`;

    viewModalOverlay.classList.remove('hidden');

    // Mark as read if unread
    if (!feedback.isRead) {
        try {
            await fetch(`/api/feedbacks/${feedback._id}/read`, {
                method: 'PATCH',
                headers: { 'Accept': 'application/json' }
            });
            // Update local state
            const index = allFeedbacks.findIndex(f => f._id === feedback._id);
            if (index !== -1) allFeedbacks[index].isRead = true;
            updateUnreadCount();
            renderList();
        } catch (err) {
            // Silently fail — not critical
        }
    }
}

closeViewModalBtn.addEventListener('click', () => {
    viewModalOverlay.classList.add('hidden');
    selectedFeedbackId = null;
});

// ─── Delete Modal ─────────────────────────────────────────────────────────────
deleteModalBtn.addEventListener('click', () => {
    viewModalOverlay.classList.add('hidden');
    deleteModalOverlay.classList.remove('hidden');
});

cancelDelete.addEventListener('click', () => {
    deleteModalOverlay.classList.add('hidden');
    selectedFeedbackId = null;
});

confirmDelete.addEventListener('click', async () => {
    if (!selectedFeedbackId) return;
    deleteModalOverlay.classList.add('hidden');
    await showLoading();
    try {
        const res = await fetch(`/api/feedbacks/${selectedFeedbackId}`, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (!res.ok) {
            showToast('error', data.error || 'Failed to delete feedback.');
        } else {
            showToast('success', 'Feedback deleted successfully!');
            allFeedbacks = allFeedbacks.filter(f => f._id !== selectedFeedbackId);
            selectedFeedbackId = null;
            updateUnreadCount();
            renderList();
        }
    } catch (err) {
        showToast('error', 'Failed to delete feedback.');
    } finally {
        hideLoading();
    }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
fetchFeedbacks();