// Timeline Navigation Functionality
document.addEventListener('DOMContentLoaded', function () {
    const timelineButtons = document.querySelectorAll('.timeline-nav button');
    const timelineItems = document.querySelectorAll('.timeline-item');
    const historySection = document.querySelector('.history');

    let autoAdvanceTimer = null;
    const AUTO_ADVANCE_DELAY = 10000; // 10 seconds

    // Map each timeline year to its corresponding background image
    const timelineImages = {
        0: 'images/u_about_history1.jpg',
        1: 'images/u_about_history2.jpg',
        2: 'images/u_about_history3.jpg',
        3: 'images/u_about_history4.jpg',
        4: 'images/u_about_history5.jpg',
        5: 'images/u_about_history6.jpg',
        6: 'images/u_about_history7.jpg',
        7: 'images/u_about_history8.jpg'
    };

    // Preload all images for smooth transitions
    Object.values(timelineImages).forEach(imgUrl => {
        const img = new Image();
        img.src = imgUrl;
    });

    function activateTimeline(index) {
        // Remove active class from all buttons and items
        timelineButtons.forEach(btn => btn.classList.remove('active'));
        timelineItems.forEach(item => item.classList.remove('active'));

        // Add fade-out class to history section
        historySection.classList.add('transitioning');

        // Small delay before changing background and content
        setTimeout(() => {
            // Add active class to selected button and item
            timelineButtons[index].classList.add('active');
            timelineItems[index].classList.add('active');

            // Change background image
            const imageUrl = timelineImages[index];
            historySection.style.backgroundImage = `
                linear-gradient(
                    to bottom, 
                    rgba(255, 255, 255, 1) 0%, 
                    rgba(255, 255, 255, 1) 35%, 
                    rgba(255, 255, 255, 0) 100%
                ), 
                url('${imageUrl}')
            `;

            // Remove transitioning class after a short delay
            setTimeout(() => {
                historySection.classList.remove('transitioning');
            }, 50);
        }, 200);
    }

    function startAutoAdvance() {
        // Clear any existing timer
        if (autoAdvanceTimer) {
            clearInterval(autoAdvanceTimer);
        }

        // Set up new auto-advance timer
        autoAdvanceTimer = setInterval(() => {
            // Find current active index
            const currentIndex = Array.from(timelineButtons).findIndex(btn => 
                btn.classList.contains('active')
            );

            // Calculate next index (loop back to 0 after last item)
            const nextIndex = (currentIndex + 1) % timelineButtons.length;

            // Activate next timeline
            activateTimeline(nextIndex);
        }, AUTO_ADVANCE_DELAY);
    }

    // Add click event listeners to all timeline buttons
    timelineButtons.forEach((button, index) => {
        button.addEventListener('click', function () {
            // Prevent multiple rapid clicks
            if (historySection.classList.contains('transitioning')) return;
            
            activateTimeline(index);
        });
    });

    // Set initial state (currently active item)
    const initialActive = document.querySelector('.timeline-nav button.active');
    if (initialActive) {
        const initialIndex = Array.from(timelineButtons).indexOf(initialActive);
        if (initialIndex >= 0) {
            // Set initial background without transition
            const imageUrl = timelineImages[initialIndex];
            historySection.style.backgroundImage = `
                linear-gradient(
                    to bottom, 
                    rgba(255, 255, 255, 1) 0%, 
                    rgba(255, 255, 255, 1) 35%, 
                    rgba(255, 255, 255, 0) 100%
                ), 
                url('${imageUrl}')
            `;
        }
    }

    // Start auto-advance on page load
    startAutoAdvance();
});