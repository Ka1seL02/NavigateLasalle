// ==================== STATE MANAGEMENT ==================== //
let currentPage = 1;
let totalPages = 1;
let newsData = [];
let allNewsData = [];
let selectedNews = new Set();
let currentFilter = 'all'; // all, published, scheduled, draft
let currentSort = { field: 'date', order: 'desc' };

// ==================== INITIALIZATION ==================== //
document.addEventListener('DOMContentLoaded', () => {
    loadNews();
    initializeEventListeners();
});

// ==================== EVENT LISTENERS ==================== //
function initializeEventListeners() {
    // Search
    const searchInput = document.querySelector('.search-box input');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentPage = 1;
            loadNews(e.target.value);
        }, 500);
    });

    // Filter Buttons
    const filterButtons = document.querySelectorAll('.filter-buttons button');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            currentPage = 1;
            selectedNews.clear();
            applyFilter();
        });
    });

    // Post News Button (redirect to form)
    const postNewsBtn = document.getElementById('createNewNews');
    postNewsBtn.addEventListener('click', () => {
        window.location.href = 'a_news_form.html';
    });

    // Refresh
    const refreshBtn = document.getElementById('refresh-table');
    refreshBtn.addEventListener('click', () => {
        selectedNews.clear();
        currentPage = 1;
        loadNews();
    });

    // Delete Selected
    const deleteBtn = document.getElementById('delete-selected');
    deleteBtn.addEventListener('click', deleteSelectedNews);

    // Publish Selected
    const publishBtn = document.getElementById('publish-selected');
    publishBtn.addEventListener('click', publishSelectedNews);

    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            applyFilter();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            applyFilter();
        }
    });

    const pageInput = document.getElementById('current-page');
    pageInput.addEventListener('change', (e) => {
        const page = parseInt(e.target.value);
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            applyFilter();
        } else {
            e.target.value = currentPage;
        }
    });

    // Select All
    const selectAllCheckbox = document.querySelector('.select-all-toolbar');
    selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            const newsId = cb.dataset.id;
            if (e.target.checked) {
                selectedNews.add(newsId);
            } else {
                selectedNews.delete(newsId);
            }
        });
    });

    // Export Table
    const exportBtn = document.querySelector('.export-table');
    exportBtn.addEventListener('click', exportTable);

    // Sorting
    const sortableHeaders = document.querySelectorAll('th[data-sort]');
    sortableHeaders.forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => {
            const sortField = header.dataset.sort;

            if (currentSort.field === sortField) {
                currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.field = sortField;
                currentSort.order = 'desc';
            }

            currentPage = 1;
            applyFilter();
            updateSortIndicators();
        });
    });

    updateSortIndicators();
}

// ==================== LOAD NEWS ==================== //
async function loadNews(search = '') {
    try {
        const response = await fetch('/api/news');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to load news');
        }

        allNewsData = data;
        applyFilter(search);

    } catch (error) {
        console.error('Load news error:', error);
        customNotification('error', 'Error', error.message);
    }
}

// ==================== APPLY FILTER ==================== //
function applyFilter(search = '') {
    let filteredData = [...allNewsData];

    // Apply search filter
    if (search) {
        filteredData = filteredData.filter(news =>
            news.title.toLowerCase().includes(search.toLowerCase())
        );
    }

    // Apply status filter
    if (currentFilter !== 'all') {
        filteredData = filteredData.filter(news => news.status === currentFilter);
    }

    // Apply sorting
    filteredData.sort((a, b) => {
        let compareA, compareB;

        if (currentSort.field === 'date') {
            // Sort by appropriate date field based on status
            compareA = a.datePosted || a.dateScheduled || a.createdAt;
            compareB = b.datePosted || b.dateScheduled || b.createdAt;
            compareA = new Date(compareA);
            compareB = new Date(compareB);
        }

        if (currentSort.order === 'asc') {
            return compareA > compareB ? 1 : -1;
        } else {
            return compareA < compareB ? 1 : -1;
        }
    });

    // Pagination (20 per page)
    const limit = 20;
    const total = filteredData.length;
    totalPages = Math.ceil(total / limit) || 1;

    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    newsData = paginatedData;

    renderTable(paginatedData);
    updatePagination({
        page: currentPage,
        pages: totalPages,
        total: total,
        limit: limit
    });
}

