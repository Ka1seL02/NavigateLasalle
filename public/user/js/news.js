document.addEventListener('DOMContentLoaded', async () => {
    const newsContainer = document.getElementById('news-container');
    const indicatorsContainer = document.getElementById('carousel-indicators');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    let currentIndex = 0;
    let newsItems = [];
    let autoSlideInterval;
    const autoSlideDelay = 5000; // 5 seconds

    // Fetch news from API
    async function fetchNews() {
        try {
            const response = await fetch('/api/news');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            newsItems = await response.json();
            renderNews();
            initializeCarousel();
        } catch (error) {
            console.error('Error fetching news:', error);
            newsContainer.innerHTML = `
                <div class="error-message">
                    <i class='bx bx-error'></i>
                    <p>Could not load news. Please try again later.</p>
                </div>
            `;
        }
    }

    // Render news items in carousel
    function renderNews() {
        if (newsItems.length === 0) {
            newsContainer.innerHTML = `
                <div class="no-news-message">
                    <i class='bx bx-news'></i>
                    <p>No news articles available at the moment.</p>
                </div>
            `;
            return;
        }

        // Clear container
        newsContainer.innerHTML = '';
        indicatorsContainer.innerHTML = '';

        // Create news cards
        newsItems.forEach((item, index) => {
            // Format date
            const newsDate = new Date(item.date);
            const formattedDate = newsDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            }).toUpperCase();

            // Create news card
            const newsCard = document.createElement('div');
            newsCard.className = 'news-card';
            newsCard.style.display = index === 0 ? 'flex' : 'none';
            newsCard.innerHTML = `
                <img src="${item.imageUrl}">
                <div class="tags">
                    <span class="date">
                        <i class='bx bxs-calendar'></i> ${formattedDate}
                    </span>
                    <span class="tag">
                        <i class='bx bxs-tag'></i> ${item.tag}
                    </span>
                </div>
                <h2>${item.title}</h2>
                <p>${item.lead}</p>
                <a href="#" class="read-more" data-index="${index}">Read more</a>
            `;

            newsContainer.appendChild(newsCard);

            // Create indicator
            const indicator = document.createElement('span');
            indicator.className = index === 0 ? 'indicator active' : 'indicator';
            indicator.dataset.index = index;
            indicator.textContent = '•';
            indicatorsContainer.appendChild(indicator);
        });

        initializeReadMoreButtons(); // Initialize "Read More" buttons
    }

    // Initialize "Read More" buttons
    function initializeReadMoreButtons() {
        const readMoreButtons = document.querySelectorAll('.read-more');

        readMoreButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();

                const index = button.getAttribute('data-index');
                const newsItem = newsItems[index];

                // Update modal content
                document.getElementById('modal-day').textContent = new Date(newsItem.date).getDate();
                document.getElementById('modal-month').textContent = new Date(newsItem.date).toLocaleString('en-US', { month: 'short' }).toUpperCase();
                document.getElementById('modal-title').textContent = newsItem.title;
                document.getElementById('modal-tag').innerHTML = `<i class='bx bxs-tag'></i> ${newsItem.tag}`;
                document.getElementById('modal-image').src = newsItem.imageUrl;
                document.getElementById('modal-lead').textContent = newsItem.lead;
                document.getElementById('modal-description').textContent = newsItem.description;

                // Show the modal
                document.getElementById('news-modal').style.display = 'flex';
            });
        });
    }

    // Initialize carousel functionality
    function initializeCarousel() {
        const cards = document.querySelectorAll('.news-card');
        const indicators = document.querySelectorAll('.indicator');

        if (cards.length === 0) return;

        // Function to show a specific card
        function showCard(index) {
            // Hide all cards
            cards.forEach(card => {
                card.style.display = 'none';
            });

            // Show the selected card
            cards[index].style.display = 'flex';

            // Update indicators
            indicators.forEach((indicator, i) => {
                if (i === index) {
                    indicator.classList.add('active');
                } else {
                    indicator.classList.remove('active');
                }
            });

            // Update current index
            currentIndex = index;
        }

        // Function to start auto slide
        function startAutoSlide() {
            // Clear any existing interval first
            clearInterval(autoSlideInterval);

            // Set new interval
            autoSlideInterval = setInterval(function () {
                let nextIndex = (currentIndex + 1) % cards.length;
                showCard(nextIndex);
            }, autoSlideDelay);
        }

        // Function to handle manual navigation
        function manualNavigate(index) {
            showCard(index);

            // Reset the auto slide timer
            startAutoSlide();
        }

        // Event listeners for navigation buttons
        prevBtn.addEventListener('click', function () {
            let prevIndex = (currentIndex - 1 + cards.length) % cards.length;
            manualNavigate(prevIndex);
        });

        nextBtn.addEventListener('click', function () {
            let nextIndex = (currentIndex + 1) % cards.length;
            manualNavigate(nextIndex);
        });

        // Event listeners for indicators
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', function () {
                manualNavigate(index);
            });
        });

        // Start auto slide
        startAutoSlide();

        // Pause auto slide when hovering over the carousel
        newsContainer.addEventListener('mouseenter', function () {
            clearInterval(autoSlideInterval);
        });

        // Resume auto slide when mouse leaves the carousel
        newsContainer.addEventListener('mouseleave', function () {
            startAutoSlide();
        });
    }

    // Initialize
    fetchNews();
});