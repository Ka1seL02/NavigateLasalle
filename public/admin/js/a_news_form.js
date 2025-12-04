// ==================== STATE MANAGEMENT ==================== //
let uploadedImages = []; // Array of { imageUrl, publicId }
let originalImages = []; // Track original images when editing
let editMode = false;
let editingNewsId = null;
let scheduledDateTime = null;

// ==================== INITIALIZATION ==================== //
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    editingNewsId = urlParams.get('id');
    
    if (editingNewsId) {
        editMode = true;
        document.querySelector('.news-form-header h1').textContent = 'Edit News';
        await loadNewsData(editingNewsId);
    }

    initializeEventListeners();
});

// ==================== LOAD NEWS DATA FOR EDITING ==================== //
async function loadNewsData(newsId) {
    try {
        const response = await fetch(`/api/news/${newsId}`);
        const news = await response.json();

        if (!response.ok) {
            throw new Error('Failed to load news data');
        }

        document.getElementById('news-title').value = news.title;
        document.getElementById('news-tag').value = news.tag;
        document.getElementById('news-content').value = news.content;

        // Store original images for comparison later
        uploadedImages = news.image || [];
        originalImages = JSON.parse(JSON.stringify(news.image || [])); // Deep copy
        renderImagePreviews();

        if (news.dateScheduled) {
            const schedDate = new Date(news.dateScheduled);
            scheduledDateTime = schedDate;
            
            const dateStr = schedDate.toISOString().split('T')[0];
            const hours = String(schedDate.getHours()).padStart(2, '0');
            const minutes = String(schedDate.getMinutes()).padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;
            
            document.getElementById('scheduleDate').value = dateStr;
            document.getElementById('scheduleTime').value = timeStr;
        }

    } catch (error) {
        console.error('Load news error:', error);
        customNotification('error', 'Error', 'Failed to load news data');
        setTimeout(() => {
            window.location.href = 'a_news.html';
        }, 2000);
    }
}

// ==================== EVENT LISTENERS ==================== //
function initializeEventListeners() {
    document.querySelector('.back-btn').addEventListener('click', () => {
        showConfirmModal({
            icon: 'bx-arrow-back',
            iconColor: 'var(--cream)',
            title: 'Leave Page?',
            message: 'Are you sure you want to go back? Unsaved changes will be lost.',
            confirmText: 'Yes, Go Back',
            confirmColor: 'var(--red)',
            onConfirm: () => {
                window.location.href = 'a_news.html';
            }
        });
    });

    document.querySelector('.cancel-btn').addEventListener('click', () => {
        showConfirmModal({
            icon: 'bx-x-circle',
            iconColor: 'var(--cream)',
            title: 'Cancel Changes?',
            message: 'Are you sure you want to cancel? Unsaved changes will be lost.',
            confirmText: 'Yes, Cancel',
            confirmColor: 'var(--red)',
            onConfirm: () => {
                window.location.href = 'a_news.html';
            }
        });
    });

    const uploadTile = document.getElementById('uploadTile');
    const fileInput = document.getElementById('imageUpload');

    uploadTile.addEventListener('click', () => {
        if (uploadedImages.length >= 5) {
            customNotification('error', 'Limit Reached', 'You can only upload up to 5 images.');
            return;
        }
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length === 0) return;
        
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
        const invalidFiles = files.filter(file => !validTypes.includes(file.type));
        
        if (invalidFiles.length > 0) {
            customNotification('error', 'Invalid File Type', 'Only image files (JPEG, PNG, GIF, WebP, BMP, TIFF) are allowed.');
            e.target.value = '';
            return;
        }
        
        handleImageUpload(e);
    });

    const scheduleBtn = document.querySelector('.schedule-button');
    const schedulePopup = document.getElementById('schedulePopup');
    const cancelSchedule = document.getElementById('cancelSchedule');
    const saveSchedule = document.getElementById('saveSchedule');

    scheduleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        schedulePopup.style.display = schedulePopup.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
        if (!schedulePopup.contains(e.target) && !scheduleBtn.contains(e.target)) {
            schedulePopup.style.display = 'none';
        }
    });

    cancelSchedule.addEventListener('click', () => {
        schedulePopup.style.display = 'none';
    });

    saveSchedule.addEventListener('click', () => {
        const date = document.getElementById('scheduleDate').value;
        const time = document.getElementById('scheduleTime').value;

        if (!date || !time) {
            customNotification('error', 'Invalid Schedule', 'Please enter both date and time.');
            return;
        }

        const dateTime = parseDateTime(date, time);
        if (!dateTime) {
            customNotification('error', 'Invalid Format', 'Please use valid date and time format.');
            return;
        }

        if (dateTime < new Date()) {
            customNotification('error', 'Invalid Date', 'Scheduled date must be in the future.');
            return;
        }

        scheduledDateTime = dateTime;
        customNotification('success', 'Schedule Set', `News will be published on ${dateTime.toLocaleString()}`);
        schedulePopup.style.display = 'none';
        
        submitNews('scheduled');
    });

    document.querySelector('.draft-button').addEventListener('click', () => submitNews('draft'));
    document.querySelector('.post-button').addEventListener('click', () => submitNews('published'));
}