// ==================== FORMAT DATE ==================== //
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// ==================== RENDER TABLE ==================== //
function renderTable(news) {
    const tbody = document.querySelector('.table tbody');

    if (news.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--light-grey);">
                    No news found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = news.map(item => {
        // Calculate additional images
        const totalImages = item.image.length;
        const additionalImages = totalImages > 1 ? `+${totalImages - 1}` : '';
        const firstImage = item.image.length > 0 ? item.image[0].imageUrl : '/shared/images/news/news_placeholder.jpg';

        // Determine date to display based on status
        let displayDate = 'N/A';
        if (item.status === 'published' && item.datePosted) {
            displayDate = formatDate(item.datePosted);
        } else if (item.status === 'scheduled' && item.dateScheduled) {
            displayDate = formatDate(item.dateScheduled);
        } else if (item.createdAt) {
            displayDate = formatDate(item.createdAt);
        }

        return `
            <tr>
                <td><input type="checkbox" data-id="${item._id}" ${selectedNews.has(item._id) ? 'checked' : ''}></td>
                <td>
                    <div class="table-image">
                        <img src="${firstImage}" alt="${item.title}">
                        ${additionalImages ? `<span class="img-indicator">${additionalImages}</span>` : ''}
                    </div>
                </td>
                <td class="news-title">${escapeHtml(item.title)}</td>
                <td>${escapeHtml(item.tag)}</td>
                <td class="${item.status}">${capitalize(item.status)}</td>
                <td>${displayDate}</td>
                <td>
                    <i class='bx bx-dots-vertical-rounded' style="cursor: pointer;" onclick="showNewsMenu(event, '${item._id}')"></i>
                </td>
            </tr>
        `;
    }).join('');

    const checkboxes = tbody.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            const newsId = e.target.dataset.id;
            if (e.target.checked) {
                selectedNews.add(newsId);
            } else {
                selectedNews.delete(newsId);
            }
            updateSelectAllCheckbox();
        });
    });
}

// ==================== HELPER FUNCTIONS ==================== //
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ==================== UPDATE PAGINATION ==================== //
function updatePagination(pagination) {
    document.getElementById('start-entry').textContent =
        pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.limit + 1);
    document.getElementById('end-entry').textContent =
        Math.min(pagination.page * pagination.limit, pagination.total);
    document.getElementById('total-entries').textContent = pagination.total;
    document.getElementById('total-pages').textContent = pagination.pages;
    document.getElementById('current-page').value = pagination.page;

    document.getElementById('prev-page').disabled = pagination.page === 1;
    document.getElementById('next-page').disabled = pagination.page === pagination.pages;
}

// ==================== UPDATE SELECT ALL CHECKBOX ==================== //
function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.querySelector('.select-all-toolbar');
    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    const noneChecked = Array.from(checkboxes).every(cb => !cb.checked);

    selectAllCheckbox.checked = allChecked;
    selectAllCheckbox.indeterminate = !allChecked && !noneChecked;
}

// ==================== UPDATE SORT INDICATORS ==================== //
function updateSortIndicators() {
    const headers = document.querySelectorAll('th[data-sort]');

    headers.forEach(header => {
        const sortField = header.dataset.sort;
        header.innerHTML = header.innerHTML.replace(/ ▲| ▼/g, '');

        if (currentSort.field === sortField) {
            const indicator = currentSort.order === 'asc' ? ' ▲' : ' ▼';
            header.innerHTML += indicator;
        }
    });
}

