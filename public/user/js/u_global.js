// Scroll to Top Button Functionality (if exists on page)
const scrollTopBtn = document.querySelector('.scroll-top-btn');
if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }
    });
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// CUSTOM NOTIFICATION (Global - available on all pages)
function showNotification(type, title, message) {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.custom-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    const iconClass = type === 'success' ? 'bx-check-circle' : 'bx-error-circle';
    notification.innerHTML = `
        <div class="notification-icon">
            <i class='bx ${iconClass}'></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">
            <i class='bx bx-x'></i>
        </button>
    `;
    document.body.appendChild(notification);
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 400);
    });
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 400);
    }, 5000);
}

// Load the feedback modal dynamically
fetch('./modals/m_feedback.html')
    .then(res => res.text())
    .then(html => {
        document.body.insertAdjacentHTML('beforeend', html);

        const modal = document.getElementById('feedback-modal');
        const modalContent = modal.querySelector('.modal-content');
        const feedbackFloatBtn = document.querySelector('.feedback-float-btn');
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const stars = modal.querySelectorAll('.star-rating span');
        let rating = 0;

        // Close Modal
        function closeModal() {
            modalContent.classList.add('closing');
            setTimeout(() => {
                modal.classList.add('hidden');
                modalContent.classList.remove('closing'); // Animation
            }, 500);
        }

        // Show modal when floating feedback button clicked
        if (feedbackFloatBtn) {
            feedbackFloatBtn.addEventListener('click', () => {
                modal.classList.remove('hidden');
            });
        }

        // Also handle feedback section button if it exists (for help page)
        const feedbackSectionBtn = document.querySelector('.feedback-section button');
        if (feedbackSectionBtn) {
            feedbackSectionBtn.addEventListener('click', () => {
                modal.classList.remove('hidden');
            });
        }

        // Hide modal with animation
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        // Star rating interaction
        stars.forEach(star => {
            star.addEventListener('mouseover', () => {
                const val = star.dataset.value;
                stars.forEach(s => s.classList.toggle('hover', s.dataset.value <= val));
            });
            star.addEventListener('mouseout', () => stars.forEach(s => s.classList.remove('hover')));
            star.addEventListener('click', () => {
                rating = star.dataset.value;
                stars.forEach(s => s.classList.toggle('selected', s.dataset.value <= rating));
            });
        });

        // Handle form submission
        const form = modal.querySelector('#feedback-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const feedback = form.feedback.value.trim();

            if (!feedback || !rating) {
                showNotification('error', 'Incomplete Form', 'Please provide a rating and feedback message.');
                return;
            }

            try {
                const response = await fetch('/api/feedbacks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        feedback: feedback,
                        rating: parseInt(rating)
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    showNotification('success', 'Feedback Submitted!', 'Thank you for helping us improve the kiosk experience.');
                    form.reset();
                    stars.forEach(s => s.classList.remove('selected'));
                    rating = 0;
                    closeModal();
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                console.error('Error submitting feedback:', error);
                showNotification('error', 'Connection Error', 'Failed to submit feedback. Please check your connection.');
            }
        });
    });