// ==================== PARSE DATE TIME ==================== //
function parseDateTime(dateStr, timeStr) {
    try {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const dateTime = new Date(dateStr);
        dateTime.setHours(hours, minutes, 0, 0);
        return dateTime;
    } catch (error) {
        console.error('Parse error:', error);
        return null;
    }
}

// ==================== HANDLE IMAGE UPLOAD ==================== //
async function handleImageUpload(event) {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;

    const remainingSlots = 5 - uploadedImages.length;
    if (files.length > remainingSlots) {
        customNotification('error', 'Too Many Images', `You can only upload ${remainingSlots} more image(s).`);
        return;
    }

    customNotification('info', 'Uploading', 'Please wait while images are being uploaded...');

    for (const file of files) {
        await uploadImageToCloudinary(file);
    }

    event.target.value = '';
    customNotification('success', 'Upload Complete', 'All images uploaded successfully!');
}

// ==================== UPLOAD TO CLOUDINARY ==================== //
async function uploadImageToCloudinary(file) {
    try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload/news-image', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Upload failed');
        }

        uploadedImages.push({
            imageUrl: data.imageUrl,
            publicId: data.publicId
        });

        renderImagePreviews();

    } catch (error) {
        console.error('Upload error:', error);
        customNotification('error', 'Upload Failed', error.message);
    }
}

// ==================== RENDER IMAGE PREVIEWS ==================== //
function renderImagePreviews() {
    const imageGrid = document.getElementById('imageGrid');
    
    const previews = imageGrid.querySelectorAll('.img-preview');
    previews.forEach(p => p.remove());

    uploadedImages.forEach((img, index) => {
        const preview = document.createElement('div');
        preview.className = 'img-preview';
        preview.innerHTML = `
            <img src="${img.imageUrl}" alt="Preview ${index + 1}">
            <i class='bx bx-x delete-btn' data-index="${index}"></i>
        `;

        preview.querySelector('img').addEventListener('click', () => {
            showImageModal(img.imageUrl);
        });

        preview.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteImage(index);
        });

        imageGrid.insertBefore(preview, document.getElementById('uploadTile'));
    });

    const uploadTile = document.getElementById('uploadTile');
    uploadTile.style.display = uploadedImages.length >= 5 ? 'none' : 'flex';
}