// ==================== NEWS CONTEXT MENU ==================== //
function showNewsMenu(event, newsId) {
    event.stopPropagation();

    const existingMenu = document.querySelector('.news-context-menu');
    if (existingMenu) existingMenu.remove();

    const newsItem = allNewsData.find(n => n._id === newsId);
    if (!newsItem) return;

    const menu = document.createElement('div');
    menu.className = 'news-context-menu';
    menu.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid var(--shadow);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        min-width: 180px;
    `;

    // Menu options based on status
    let menuItems = '';

    if (newsItem.status === 'published') {
        menuItems = `
            <div class="menu-item" onclick="deleteNews('${newsId}')" style="padding: 10px 16px; cursor: pointer; transition: background 0.2s;">
                Delete
            </div>
        `;
    } else if (newsItem.status === 'scheduled') {
        menuItems = `
            <div class="menu-item" onclick="editNews('${newsId}')" style="padding: 10px 16px; cursor: pointer; transition: background 0.2s;">
                Edit
            </div>
            <div class="menu-item" onclick="publishNow('${newsId}')" style="padding: 10px 16px; cursor: pointer; transition: background 0.2s;">
                Publish Now
            </div>
            <div class="menu-item" onclick="moveToDraft('${newsId}')" style="padding: 10px 16px; cursor: pointer; transition: background 0.2s;">
                Move to Draft
            </div>
            <div class="menu-item" onclick="deleteNews('${newsId}')" style="padding: 10px 16px; cursor: pointer; transition: background 0.2s;">
                Delete
            </div>
        `;
    } else { // draft
        menuItems = `
            <div class="menu-item" onclick="editNews('${newsId}')" style="padding: 10px 16px; cursor: pointer; transition: background 0.2s;">
                Edit
            </div>
            <div class="menu-item" onclick="publishNow('${newsId}')" style="padding: 10px 16px; cursor: pointer; transition: background 0.2s;">
                Publish Now
            </div>
            <div class="menu-item" onclick="deleteNews('${newsId}')" style="padding: 10px 16px; cursor: pointer; transition: background 0.2s;">
                Delete
            </div>
        `;
    }

    menu.innerHTML = menuItems;
    document.body.appendChild(menu);

    const rect = event.target.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.left - menu.offsetWidth + 20}px`;

    const menuItemElements = menu.querySelectorAll('.menu-item');
    menuItemElements.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = 'var(--cream)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'transparent';
        });
    });

    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 0);
}

// ==================== EDIT NEWS ==================== //
function editNews(newsId) {
    window.location.href = `a_news_form.html?id=${newsId}`;
}

