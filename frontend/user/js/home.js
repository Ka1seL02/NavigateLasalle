import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── Live Clock ───────────────────────────────────────────────────────────────
function updateClock() {
    const now = new Date();

    const time = now.toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    const date = now.toLocaleDateString('en-PH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById('clockTime').textContent = time;
    document.getElementById('clockDate').textContent = date;
}

updateClock();
setInterval(updateClock, 1000);

// ─── Weather ──────────────────────────────────────────────────────────────────
async function loadWeather() {
    try {
        const res = await fetch('/api/weather');
        const data = await res.json();

        document.getElementById('weatherTemp').textContent = `${data.temp}°C`;
        document.getElementById('weatherDesc').textContent = data.description;
        document.getElementById('weatherHumidity').innerHTML = `<i class='bx bx-droplet'></i> ${data.humidity}% humidity`;
        document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
        document.getElementById('weatherCity').textContent = data.city;
    } catch (err) {
        document.getElementById('weatherTemp').textContent = '--°C';
        document.getElementById('weatherDesc').textContent = 'Weather unavailable';
    }
}

// ─── News Carousel ────────────────────────────────────────────────────────────
let posts = [];
let currentSlide = 0;
let autoSlideInterval = null;

async function loadPosts() {
    try {
        const res = await fetch('/api/posts');
        const data = await res.json();
        posts = data.posts.slice(0, 5); // show latest 5
        renderCarousel();
    } catch (err) {
        document.getElementById('newsCarousel').innerHTML = `
            <div class="news-loading">
                <p style="color:rgba(255,255,255,0.5); font-size:0.9rem;">Failed to load news.</p>
            </div>
        `;
    }
}

function renderCarousel() {
    const carousel = document.getElementById('newsCarousel');
    const dotsContainer = document.getElementById('carouselDots');

    if (posts.length === 0) {
        carousel.innerHTML = `
            <div class="news-loading">
                <p style="color:rgba(255,255,255,0.5); font-size:0.9rem;">No posts yet.</p>
            </div>
        `;
        return;
    }

    carousel.innerHTML = posts.map((post, i) => {
        const date = new Date(post.createdAt).toLocaleDateString('en-PH', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        // Strip HTML tags from content for snippet
        const snippet = post.content.replace(/<[^>]*>/g, '').slice(0, 1000);

        return `
            <div class="news-slide ${i === 0 ? 'active' : ''}">
                <img class="news-slide-image" src="${post.images[0]}" alt="${post.title}" />
                <div class="news-slide-body">
                    <div class="news-slide-meta">
                        <span class="news-slide-date">
                            <i class='bx bx-calendar'></i> ${date}
                        </span>
                        <span class="news-type-badge ${post.type}">${capitalize(post.type)}</span>
                    </div>
                    <h2 class="news-slide-title">${post.title}</h2>
                    <p class="news-slide-snippet">${snippet}</p>
                    <a href="news-detail.html?id=${post._id}" class="news-read-more">
                        Read more <i class='bx bx-right-arrow-alt'></i>
                    </a>
                </div>
            </div>
        `;
    }).join('');

    // Dots
    dotsContainer.innerHTML = posts.map((_, i) => `
        <button class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></button>
    `).join('');

    dotsContainer.querySelectorAll('.carousel-dot').forEach(dot => {
        dot.addEventListener('click', () => goToSlide(parseInt(dot.dataset.index)));
    });

    startAutoSlide();
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.news-slide');
    const dots = document.querySelectorAll('.carousel-dot');

    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');

    currentSlide = (index + posts.length) % posts.length;

    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function startAutoSlide() {
    clearInterval(autoSlideInterval);
    autoSlideInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
}

document.getElementById('carouselPrev').addEventListener('click', () => {
    goToSlide(currentSlide - 1);
    startAutoSlide();
});

document.getElementById('carouselNext').addEventListener('click', () => {
    goToSlide(currentSlide + 1);
    startAutoSlide();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
(async () => {
    await showLoading();
    await Promise.all([loadWeather(), loadPosts()]);
    hideLoading();

    // Refresh weather every 10 minutes after initial load
    setInterval(loadWeather, 10 * 60 * 1000);
})();