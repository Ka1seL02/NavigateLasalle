document.addEventListener('DOMContentLoaded', () => {
    const historySection = document.querySelector('.section-history');
    const timelineButtons = document.querySelectorAll('.timeline-nav button');
    const timelineItems = document.querySelectorAll('.timeline-item');

    const AUTO_ADVANCE_DELAY = 10000; // 10 seconds
    let autoAdvanceTimer = null;

    const historyImages = [
        '/user/images/about/history-bg-1.jpg', // 1977
        '/user/images/about/history-bg-2.jpg', // 1978
        '/user/images/about/history-bg-3.jpg', // 1980
        '/user/images/about/history-bg-4.jpg', // 1987
        '/user/images/about/history-bg-5.jpg', // 1994
        '/user/images/about/history-bg-6.jpg', // 2000
        '/user/images/about/history-bg-7.jpg', // 2010
        '/user/images/about/history-bg-8.jpg'  // Today
    ];

    historyImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });

    function activateTimeline(index) {
        if (historySection.classList.contains('transitioning')) return;
        historySection.classList.add('transitioning');

        setTimeout(() => {
            timelineButtons.forEach(btn => btn.classList.remove('active'));
            timelineButtons[index].classList.add('active');

            timelineItems.forEach(item => item.classList.remove('active'));
            timelineItems[index].classList.add('active');

            historySection.style.backgroundImage = `
                linear-gradient(
                    to bottom,
                    rgba(255, 255, 255, 1) 0%,
                    rgba(255, 255, 255, 1) 35%,
                    rgba(255, 255, 255, 0) 100%
                ),
                url('${historyImages[index]}')
            `;

            // Remove transition class
            setTimeout(() => {
                historySection.classList.remove('transitioning');
            }, 100);
        }, 300);
    }

    timelineButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            activateTimeline(index);
            resetAutoAdvance();
        });
    });

    function startAutoAdvance() {
        autoAdvanceTimer = setInterval(() => {
            const currentIndex = Array.from(timelineButtons).findIndex(btn => 
                btn.classList.contains('active')
            );
            const nextIndex = (currentIndex + 1) % timelineButtons.length;
            activateTimeline(nextIndex);
        }, AUTO_ADVANCE_DELAY);
    }

    function resetAutoAdvance() {
        if (autoAdvanceTimer) clearInterval(autoAdvanceTimer);
        startAutoAdvance();
    }

    startAutoAdvance();
});