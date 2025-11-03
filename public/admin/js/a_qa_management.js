document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('.table tbody');
    const entriesCount = document.querySelector('.entries-count');
    const pageNumberDisplay = document.querySelector('.page-number');
    const paginationButtons = document.querySelectorAll('.pagination-button');

    let faqs = [];
    let currentPage = 1;
    const itemsPerPage = 5;

    try {
        // Fetch all FAQs
        const response = await fetch('/api/faqs');
        faqs = await response.json();

        if (!faqs.length) {
            tableBody.innerHTML = `<tr><td colspan="2">No FAQ items found.</td></tr>`;
            entriesCount.textContent = 'No entries found';
            return;
        }

        renderTable();
        updatePagination();
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        tableBody.innerHTML = `<tr><td colspan="2">Error loading FAQ items.</td></tr>`;
    }

    function renderTable() {
        tableBody.innerHTML = '';

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentItems = faqs.slice(startIndex, endIndex);

        currentItems.forEach(faq => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="item-title qa-item">
                        <h3 class="main-text qa-question">${faq.question}</h3>
                        <p class="sub-text qa-answer">${faq.answer}</p>
                    </div>
                </td>
                <td class="actions">⋮</td>
            `;
            tableBody.appendChild(row);
        });

        const totalEntries = faqs.length;
        const startEntry = startIndex + 1;
        const endEntry = Math.min(endIndex, totalEntries);
        entriesCount.textContent = `Showing ${startEntry}-${endEntry} of ${totalEntries} entries`;
    }

    function updatePagination() {
        const totalPages = Math.ceil(faqs.length / itemsPerPage);

        pageNumberDisplay.textContent = currentPage;

        // Enable/disable buttons
        paginationButtons.forEach(btn => btn.disabled = false);
        if (currentPage === 1) {
            paginationButtons[0].disabled = true; // First
            paginationButtons[1].disabled = true; // Prev
        }
        if (currentPage === totalPages) {
            paginationButtons[2].disabled = true; // Next
            paginationButtons[3].disabled = true; // Last
        }

        // Button click handlers
        paginationButtons[0].onclick = () => { currentPage = 1; renderTable(); updatePagination(); };
        paginationButtons[1].onclick = () => { if (currentPage > 1) currentPage--; renderTable(); updatePagination(); };
        paginationButtons[2].onclick = () => { if (currentPage < totalPages) currentPage++; renderTable(); updatePagination(); };
        paginationButtons[3].onclick = () => { currentPage = totalPages; renderTable(); updatePagination(); };
    }
});