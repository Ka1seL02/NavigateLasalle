// === FETCH NEWS MODAL AT START ===
let newsModal = null;
let modalImageEl = null;
let modalImageInterval = null;
let modalCurrentImageIndex = 0;

fetch('/user/component/m_view_news.html')
    .then(res => res.text())
    .then(html => {
        document.body.insertAdjacentHTML('beforeend', html);

        newsModal = document.getElementById('showNewsModal');
        modalImageEl = newsModal.querySelector('#newModalImage');

        const closeBtn = newsModal.querySelector('.news-modal-close');

        // Close modal on button click
        closeBtn.addEventListener('click', () => closeModal());

        // Close modal on overlay click
        newsModal.addEventListener('click', (e) => {
            if (e.target === newsModal) closeModal();
        });
    })
    .catch(err => console.error('Error fetching news modal:', err));

function openNewsModal(newsItem) {
    if (!newsModal || !modalImageEl) {
        console.error('Modal not ready');
        return;
    }

    // Updated selectors for option 2
    const modalTitle = newsModal.querySelector('.news-modal-title');
    const modalDate = newsModal.querySelector('.news-date');
    const modalTag = newsModal.querySelector('.news-tag');
    const modalDescription = newsModal.querySelector('.news-modal-details p');

    if (!modalTitle || !modalDate || !modalTag || !modalDescription) {
        console.error('One or more modal elements are missing');
        return;
    }

    modalTitle.textContent = newsItem.title;
    modalDate.textContent = newsItem.date;
    modalTag.textContent = newsItem.tag;
    modalDescription.textContent = newsItem.description;

    // Clear previous interval
    if (modalImageInterval) clearInterval(modalImageInterval);
    modalCurrentImageIndex = 0;

    if (newsItem.images && newsItem.images.length > 0) {
        modalImageEl.src = newsItem.images[0].imageUrl;

        if (newsItem.images.length > 1) {
            modalImageInterval = setInterval(() => {
                modalCurrentImageIndex = (modalCurrentImageIndex + 1) % newsItem.images.length;
                modalImageEl.src = newsItem.images[modalCurrentImageIndex].imageUrl;
            }, 5000);
        }
    } else {
        modalImageEl.src = '/shared/images/news/news_placeholder.jpg';
    }

    newsModal.classList.add('show');
}

function closeModal() {
    if (!newsModal) return;

    const modalContent = newsModal.querySelector('.news-modal');
    modalContent.classList.add('closing');
    modalContent.addEventListener('animationend', () => {
        modalContent.classList.remove('closing');
        newsModal.classList.remove('show');
    }, { once: true });

    if (modalImageInterval) {
        clearInterval(modalImageInterval);
        modalImageInterval = null;
    }
}

// ========================
// CLOCK & DATE
// ========================
function updateDateTime() {
    const currentDate = new Date();

    let hours = currentDate.getHours();
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const meridiem = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    const month = currentDate.toLocaleDateString('en-US', { month: 'short'}) + '.';
    const day = currentDate.getDate().toString().padStart(2, '0');
    const year = currentDate.getFullYear();
    const weekday = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

    document.getElementById('clockText').textContent = `${hours}:${minutes} ${meridiem}`;
    document.getElementById('dateText').textContent = `${month} ${day}, ${year} | ${weekday}`;
}

setInterval(updateDateTime, 1000);
updateDateTime();

// ========================
// WEATHER
// ========================
async function fetchWeather() {
    const apiUrl = '/api/weather';

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (response.ok) {
            updateWeatherUI(data);
        } else {
            displayWeatherError();
        }
    } catch {
        displayWeatherError();
    }
}

function updateWeatherUI(data) {
    const weatherContainer = document.querySelector('.middle-box');

    const temp = Math.round(data.main.temp * 10) / 10;
    const weatherMain = data.weather[0].main.toLowerCase();
    const weatherIcon = data.weather[0].icon;
    const location = 'Dasmarinas, Cavite';

    const weatherMessages = {
        clear: 'Sunny days are perfect for outdoor activities.<br>Stay hydrated and have fun!',
        clouds: 'Partly cloudy skies today.<br>A great day to explore the campus!',
        rain: "Rainy weather ahead.<br>Don't forget to bring an umbrella!",
        drizzle: 'Light drizzle expected.<br>Stay dry and enjoy your day indoors!',
        thunderstorm: 'Thunderstorms in the area.<br>Please stay safe indoors.',
        snow: 'Snow is falling! Bundle up and stay warm.',
        mist: 'Misty conditions outside.<br>Drive carefully and stay safe.',
        fog: 'Foggy weather today.<br>Take care when moving around campus.',
        haze: 'Hazy skies today.<br>Stay indoors if you have respiratory concerns.',
        smoke: 'Smoky conditions detected.<br>Limit outdoor activities if possible.',
        dust: 'Dusty weather outside.<br>Keep windows closed and stay indoors.',
        sand: 'Sandy conditions today.<br>Protect your eyes and stay safe.',
        ash: 'Volcanic ash in the air.<br>Please stay indoors for safety.',
        squall: 'Strong winds expected.<br>Secure loose items and stay safe.',
        tornado: 'Tornado warning!<br>Seek shelter immediately.'
    };

    const weatherMessage = weatherMessages[weatherMain] || 'Have a wonderful day at DLSU-D!';

    weatherContainer.innerHTML = `
        <div class="weather-content">
            <div class="weather-icon">
                <img src="https://openweathermap.org/img/wn/${weatherIcon}@4x.png" alt="${weatherMain}">
            </div>
            <div class="weather-info">
                <div class="weather-temp">${temp}°C</div>
                <div class="weather-location">${location}</div>
            </div>
        </div>
        <div class="weather-description">${weatherMessage}</div>
    `;
}

