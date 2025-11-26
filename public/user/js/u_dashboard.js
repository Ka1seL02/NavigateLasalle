// === CLOCK AND DATE (Your original code) ===
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

// === CAROUSEL FUNCTIONALITY ===
// News data array
const newsData = [
    {
        image: "../shared/images/news/news_3.jpg",
        date: "APRIL 3, 2024",
        tag: "NEWS",
        title: "DLSU-D joins Study Abroad Fair in Taiwan",
        description: "DLSU-D's Linkages and Scholarship Office recently participated in the Partner Day and Study Abroad Fair organized by Providence University in Taiwan. This event provided an excellent platform for DLSU-D to showcase its academic programs and foster international collaborations. Representatives from DLSU-D engaged with prospective students and academic partners, highlighting the university's commitment to global education and cultural exchange."
    },
    {
        image: "../shared/images/news/news_1.jpg",
        date: "MARCH 15, 2024",
        tag: "EVENTS",
        title: "Annual Research Symposium 2024",
        description: "DLSU-D hosted its annual research symposium, featuring groundbreaking studies from faculty and students across various disciplines. The event showcased innovative research in engineering, education, business, and the sciences, promoting academic excellence and collaboration within the university community."
    },
    {
        image: "../shared/images/news/news_2.jpg",
        date: "MARCH 28, 2024",
        tag: "ACHIEVEMENT",
        title: "DLSU-D Students Win International Competition",
        description: "A team of DLSU-D engineering students brought pride to the university by winning first place in an international robotics competition held in Singapore. Their innovative design and exceptional teamwork impressed judges from around the world, demonstrating the quality of education at DLSU-D."
    },
    {
        image: "../shared/images/news/news_4.jpg",
        date: "APRIL 10, 2024",
        tag: "COMMUNITY",
        title: "Community Outreach Program Reaches 1000 Families",
        description: "The university's community extension services marked a significant milestone by reaching its 1000th family through various outreach programs. These initiatives include educational support, livelihood training, and health services, reflecting DLSU-D's commitment to social responsibility and community development."
    },
    {
        image: "../shared/images/news/news_5.jpg",
        date: "APRIL 18, 2024",
        tag: "ACADEMIC",
        title: "New Programs Launched for Academic Year 2024-2025",
        description: "DLSU-D announced the launch of several new academic programs designed to meet the evolving needs of industries and society. These programs include specialized tracks in data science, sustainable development, and digital marketing, ensuring students are well-prepared for future career opportunities."
    }
];

// Current slide index
let currentSlide = 0;
let autoAdvanceTimer = null;

// Initialize carousel
function initCarousel() {
    updateCarousel();
    updateDots();
    startAutoAdvance();
}

// Start auto-advance
function startAutoAdvance() {
    // Clear any existing timer
    if (autoAdvanceTimer) {
        clearInterval(autoAdvanceTimer);
    }
    // Auto-advance carousel every 5 seconds
    autoAdvanceTimer = setInterval(() => {
        nextSlide();
    }, 5000);
}

// Stop auto-advance
function stopAutoAdvance() {
    if (autoAdvanceTimer) {
        clearInterval(autoAdvanceTimer);
        autoAdvanceTimer = null;
    }
}

// Update carousel content
function updateCarousel() {
    const news = newsData[currentSlide];
    
    // Update image
    document.querySelector('.news-image img').src = news.image;
    
    // Update date and tag
    document.querySelector('.news-date').textContent = news.date;
    document.querySelector('.news-tag').textContent = news.tag;
    
    // Update title and description
    document.querySelector('.news-title').textContent = news.title;
    document.querySelector('.news-description').textContent = news.description;
}

// Update dots
function updateDots() {
    const dots = document.querySelectorAll('.carousel-dots .dot');
    dots.forEach((dot, index) => {
        if (index === currentSlide) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Next slide
function nextSlide(manual = false) {
    if (manual) {
        stopAutoAdvance();
        // Restart auto-advance after 10 seconds of inactivity
        setTimeout(startAutoAdvance, 10000);
    }
    currentSlide = (currentSlide + 1) % newsData.length;
    updateCarousel();
    updateDots();
}

// Previous slide
function prevSlide(manual = false) {
    if (manual) {
        stopAutoAdvance();
        // Restart auto-advance after 10 seconds of inactivity
        setTimeout(startAutoAdvance, 10000);
    }
    currentSlide = (currentSlide - 1 + newsData.length) % newsData.length;
    updateCarousel();
    updateDots();
}

// === EVENT LISTENERS ===
document.addEventListener('DOMContentLoaded', () => {
    // Initialize carousel
    initCarousel();
    
    // Carousel navigation buttons
    document.querySelector('.carousel-nav.prev').addEventListener('click', () => prevSlide(true));
    document.querySelector('.carousel-nav.next').addEventListener('click', () => nextSlide(true));
    
    // Dot navigation
    const dots = document.querySelectorAll('.carousel-dots .dot');
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            stopAutoAdvance();
            currentSlide = index;
            updateCarousel();
            updateDots();
            // Restart auto-advance after 10 seconds of inactivity
            setTimeout(startAutoAdvance, 10000);
        });
    });
    
    // View All News button
    document.getElementById('viewAllNews').addEventListener('click', () => {
        alert('Navigate to all news page');
        // You can replace this with actual navigation
        // window.location.href = 'news.html';
    });
});

const aboutBox = document.querySelector('.small-box.about');
const mapBox = document.querySelector('.small-box.map');
const virtualBox = document.querySelector('.small-box.virtual');
const helpBox = document.querySelector('.small-box.help');

aboutBox.addEventListener('click', () => { window.location.href = 'u_about.html'; });
mapBox.addEventListener('click', () => { window.location.href = './virtualtour/u_virtual-tour.html'; });
virtualBox.addEventListener('click', () => { window.location.href = 'u_virtual_tour.html'; });
helpBox.addEventListener('click', () => { window.location.href = 'u_help.html'; });