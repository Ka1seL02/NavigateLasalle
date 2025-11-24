// Back to Dashboard
const backToDashboardBtn = document.querySelector('.back-to-dashboard');
if (backToDashboardBtn) {
    backToDashboardBtn.addEventListener('click', () => {
        window.location.href = 'u_dashboard.html';
    });
}

// FAQ Functionality
let allFAQs = [];
let currentCategory = null;
// Load FAQs dynamically from API
async function loadFAQs() {
    try {
        const response = await fetch('/api/faqs');
        allFAQs = await response.json();
        displayFAQs(allFAQs);
    } catch (error) {
        console.error('Error loading FAQs:', error);
        const faqSection = document.querySelector('.faq-section');
        faqSection.innerHTML = '<p style="text-align: center; color: var(--grey);">Failed to load FAQs. Please try again later.</p>';
    }
}
// Display FAQs in the DOM
function displayFAQs(faqs) {
    const faqSection = document.querySelector('.faq-section');
    faqSection.innerHTML = '';

    if (faqs.length === 0) {
        faqSection.innerHTML = '<p style="text-align: center; color: var(--grey);">No FAQs found.</p>';
        return;
    }

    faqs.forEach(faq => {
        const faqItem = document.createElement('div');
        faqItem.className = 'faq-item';
        faqItem.dataset.category = faq.category;
        faqItem.innerHTML = `
            <button class="faq-question">
                <span>${faq.question}</span>
                <i class='bx bx-chevron-down'></i>
            </button>
            <div class="faq-answer">
                <p>${faq.answer}</p>
            </div>
        `;
        faqSection.appendChild(faqItem);
    });

    initializeFAQDropdowns();
}

// Initialize FAQ dropdown functionality
function initializeFAQDropdowns() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        answer.style.display = 'none';

        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');

            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('open');
                    otherItem.querySelector('.faq-answer').style.display = 'none';
                }
            });

            if (isOpen) {
                item.classList.remove('open');
                answer.style.display = 'none';
            } else {
                item.classList.add('open');
                answer.style.display = 'block';
            }
        });
    });
}

// Filter FAQs based on search and category
function filterFAQs() {
    const searchTerm = document.getElementById('helpSearch').value.toLowerCase();
    let filteredFAQs = allFAQs;
    if (currentCategory) {
        filteredFAQs = filteredFAQs.filter(faq => faq.category === currentCategory);
    }
    if (searchTerm) {
        filteredFAQs = filteredFAQs.filter(faq =>
            faq.question.toLowerCase().includes(searchTerm) ||
            faq.answer.toLowerCase().includes(searchTerm)
        );
    }
    displayFAQs(filteredFAQs);
}

// Category button functionality
function initializeCategoryButtons() {
    const categoryButtons = document.querySelectorAll('.faq-category button');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;

            if (button.classList.contains('active')) {
                button.classList.remove('active');
                currentCategory = null;
            } else {
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentCategory = category;
            }
            filterFAQs();
        });
    });
}

// Search functionality
const searchInput = document.getElementById('helpSearch');
searchInput.addEventListener('input', filterFAQs);
// Load FAQs when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadFAQs();
    initializeCategoryButtons();
});