// ==================== PUBLISH NOW ==================== //
async function publishNow(newsId) {
    showConfirmModal({
        icon: 'bx-paper-plane',
        iconColor: 'var(--cream)',
        title: 'Publish Now?',
        message: 'Are you sure you want to publish this news immediately?',
        confirmText: 'Yes, Publish',
        confirmColor: 'var(--green)',
        onConfirm: async (btn) => {
            btn.disabled = true;
            btn.textContent = 'Publishing...';

            try {
                const response = await fetch(`/api/news/${newsId}/publish`, {
                    method: 'PATCH'
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to publish news');
                }

                customNotification('success', 'Success', data.message);
                loadNews();

            } catch (error) {
                console.error('Publish news error:', error);
                customNotification('error', 'Error', error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Yes, Publish';
            }
        }
    });
}

// ==================== MOVE TO DRAFT ==================== //
async function moveToDraft(newsId) {
    showConfirmModal({
        icon: 'bx-edit',
        iconColor: 'var(--cream)',
        title: 'Move to Draft?',
        message: 'Are you sure you want to move this news back to draft?',
        confirmText: 'Yes, Move to Draft',
        confirmColor: 'var(--orange)',
        onConfirm: async (btn) => {
            btn.disabled = true;
            btn.textContent = 'Moving...';

            try {
                const response = await fetch(`/api/news/${newsId}/draft`, {
                    method: 'PATCH'
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to move to draft');
                }

                customNotification('success', 'Success', data.message);
                loadNews();

            } catch (error) {
                console.error('Move to draft error:', error);
                customNotification('error', 'Error', error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Yes, Move to Draft';
            }
        }
    });
}

// ==================== DELETE NEWS ==================== //
async function deleteNews(newsId) {
    showConfirmModal({
        icon: 'bx-trash',
        iconColor: 'var(--cream)',
        title: 'Delete News?',
        message: 'Are you sure you want to delete this news? This action cannot be undone.',
        confirmText: 'Yes, Delete',
        confirmColor: 'var(--red)',
        onConfirm: async (btn) => {
            btn.disabled = true;
            btn.textContent = 'Deleting...';

            try {
                const response = await fetch(`/api/news/${newsId}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to delete news');
                }

                customNotification('success', 'Success', data.message);
                loadNews();

            } catch (error) {
                console.error('Delete news error:', error);
                customNotification('error', 'Error', error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Yes, Delete';
            }
        }
    });
}

// ==================== PUBLISH SELECTED NEWS ==================== //
async function publishSelectedNews() {
    if (selectedNews.size === 0) {
        customNotification('error', 'No Selection', 'Please select at least one news to publish.');
        return;
    }

    showConfirmModal({
        icon: 'bx-paper-plane',
        iconColor: 'var(--cream)',
        title: 'Publish Selected?',
        message: `Are you sure you want to publish ${selectedNews.size} news item(s)?`,
        confirmText: 'Yes, Publish',
        confirmColor: 'var(--green)',
        onConfirm: async (btn) => {
            btn.disabled = true;
            btn.textContent = 'Publishing...';

            try {
                const response = await fetch('/api/news/bulk-publish', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: Array.from(selectedNews) })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to publish news');
                }

                customNotification('success', 'Success', data.message);
                selectedNews.clear();
                loadNews();

            } catch (error) {
                console.error('Publish news error:', error);
                customNotification('error', 'Error', error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Yes, Publish';
            }
        }
    });
}

// ==================== DELETE SELECTED NEWS ==================== //
async function deleteSelectedNews() {
    if (selectedNews.size === 0) {
        customNotification('error', 'No Selection', 'Please select at least one news to delete.');
        return;
    }

    showConfirmModal({
        icon: 'bx-trash',
        iconColor: 'var(--cream)',
        title: 'Delete News?',
        message: `Are you sure you want to delete ${selectedNews.size} news item(s)? This action cannot be undone.`,
        confirmText: 'Yes, Delete',
        confirmColor: 'var(--red)',
        onConfirm: async (btn) => {
            btn.disabled = true;
            btn.textContent = 'Deleting...';

            try {
                const response = await fetch('/api/news/bulk-delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: Array.from(selectedNews) })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to delete news');
                }

                customNotification('success', 'Success', data.message);
                selectedNews.clear();
                loadNews();

            } catch (error) {
                console.error('Delete news error:', error);
                customNotification('error', 'Error', error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Yes, Delete';
            }
        }
    });
}

// ==================== EXPORT TABLE ==================== //
function exportTable() {
    if (newsData.length === 0) {
        customNotification('error', 'No Data', 'No data available to export.');
        return;
    }

    const headers = ['Title', 'Tag', 'Status', 'Date', 'Author'];
    const rows = newsData.map(item => {
        let displayDate = 'N/A';
        if (item.status === 'published' && item.datePosted) {
            displayDate = formatDate(item.datePosted);
        } else if (item.status === 'scheduled' && item.dateScheduled) {
            displayDate = formatDate(item.dateScheduled);
        } else if (item.createdAt) {
            displayDate = formatDate(item.createdAt);
        }

        return [
            item.title,
            item.tag,
            capitalize(item.status),
            displayDate,
            item.author
        ];
    });

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `news-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    customNotification('success', 'Success', 'News exported successfully.');
}