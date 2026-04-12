import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── State ────────────────────────────────────────────────────────────────────
let allFaqs = [];
let openIndex = null;

// ─── Elements ─────────────────────────────────────────────────────────────────
const faqList = document.getElementById('faqList');
const searchInput = document.getElementById('searchInput');

// ─── Live Clock ───────────────────────────────────────────────────────────────
function updateClock() {
    const now = new Date();
    document.getElementById('clockTime').textContent = now.toLocaleTimeString('en-PH', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
    document.getElementById('clockDate').textContent = now.toLocaleDateString('en-PH', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}
updateClock();
setInterval(updateClock, 1000);

// ─── Back Button ──────────────────────────────────────────────────────────────
document.getElementById('backBtn').addEventListener('click', () => history.back());

// ─── Fetch FAQs ───────────────────────────────────────────────────────────────
async function fetchFaqs() {
    const res = await fetch('/api/faq', { headers: { 'Accept': 'application/json' } });
    const data = await res.json();
    allFaqs = data.faqs; // no need to filter isVisible, backend handles it
    renderList();
}

// ─── Render List ──────────────────────────────────────────────────────────────
function renderList() {
    const search = searchInput.value.trim().toLowerCase();
    faqList.innerHTML = '';
    openIndex = null;

    const filtered = search
        ? allFaqs.filter(f =>
            f.question.toLowerCase().includes(search) ||
            f.answer.toLowerCase().includes(search)
          )
        : allFaqs;

    if (filtered.length === 0) {
        faqList.innerHTML = `
            <div class="empty-state">
                <i class='bx bx-question-mark'></i>
                <p>${search ? 'No FAQs match your search.' : 'No FAQs available.'}</p>
            </div>
        `;
        return;
    }

    filtered.forEach((faq, index) => {
        const question = search ? highlight(faq.question, search) : faq.question;
        const answer = search ? highlight(faq.answer, search) : faq.answer;

        const item = document.createElement('div');
        item.classList.add('faq-item');
        item.innerHTML = `
            <div class="faq-question">
                <span class="faq-question-text">${question}</span>
                <i class='bx bx-chevron-down faq-chevron'></i>
            </div>
            <div class="faq-answer">
                <p class="faq-answer-text">${answer}</p>
            </div>
        `;

        item.querySelector('.faq-question').addEventListener('click', () => {
            toggleFaq(item, index);
        });

        faqList.appendChild(item);
    });
}

// ─── Toggle FAQ ───────────────────────────────────────────────────────────────
function toggleFaq(item, index) {
    const allItems = faqList.querySelectorAll('.faq-item');

    if (openIndex === index) {
        // Close current
        item.classList.remove('open');
        openIndex = null;
        return;
    }

    // Close previously open
    if (openIndex !== null && allItems[openIndex]) {
        allItems[openIndex].classList.remove('open');
    }

    // Open clicked
    item.classList.add('open');
    openIndex = index;
}

// ─── Highlight Match ──────────────────────────────────────────────────────────
function highlight(text, query) {
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// ─── Search ───────────────────────────────────────────────────────────────────
searchInput.addEventListener('input', renderList);

// ─── Init ─────────────────────────────────────────────────────────────────────
(async () => {
    await showLoading();
    await fetchFaqs();
    hideLoading();
})();