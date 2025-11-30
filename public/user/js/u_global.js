// Scroll to Top Button Functionality (if exists on page)
const scrollTopBtn = document.querySelector('.scroll-up-btn');
if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
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

// Load the feedback modal dynamically
fetch('/user/component/m_feedback.html')
    .then(res => res.text())
    .then(html => {
        document.body.insertAdjacentHTML('beforeend', html);

        const modal = document.getElementById('feedbackModal');
        const modalContent = modal.querySelector('.feedback-modal');
        const feedbackFloatBtn = document.querySelector('.feedback-float-btn');
        const closeBtn = document.getElementById('closeFeedbackModal');
        const cancelBtn = modal.querySelector('.modal-buttons button[type="button"]');
        const stars = modal.querySelectorAll('.star-rating span');
        let rating = 0;

        // Close Modal with animation
        function closeModal() {
            modalContent.classList.add('closing');
            modalContent.addEventListener('animationend', () => {
                modalContent.classList.remove('closing');
                modal.classList.remove('show');
            }, { once: true });
        }

        function openModal() {
            modal.classList.add('show');
        }

        // Show modal when floating feedback button clicked
        if (feedbackFloatBtn) {
            feedbackFloatBtn.addEventListener('click', () => {
                openModal();
            });
        }

        // Also handle feedback section button if it exists (for help page)
        const feedbackSectionBtn = document.querySelector('.feedback-section button');
        if (feedbackSectionBtn) {
            feedbackSectionBtn.addEventListener('click', () => {
                openModal();
            });
        }

        // Hide modal
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

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
        const form = modal.querySelector('#feedbackForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const feedback = form.feedback.value.trim();

            if (!feedback || !rating) {
                customNotification('error', 'Incomplete Form', 'Please provide a rating and feedback message.');
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
                    customNotification('success', 'Feedback Submitted!', 'Thank you for helping us improve the kiosk experience.');
                    form.reset();
                    stars.forEach(s => s.classList.remove('selected'));
                    rating = 0;
                    closeModal();
                } else {
                    customNotification('error', 'Error', data.error || 'Failed to submit feedback.');
                }
            } catch (error) {
                console.error('Error submitting feedback:', error);
                customNotification('error', 'Connection Error', 'Failed to submit feedback. Please check your connection.');
            }
        });
    })
    .catch(err => console.error('Error loading feedback modal:', err));