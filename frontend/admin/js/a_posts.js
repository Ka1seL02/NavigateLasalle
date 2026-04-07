const toggleContainer = document.querySelector('.view-toggle');
const postsContainer = document.getElementById('postsContainer');
const modalOverlay = document.getElementById('modalOverlay');
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const cancelDeleteBtn = document.getElementById('cancelDelete');
const confirmDeleteBtn = document.getElementById('confirmDeletePost');

function slideBackground(activeBtn) {
    if (activeBtn.id === 'listViewBtn') {
        toggleContainer.style.setProperty('--slide-pos', '0%');
        toggleContainer.querySelector('::before');
        toggleContainer.querySelector('button').style.transform = 'translateX(0)';
    } else {
        toggleContainer.style.setProperty('--slide-pos', '100%');
    }
}

// Simplified: Move the pseudo-element
listViewBtn.addEventListener('click', () => {
    postsContainer.classList.remove('grid-view');
    postsContainer.classList.add('list-view');
    listViewBtn.classList.add('active');
    gridViewBtn.classList.remove('active');
    toggleContainer.querySelector('::before').style.transform = 'translateX(0)';
});

gridViewBtn.addEventListener('click', () => {
    postsContainer.classList.remove('list-view');
    postsContainer.classList.add('grid-view');
    gridViewBtn.classList.add('active');
    listViewBtn.classList.remove('active');
    toggleContainer.querySelector('::before').style.transform = 'translateX(100%)';
});

let postToDelete = null; // keep track of which post to delete

// Open modal when delete button is clicked
postsContainer.addEventListener('click', (e) => {
    if (e.target.closest('.action-delete-post')) {
        postToDelete = e.target.closest('.post-card'); // save the clicked post
        modalOverlay.classList.remove('hidden');
        deleteConfirmModal.classList.remove('hidden');
    }
});

// Cancel deletion
cancelDeleteBtn.addEventListener('click', () => {
    postToDelete = null;
    modalOverlay.classList.add('hidden');
    deleteConfirmModal.classList.add('hidden');
});

// Confirm deletion
confirmDeleteBtn.addEventListener('click', () => {
    if (postToDelete) {
        postToDelete.remove(); // remove post from DOM
        postToDelete = null;
    }
    modalOverlay.classList.add('hidden');
    deleteConfirmModal.classList.add('hidden');
});