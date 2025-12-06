// ========================
// FEEDBACK MODAL
// ========================
let feedbackModal = null;
let selectedRating = 0;

// Fetch and inject feedback modal
fetch('/user/component/m_feedback.html')
    .then(res => res.text())
    .then(html => {
        document.body.insertAdjacentHTML('beforeend', html);
        feedbackModal = document.getElementById('feedbackModal');
        initializeFeedbackModal();
    })
    .catch(err => console.error('Error fetching feedback modal:', err));

function initializeFeedbackModal() {
    if (!feedbackModal) return;

    const closeBtn = document.getElementById('closeFeedbackModal');
    const cancelBtn = feedbackModal.querySelector('button[type="button"]');
    const feedbackForm = document.getElementById('feedbackForm');
    const stars = feedbackModal.querySelectorAll('.star-rating span');
    const feedbackTextarea = feedbackForm.querySelector('textarea[name="feedback"]');

    // Star rating functionality
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.value);
            updateStars();
        });

        star.addEventListener('mouseenter', () => {
            const value = parseInt(star.dataset.value);
            stars.forEach((s, idx) => {
                s.style.color = idx < value ? '#FFB800' : '#ddd';
            });
        });

        star.addEventListener('mouseleave', () => {
            updateStars();
        });
    });

    function updateStars() {
        stars.forEach((s, idx) => {
            s.style.color = idx < selectedRating ? '#FFB800' : '#ddd';
        });
    }

    // Submit feedback
    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const feedbackText = feedbackTextarea.value.trim();

        // Validation
        if (!feedbackText) {
            customNotification('error', 'Feedback Required', 'Please provide your feedback before submitting.');
            return;
        }

        if (selectedRating === 0) {
            customNotification('error', 'Rating Required', 'Please select a rating before submitting.');
            return;
        }

        // Disable submit button to prevent double submission
        const submitBtn = feedbackForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Submitting...';

        try {
            const response = await fetch('/api/feedbacks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    feedback: feedbackText,
                    rating: selectedRating
                })
            });

            const data = await response.json();

            if (response.ok) {
                customNotification('success', 'Feedback Submitted', 'Thank you for your feedback! We appreciate your input.');
                closeFeedbackModal();
                resetFeedbackForm();
            } else {
                customNotification('error', 'Submission Failed', data.error || 'Failed to submit feedback. Please try again.');
            }
        } catch (err) {
            console.error('Error submitting feedback:', err);
            customNotification('error', 'Network Error', 'Unable to submit feedback. Please check your connection and try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    // Close modal handlers
    closeBtn.addEventListener('click', closeFeedbackModal);
    cancelBtn.addEventListener('click', closeFeedbackModal);

    // Close on outside click
    feedbackModal.addEventListener('click', (e) => {
        if (e.target === feedbackModal) {
            closeFeedbackModal();
        }
    });

    function resetFeedbackForm() {
        selectedRating = 0;
        feedbackTextarea.value = '';
        updateStars();
    }
}

function openFeedbackModal() {
    if (!feedbackModal) {
        console.error('Feedback modal not ready');
        return;
    }
    feedbackModal.classList.add('show');
}

function closeFeedbackModal() {
    if (!feedbackModal) return;
    feedbackModal.classList.remove('show');
}

// Open feedback modal when floating button is clicked
document.addEventListener('DOMContentLoaded', () => {
    const feedbackFloatBtn = document.querySelector('.feedback-float-btn');
    if (feedbackFloatBtn) {
        feedbackFloatBtn.addEventListener('click', openFeedbackModal);
    }
});

// ========================
// SCROLL UP BUTTON
// ========================
document.addEventListener('DOMContentLoaded', () => {
    const scrollUpBtn = document.querySelector('.scroll-up-btn');

    if (scrollUpBtn) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollUpBtn.classList.add('show');
            } else {
                scrollUpBtn.classList.remove('show');
            }
        });

        // Scroll to top when clicked
        scrollUpBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});