// ==================== SHOW IMAGE MODAL ==================== //
function showImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'image-modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        cursor: pointer;
    `;

    modal.innerHTML = `
        <img src="${imageUrl}" style="max-width: 90%; max-height: 90%; object-fit: contain;">
    `;

    modal.addEventListener('click', () => {
        modal.remove();
    });

    document.body.appendChild(modal);
}

// ==================== DELETE IMAGE ==================== //
async function deleteImage(index) {
    const image = uploadedImages[index];

    showConfirmModal({
        icon: 'bx-trash',
        iconColor: 'var(--cream)',
        title: 'Delete Image?',
        message: 'Are you sure you want to remove this image?',
        confirmText: 'Yes, Delete',
        confirmColor: 'var(--red)',
        onConfirm: async (btn) => {
            btn.disabled = true;
            btn.textContent = 'Deleting...';

            try {
                // Delete from Cloudinary immediately
                const publicIdEncoded = image.publicId.replace(/\//g, '_');
                await fetch(`/api/upload/news-image/${publicIdEncoded}`, {
                    method: 'DELETE'
                });

                uploadedImages.splice(index, 1);
                renderImagePreviews();
                customNotification('success', 'Image Deleted', 'Image removed successfully.');

            } catch (error) {
                console.error('Delete error:', error);
                customNotification('error', 'Delete Failed', 'Failed to delete image.');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Yes, Delete';
            }
        }
    });
}

// ==================== DELETE REMOVED IMAGES FROM CLOUDINARY ==================== //
async function deleteRemovedImagesFromCloudinary() {
    if (!editMode || originalImages.length === 0) return;

    // Find images that were in original but not in current uploadedImages
    const currentPublicIds = uploadedImages.map(img => img.publicId);
    const removedImages = originalImages.filter(
        img => !currentPublicIds.includes(img.publicId)
    );

    // Delete each removed image from Cloudinary
    for (const image of removedImages) {
        try {
            const publicIdEncoded = image.publicId.replace(/\//g, '_');
            await fetch(`/api/upload/news-image/${publicIdEncoded}`, {
                method: 'DELETE'
            });
            console.log(`Deleted orphaned image: ${image.publicId}`);
        } catch (error) {
            console.error(`Failed to delete image ${image.publicId}:`, error);
            // Continue with other deletions even if one fails
        }
    }
}

// ==================== SUBMIT NEWS ==================== //
async function submitNews(status) {
    const title = document.getElementById('news-title').value.trim();
    const tag = document.getElementById('news-tag').value;
    const content = document.getElementById('news-content').value.trim();

    if (!title || !tag || !content) {
        customNotification('error', 'Incomplete Form', 'Please fill in all required fields.');
        return;
    }

    if (uploadedImages.length === 0) {
        customNotification('error', 'No Images', 'Please upload at least one image.');
        return;
    }

    if (status === 'scheduled' && !scheduledDateTime) {
        customNotification('error', 'No Schedule', 'Please set a schedule date and time first.');
        return;
    }

    const user = await getCurrentUser();
    const author = user?.name || 'Admin';

    const newsData = {
        title,
        tag,
        content,
        image: uploadedImages,
        author,
        status,
        dateScheduled: status === 'scheduled' ? scheduledDateTime : null
    };

    try {
        // IMPORTANT: Delete removed images from Cloudinary before saving
        if (editMode) {
            await deleteRemovedImagesFromCloudinary();
        }

        let response;
        
        if (editMode) {
            response = await fetch(`/api/news/${editingNewsId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newsData)
            });
        } else {
            response = await fetch('/api/news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newsData)
            });
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to save news');
        }

        const actionText = editMode ? 'updated' : 'created';
        const statusText = status === 'published' ? 'published' : status === 'scheduled' ? 'scheduled' : 'saved as draft';

        customNotification('success', 'Success', `News ${actionText} and ${statusText} successfully!`);

        setTimeout(() => {
            window.location.href = 'a_news.html';
        }, 1500);

    } catch (error) {
        console.error('Submit error:', error);
        customNotification('error', 'Error', error.message);
    }
}

// ==================== GET CURRENT USER ==================== //
async function getCurrentUser() {
    try {
        const response = await fetch('/api/accounts/check-session');
        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error('Get user error:', error);
        return null;
    }
}