function displayWeatherError() {
    const weatherContainer = document.querySelector('.middle-box');
    weatherContainer.innerHTML = `
        <div class="weather-content">
            <div class="weather-icon">
                <i class='bx bx-cloud-drizzle' style="font-size: 80px; color: var(--grey);"></i>
            </div>
            <div class="weather-info">
                <div class="weather-temp">--°C</div>
                <div class="weather-location">Dasmarinas, Cavite</div>
            </div>
        </div>
        <div class="weather-description">Weather Unavailable</div>
    `;
}

fetchWeather();
setInterval(fetchWeather, 600000);

// ========================
// FEATURED NEWS CAROUSEL
// ========================
let newsData = [];
let currentSlide = 0;
let autoAdvanceTimer = null;

async function fetchFeaturedNews() {
    try {
        const response = await fetch('/api/news/featured');
        const data = await response.json();

        newsData = data.map(item => ({
            images: item.image.length > 0 ? item.image : [],
            date: new Date(item.datePosted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            tag: item.tag.toUpperCase(),
            title: item.title,
            description: item.content
        }));

        const dotsContainer = document.querySelector('.carousel-dots');
        dotsContainer.innerHTML = '';
        newsData.forEach((_, idx) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (idx === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                stopAutoAdvance();
                currentSlide = idx;
                updateCarousel();
                updateDots();
                setTimeout(startAutoAdvance, 10000);
            });
            dotsContainer.appendChild(dot);
        });

        initCarousel();
    } catch (err) {
        console.error('Error fetching featured news:', err);
    }
}

function initCarousel() {
    if (newsData.length === 0) return;
    updateCarousel();
    updateDots();
    startAutoAdvance();
}

function updateCarousel() {
    const newsContainer = document.querySelector('.news-content');
    newsContainer.style.opacity = 0;

    setTimeout(() => {
        const news = newsData[currentSlide];

        document.querySelector('.news-image img').src = news.images.length > 0 ? news.images[0].imageUrl : '/shared/images/news/news_placeholder.jpg';
        document.querySelector('.news-date').textContent = news.date;
        document.querySelector('.news-tag').textContent = news.tag;
        document.querySelector('.news-title').textContent = news.title;
        document.querySelector('.news-description').textContent = news.description;

        newsContainer.style.opacity = 1;
    }, 250);
}

function updateDots() {
    const dots = document.querySelectorAll('.carousel-dots .dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

function nextSlide(manual = false) {
    if (manual) { stopAutoAdvance(); setTimeout(startAutoAdvance, 10000); }
    currentSlide = (currentSlide + 1) % newsData.length;
    updateCarousel();
    updateDots();
}

function prevSlide(manual = false) {
    if (manual) { stopAutoAdvance(); setTimeout(startAutoAdvance, 10000); }
    currentSlide = (currentSlide - 1 + newsData.length) % newsData.length;
    updateCarousel();
    updateDots();
}

function startAutoAdvance() {
    if (autoAdvanceTimer) clearInterval(autoAdvanceTimer);
    autoAdvanceTimer = setInterval(() => nextSlide(), 5000);
}

function stopAutoAdvance() {
    if (autoAdvanceTimer) {
        clearInterval(autoAdvanceTimer);
        autoAdvanceTimer = null;
    }
}

// ========================
// EVENT LISTENERS
// ========================
document.addEventListener('DOMContentLoaded', () => {
    fetchFeaturedNews();

    document.querySelector('.carousel-nav.prev').addEventListener('click', () => prevSlide(true));
    document.querySelector('.carousel-nav.next').addEventListener('click', () => nextSlide(true));

    document.getElementById('viewAllNews').addEventListener('click', () => {
        window.location.href = '/user/u_news.html';
    });

    // Open modal when clicking carousel
    const newsContent = document.querySelector('.news-content');
    if (newsContent) {
        newsContent.addEventListener('click', () => {
            if (newsData.length > 0) {
                openNewsModal(newsData[currentSlide]);
            }
        });
    }
});
