import showToast from './toast.js';
import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── Date ─────────────────────────────────────────────────────────────────────
document.getElementById('dashboardDate').textContent = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

// ─── Greeting ─────────────────────────────────────────────────────────────────
async function setGreeting() {
    try {
        const res = await fetch('/api/auth/me', { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        if (data.admin) {
            const hour = new Date().getHours();
            const time = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
            document.getElementById('dashboardGreeting').textContent = `${time}, ${data.admin.name}!`;
        }
    } catch (err) {
        // silently fail — greeting is not critical
    }
}

// ─── Fetch All ────────────────────────────────────────────────────────────────
async function fetchAll() {
    await showLoading();
    try {
        const [buildingsRes, officesRes, postsRes, faqsRes, feedbacksRes] = await Promise.all([
            fetch('/api/buildings',  { headers: { 'Accept': 'application/json' } }),
            fetch('/api/offices',    { headers: { 'Accept': 'application/json' } }),
            fetch('/api/posts',      { headers: { 'Accept': 'application/json' } }),
            fetch('/api/faq',        { headers: { 'Accept': 'application/json' } }),
            fetch('/api/feedbacks',  { headers: { 'Accept': 'application/json' } })
        ]);

        const buildingsData = await buildingsRes.json();
        const officesData   = await officesRes.json();
        const postsData     = await postsRes.json();
        const faqsData      = await faqsRes.json();
        const feedbacksData = await feedbacksRes.json();

        const buildings = buildingsData.buildings.filter(b => b.category !== 'road');
        const offices   = officesData.offices;
        const posts     = postsData.posts;
        const faqs      = faqsData.faqs;
        const feedbacks = feedbacksData.feedbacks;

        renderStats(buildings, offices, posts, faqs, feedbacks);
        renderPostsBreakdown(posts);
        renderFeedbackSummary(feedbacks);
        renderRecentPosts(posts);
        renderRecentFeedbacks(feedbacks);

    } catch (err) {
        showToast('error', 'Failed to load dashboard data.');
    } finally {
        hideLoading();
    }
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────
function renderStats(buildings, offices, posts, faqs, feedbacks) {
    document.getElementById('statBuildings').textContent = buildings.length;
    document.getElementById('statOffices').textContent   = offices.length;
    document.getElementById('statPosts').textContent     = posts.length;
    document.getElementById('statFaqs').textContent      = faqs.length;
    document.getElementById('statFeedbacks').textContent = feedbacks.length;
    document.getElementById('statUnread').textContent    = feedbacks.filter(f => !f.isRead).length;
}

// ─── Posts Breakdown ──────────────────────────────────────────────────────────
function renderPostsBreakdown(posts) {
    const container = document.getElementById('postsBreakdown');
    const total = posts.length;

    const counts = {
        news:         posts.filter(p => p.type === 'news').length,
        announcement: posts.filter(p => p.type === 'announcement').length,
        event:        posts.filter(p => p.type === 'event').length
    };

    const labels = { news: 'News', announcement: 'Announcement', event: 'Event' };

    if (total === 0) {
        container.innerHTML = `<p class="dashboard-empty">No posts yet.</p>`;
        return;
    }

    container.innerHTML = Object.entries(counts).map(([type, count]) => `
        <div class="breakdown-item">
            <span class="breakdown-label">${labels[type]}</span>
            <div class="breakdown-bar-wrap">
                <div class="breakdown-bar ${type}" style="width: ${total > 0 ? (count / total * 100).toFixed(1) : 0}%"></div>
            </div>
            <span class="breakdown-count">${count}</span>
        </div>
    `).join('');
}

// ─── Feedback Summary ─────────────────────────────────────────────────────────
function renderFeedbackSummary(feedbacks) {
    const container = document.getElementById('feedbackSummary');

    if (feedbacks.length === 0) {
        container.innerHTML = `<p class="dashboard-empty">No feedbacks yet.</p>`;
        return;
    }

    const avg = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
    const rounded = Math.round(avg * 10) / 10;

    // Rating distribution
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach(f => dist[f.rating]++);

    const starsHtml = [1, 2, 3, 4, 5].map(i =>
        `<i class='bx bxs-star ${i <= Math.round(avg) ? 'filled' : ''}'></i>`
    ).join('');

    const barsHtml = [5, 4, 3, 2, 1].map(star => `
        <div class="rating-bar-item">
            <span class="rating-bar-label">${star} <i class='bx bxs-star'></i></span>
            <div class="rating-bar-wrap">
                <div class="rating-bar-fill" style="width: ${feedbacks.length > 0 ? (dist[star] / feedbacks.length * 100).toFixed(1) : 0}%"></div>
            </div>
            <span class="rating-bar-count">${dist[star]}</span>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="feedback-avg">
            <span class="feedback-avg-score">${rounded.toFixed(1)}</span>
            <div class="feedback-avg-right">
                <div class="feedback-stars">${starsHtml}</div>
                <span class="feedback-avg-label">Based on ${feedbacks.length} feedback${feedbacks.length !== 1 ? 's' : ''}</span>
            </div>
        </div>
        <div class="feedback-rating-bars">${barsHtml}</div>
    `;
}

// ─── Recent Posts ─────────────────────────────────────────────────────────────
function renderRecentPosts(posts) {
    const container = document.getElementById('recentPosts');
    const recent = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    if (recent.length === 0) {
        container.innerHTML = `<p class="dashboard-empty">No posts yet.</p>`;
        return;
    }

    const iconMap = {
        news: 'bx-news',
        announcement: 'bx-megaphone',
        event: 'bx-calendar-event'
    };

    container.innerHTML = recent.map(p => `
        <div class="recent-item">
            <div class="recent-item-icon ${p.type}">
                <i class='bx ${iconMap[p.type] || 'bx-news'}'></i>
            </div>
            <div class="recent-item-info">
                <p class="recent-item-title">${p.title}</p>
                <p class="recent-item-meta">${capitalize(p.type)} · ${formatDate(p.createdAt)}</p>
            </div>
        </div>
    `).join('');
}

// ─── Recent Feedbacks ─────────────────────────────────────────────────────────
function renderRecentFeedbacks(feedbacks) {
    const container = document.getElementById('recentFeedbacks');
    const recent = [...feedbacks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    if (recent.length === 0) {
        container.innerHTML = `<p class="dashboard-empty">No feedbacks yet.</p>`;
        return;
    }

    container.innerHTML = recent.map(f => `
        <div class="recent-item">
            <div class="recent-item-icon feedback">
                <i class='bx bx-comment-detail'></i>
            </div>
            <div class="recent-item-info">
                <p class="recent-item-title">${f.comment || 'No comment left.'}</p>
                <p class="recent-item-meta">${formatDate(f.createdAt)}</p>
            </div>
            <div class="recent-item-stars">
                ${[1,2,3,4,5].map(i => `<i class='bx bxs-star ${i <= f.rating ? 'filled' : ''}'></i>`).join('')}
            </div>
            ${!f.isRead ? `<span class="recent-item-badge unread">New</span>` : ''}
        </div>
    `).join('');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-PH', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

// ─── Init ─────────────────────────────────────────────────────────────────────
setGreeting();
fetchAll();