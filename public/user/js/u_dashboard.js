// === CLOCK AND DATE ===
function updateDateTime() {
    const currentDate = new Date();

    // Clock (HH:MM AM/PM)
    let hours = currentDate.getHours();
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const meridiem = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    // Date
    const month = currentDate.toLocaleDateString('en-US', { month: 'short'}) + '.';
    const day =  currentDate.getDate().toString().padStart(2, '0');
    const year = currentDate.getFullYear();
    const weekday = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Update
    document.getElementById('clockText').textContent = `${hours}:${minutes} ${meridiem}`;
    document.getElementById('dateText').textContent = `${month} ${day}, ${year} | ${weekday}`;
}

setInterval(updateDateTime, 1000);
updateDateTime();

// === WEATHER API ===
async function fetchWeather() {
    const apiUrl = '/api/weather';

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (response.ok) {
            updateWeatherUI(data);
        } else {
            console.error('Weather API error:', data.message);
            displayWeatherError();
        }
    } catch (error) {
        console.error('Error fetching weather:', error);
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
        'clear': 'Sunny days are perfect for outdoor activities. Stay hydrated and have fun!',
        'clouds': 'Partly cloudy skies today. A great day to explore the campus!',
        'rain': 'Rainy weather ahead. Don\'t forget to bring an umbrella!',
        'drizzle': 'Light drizzle expected. Stay dry and enjoy your day indoors!',
        'thunderstorm': 'Thunderstorms in the area. Please stay safe indoors.',
        'snow': 'Snow is falling! Bundle up and stay warm.',
        'mist': 'Misty conditions outside. Drive carefully and stay safe.',
        'fog': 'Foggy weather today. Take care when moving around campus.',
        'haze': 'Hazy skies today. Stay indoors if you have respiratory concerns.',
        'smoke': 'Smoky conditions detected. Limit outdoor activities if possible.',
        'dust': 'Dusty weather outside. Keep windows closed and stay indoors.',
        'sand': 'Sandy conditions today. Protect your eyes and stay safe.',
        'ash': 'Volcanic ash in the air. Please stay indoors for safety.',
        'squall': 'Strong winds expected. Secure loose items and stay safe.',
        'tornado': 'Tornado warning! Seek shelter immediately.'
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

// === FEATURED NEWS CAROUSEL ===
let newsData = [];
let currentSlide = 0;
let autoAdvanceTimer = null;

// Fetch featured news from backend
async function fetchFeaturedNews() {
    try {
        const response = await fetch('/api/news/featured');
        const data = await response.json();

        newsData = data.map(item => ({
            image: item.image.length > 0 ? item.image[0].imageUrl : '/shared/images/news/news_placeholder.jpg',
            date: new Date(item.datePosted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            tag: item.tag.toUpperCase(),
            title: item.title,
            description: item.content
        }));

        // Dynamically create dots based on news items
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

// Initialize carousel after newsData is fetched
function initCarousel() {
    if (newsData.length === 0) return;
    updateCarousel();
    updateDots();
    startAutoAdvance();
}

// Update carousel
function updateCarousel() {
    const newsContainer = document.querySelector('.news-content');

    // Fade out
    newsContainer.style.opacity = 0;

    setTimeout(() => {
        const news = newsData[currentSlide];

        // Update image
        document.querySelector('.news-image img').src = news.image;

        // Update date and tag
        document.querySelector('.news-date').textContent = news.date;
        document.querySelector('.news-tag').textContent = news.tag;

        // Update title and description
        document.querySelector('.news-title').textContent = news.title;
        document.querySelector('.news-description').textContent = news.description;

        // Fade in
        newsContainer.style.opacity = 1;
    }, 250); // half of transition duration
}

// Update dots
function updateDots() {
    const dots = document.querySelectorAll('.carousel-dots .dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

// Next/Prev slides
function nextSlide(manual = false) {
    if (manual) {
        stopAutoAdvance();
        setTimeout(startAutoAdvance, 10000);
    }
    currentSlide = (currentSlide + 1) % newsData.length;
    updateCarousel();
    updateDots();
}

function prevSlide(manual = false) {
    if (manual) {
        stopAutoAdvance();
        setTimeout(startAutoAdvance, 10000);
    }
    currentSlide = (currentSlide - 1 + newsData.length) % newsData.length;
    updateCarousel();
    updateDots();
}

// Auto-advance
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

// === EVENT LISTENERS ===
document.addEventListener('DOMContentLoaded', () => {
    fetchFeaturedNews();

    document.querySelector('.carousel-nav.prev').addEventListener('click', () => prevSlide(true));
    document.querySelector('.carousel-nav.next').addEventListener('click', () => nextSlide(true));

    document.getElementById('viewAllNews').addEventListener('click', () => {
        window.location.href = 'u_news.html';
    });
});