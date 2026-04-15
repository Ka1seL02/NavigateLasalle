import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── State ────────────────────────────────────────────────────────────────────
let allPosts = [];

// ─── Elements ─────────────────────────────────────────────────────────────────
const newsList = document.getElementById('newsList');
const typeFilter = document.getElementById('typeFilter');
const monthFilter = document.getElementById('monthFilter');
const yearFilter = document.getElementById('yearFilter');

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

// ─── Fetch Posts ──────────────────────────────────────────────────────────────
async function fetchPosts() {
    const res = await fetch('/api/posts', { headers: { 'Accept': 'application/json' } });
    const data = await res.json();
    allPosts = data.posts;
    populateYearFilter();
    renderList();
}

// ─── Populate Year Filter ─────────────────────────────────────────────────────
function populateYearFilter() {
    const years = [...new Set(allPosts.map(p => new Date(p.createdAt).getFullYear()))];
    years.sort((a, b) => b - a); // newest first
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
}

// ─── Render List ──────────────────────────────────────────────────────────────
function renderList() {
    const type = typeFilter.value;
    const month = monthFilter.value ? parseInt(monthFilter.value) : null;
    const year = yearFilter.value ? parseInt(yearFilter.value) : null;

    newsList.innerHTML = '';

    // Filter
    let filtered = allPosts.filter(p => {
        const date = new Date(p.createdAt);
        const matchType = !type || p.type === type;
        const matchMonth = !month || date.getMonth() + 1 === month;
        const matchYear = !year || date.getFullYear() === year;
        return matchType && matchMonth && matchYear;
    });

    if (filtered.length === 0) {
        newsList.innerHTML = `
            <div class="empty-state">
                <i class='bx bx-news'></i>
                <p>No posts found.</p>
            </div>
        `;
        return;
    }

    // Group by date (MMMM DD, YYYY)
    const groups = {};
    filtered.forEach(post => {
        const date = new Date(post.createdAt);
        const key = date.toLocaleDateString('en-PH', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        // Sort key for ordering (newest first)
        if (!groups[key]) groups[key] = { posts: [], timestamp: date.getTime() };
        groups[key].posts.push(post);
    });

    // Sort groups newest first
    const sortedGroups = Object.entries(groups).sort((a, b) => b[1].timestamp - a[1].timestamp);

    sortedGroups.forEach(([dateLabel, { posts }]) => {
        const section = document.createElement('div');
        section.classList.add('date-group');

        const grid = posts.map(post => {
            const officeName = post.office?.name ?? 'DLSU-D';
            return `
                <a href="news-detail.html?id=${post._id}" class="news-card">
                    <img class="news-card-thumbnail" src="${post.images[0]}" alt="${post.title}" />
                    <div class="news-card-body">
                        <div class="news-card-meta">
                            <span class="type-badge ${post.type}">${capitalize(post.type)}</span>
                        </div>
                        <p class="news-card-title">${post.title}</p>
                        <p class="news-card-office">
                            <i class='bx bx-buildings'></i> ${officeName}
                        </p>
                    </div>
                </a>
            `;
        }).join('');

        section.innerHTML = `
            <p class="date-group-title">${dateLabel}</p>
            <div class="date-group-cards">${grid}</div>
        `;

        newsList.appendChild(section);
    });
}

// ─── Filter Listeners ─────────────────────────────────────────────────────────
typeFilter.addEventListener('change', renderList);
monthFilter.addEventListener('change', renderList);
yearFilter.addEventListener('change', renderList);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
(async () => {
    await showLoading();
    await fetchPosts();
    hideLoading();
})();