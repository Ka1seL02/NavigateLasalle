// ─── Inject FAB + Modal ───────────────────────────────────────────────────────
async function initFeedbackFab() {
    const res = await fetch('/user/feedback.html');
    const html = await res.text();
    document.body.insertAdjacentHTML('beforeend', html);

    // ─── State ────────────────────────────────────────────────────────────────
    let selectedRating = 0;

    // ─── Elements ─────────────────────────────────────────────────────────────
    const fab = document.getElementById('feedbackFab');
    const overlay = document.getElementById('feedbackModalOverlay');
    const closeBtn = document.getElementById('feedbackModalClose');
    const stars = document.querySelectorAll('.feedback-star');
    const commentInput = document.getElementById('feedbackComment');
    const submitBtn = document.getElementById('feedbackSubmitBtn');

    // ─── Open / Close ─────────────────────────────────────────────────────────
    fab.addEventListener('click', () => overlay.classList.add('active'));

    function closeModal() {
        overlay.classList.remove('active');
    }

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    // ─── Star Rating ──────────────────────────────────────────────────────────
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.value);
            updateStars();
        });

        star.addEventListener('mouseenter', () => {
            const val = parseInt(star.dataset.value);
            stars.forEach((s, i) => {
                s.style.color = i < val ? '#f59e0b' : '';
            });
        });

        star.addEventListener('mouseleave', () => {
            updateStars();
        });
    });

    function updateStars() {
        stars.forEach((s, i) => {
            s.classList.toggle('selected', i < selectedRating);
            s.style.color = '';
        });
    }

    // ─── Submit ───────────────────────────────────────────────────────────────
    submitBtn.addEventListener('click', async () => {
        if (selectedRating === 0) {
            submitBtn.textContent = 'Please select a rating!';
            submitBtn.style.background = 'var(--red)';
            setTimeout(() => {
                submitBtn.textContent = 'Submit Feedback';
                submitBtn.style.background = '';
            }, 2000);
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            const res = await fetch('/api/feedbacks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating: selectedRating,
                    comment: commentInput.value.trim() || null
                })
            });

            if (!res.ok) throw new Error();

            // Show success state
            document.getElementById('feedbackModalContent').innerHTML = `
                <div class="feedback-success">
                    <i class='bx bx-check-circle'></i>
                    <p class="feedback-success-title">Thank you!</p>
                    <p class="feedback-success-sub">Your feedback has been submitted successfully.</p>
                </div>
            `;

            // Auto close after 2.5 seconds then reset
            setTimeout(() => {
                closeModal();
                setTimeout(() => {
                    selectedRating = 0;
                    location.reload(); // reload to reset modal content
                }, 300);
            }, 2500);

        } catch (err) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Failed. Try again.';
            submitBtn.style.background = 'var(--red)';
            setTimeout(() => {
                submitBtn.textContent = 'Submit Feedback';
                submitBtn.style.background = '';
            }, 2000);
        }
    });
}

initFeedbackFab();