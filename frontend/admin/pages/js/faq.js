import showToast from './toast.js';
import { showLoading, hideLoading } from '/shared/js/loading.js';

// ─── FAQ List ─────────────────────────────────────────────────────────────────
const faqList = document.getElementById('faqList');

function createFaqElement(faq) {
    const div = document.createElement('div');
    div.classList.add('faq-item');
    div.dataset.id = faq._id;

    div.innerHTML = `
        <div class="faq-header">
            <span class="faq-question">${faq.question}</span>
            <button class="toggle-expand">
                <i class='bx bx-chevron-down'></i>
            </button>
        </div>
        <div class="faq-body hidden">
            <p class="faq-answer">${faq.answer}</p>
            <div class="faq-actions">
                <button class="cancel-btn hidden" title="Cancel">
                    <i class='bx bx-x'></i>
                </button>
                <button class="edit-btn" title="Edit">
                    <i class='bx bx-edit'></i>
                </button>
                <button class="delete-btn" title="Delete">
                    <i class='bx bx-trash'></i>
                </button>
                <button class="toggle-btn" title="Show/Hide">
                    <i class='bx ${faq.isVisible ? 'bx-show' : 'bx-hide'}'></i>
                </button>
            </div>
        </div>
    `;

    // ── Collapse/Expand ───────────────────────────────────────────────────────
    const body = div.querySelector('.faq-body');
    const chevron = div.querySelector('.toggle-expand i');
    const toggleExpandBtn = div.querySelector('.toggle-expand');

    toggleExpandBtn.addEventListener('click', () => {
        body.classList.toggle('hidden');
        chevron.style.transform = body.classList.contains('hidden') ? '' : 'rotate(180deg)';
    });

    // ── Action Buttons ────────────────────────────────────────────────────────
    const editBtn = div.querySelector('.edit-btn');
    const cancelBtn = div.querySelector('.cancel-btn');
    const deleteBtn = div.querySelector('.delete-btn');
    const toggleBtn = div.querySelector('.toggle-btn');

    let isEditing = false;

    // ── Delete ────────────────────────────────────────────────────────────────
    deleteBtn.addEventListener('click', () => openDeleteFaqModal(faq._id));

    // ── Inline Edit ───────────────────────────────────────────────────────────
    editBtn.addEventListener('click', async () => {
        if (!isEditing) {
            isEditing = true;

            const questionEl = div.querySelector('.faq-question');
            const answerEl = div.querySelector('.faq-answer');

            questionEl.outerHTML = `<input class="edit-question-input" value="${faq.question}" />`;
            answerEl.outerHTML = `<textarea class="edit-answer-input">${faq.answer}</textarea>`;

            const answerTextarea = div.querySelector('.edit-answer-input');
            answerTextarea.style.height = 'auto';
            answerTextarea.style.height = answerTextarea.scrollHeight + 24 + 'px';

            editBtn.title = 'Save';
            editBtn.querySelector('i').className = 'bx bx-save';
            cancelBtn.classList.remove('hidden');
            deleteBtn.classList.add('hidden');
            toggleBtn.classList.add('hidden');

        } else {
            const questionInput = div.querySelector('.edit-question-input');
            const answerInput = div.querySelector('.edit-answer-input');
            const newQuestion = questionInput.value.trim();
            const newAnswer = answerInput.value.trim();

            if (!newQuestion || !newAnswer) {
                showToast('error', 'Question and answer cannot be empty.');
                return;
            }

            await showLoading();
            try {
                const res = await fetch(`/api/faq/${faq._id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ question: newQuestion, answer: newAnswer })
                });
                const data = await res.json();

                if (!res.ok) {
                    showToast('error', data.error || 'Failed to update FAQ.');
                    return;
                }

                faq.question = newQuestion;
                faq.answer = newAnswer;
                isEditing = false;
                showToast('success', 'FAQ updated successfully!');
                exitEditMode(div, faq);

            } catch (err) {
                showToast('error', 'Failed to update FAQ.');
            } finally {
                hideLoading();
            }
        }
    });

    cancelBtn.addEventListener('click', () => {
        isEditing = false;
        exitEditMode(div, faq);
    });

    // ── Visibility Toggle ─────────────────────────────────────────────────────
    toggleBtn.addEventListener('click', async () => {
        await showLoading();
        try {
            const res = await fetch(`/api/faq/${faq._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ isVisible: !faq.isVisible })
            });
            const data = await res.json();

            if (!res.ok) {
                showToast('error', data.error || 'Failed to update visibility.');
                return;
            }

            faq.isVisible = !faq.isVisible;
            toggleBtn.querySelector('i').className = `bx ${faq.isVisible ? 'bx-show' : 'bx-hide'}`;
            showToast('success', `FAQ is now ${faq.isVisible ? 'visible' : 'hidden'}.`);

        } catch (err) {
            showToast('error', 'Failed to update visibility.');
        } finally {
            hideLoading();
        }
    });

    return div;
}

function exitEditMode(div, faq) {
    const questionInput = div.querySelector('.edit-question-input');
    const answerInput = div.querySelector('.edit-answer-input');

    if (questionInput) {
        questionInput.outerHTML = `<span class="faq-question">${faq.question}</span>`;
    }
    if (answerInput) {
        answerInput.outerHTML = `<p class="faq-answer">${faq.answer}</p>`;
    }

    const editBtn = div.querySelector('.edit-btn');
    const cancelBtn = div.querySelector('.cancel-btn');
    const deleteBtn = div.querySelector('.delete-btn');
    const toggleBtn = div.querySelector('.toggle-btn');

    editBtn.title = 'Edit';
    editBtn.querySelector('i').className = 'bx bx-edit';
    cancelBtn.classList.add('hidden');
    deleteBtn.classList.remove('hidden');
    toggleBtn.classList.remove('hidden');
}

// ─── Fetch FAQs ───────────────────────────────────────────────────────────────
async function fetchFAQs() {
    await showLoading();
    try {
        const res = await fetch('/api/faq', { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        faqList.innerHTML = '';
        data.faqs.forEach(faq => {
            faqList.appendChild(createFaqElement(faq));
        });
    } catch (err) {
        showToast('error', 'Failed to load FAQs.');
    } finally {
        hideLoading();
    }
}

// ─── Delete FAQ ───────────────────────────────────────────────────────────────
const deleteModalOverlay = document.getElementById('deleteFaqModalOverlay');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');

let deleteFaqId = null;

function openDeleteFaqModal(id) {
    deleteFaqId = id;
    deleteModalOverlay.classList.remove('hidden');
}

cancelDelete.addEventListener('click', () => {
    deleteModalOverlay.classList.add('hidden');
    deleteFaqId = null;
});

confirmDelete.addEventListener('click', async () => {
    if (!deleteFaqId) return;

    deleteModalOverlay.classList.add('hidden');
    await showLoading();

    try {
        const res = await fetch(`/api/faq/${deleteFaqId}`, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();

        if (!res.ok) {
            showToast('error', data.error || 'Failed to delete FAQ.');
        } else {
            showToast('success', 'FAQ deleted successfully!');
            await fetchFAQs();
        }
    } catch (err) {
        showToast('error', 'Failed to delete FAQ.');
    } finally {
        hideLoading();
        deleteFaqId = null;
    }
});

// ─── Create FAQ ───────────────────────────────────────────────────────────────
const createBtn = document.getElementById('createNewFAQ');
const createModalOverlay = document.getElementById('createFaqModalOverlay');
const cancelCreate = document.getElementById('cancelCreate');
const confirmCreate = document.getElementById('confirmCreate');
const newQuestion = document.getElementById('newQuestion');
const newAnswer = document.getElementById('newAnswer');

createBtn.addEventListener('click', () => {
    newQuestion.value = '';
    newAnswer.value = '';
    createModalOverlay.classList.remove('hidden');
});

cancelCreate.addEventListener('click', () => {
    createModalOverlay.classList.add('hidden');
});

confirmCreate.addEventListener('click', async () => {
    const question = newQuestion.value.trim();
    const answer = newAnswer.value.trim();

    if (!question || !answer) {
        showToast('error', 'Question and answer cannot be empty.');
        return;
    }

    createModalOverlay.classList.add('hidden');
    await showLoading();

    try {
        const res = await fetch('/api/faq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ question, answer })
        });
        const data = await res.json();

        if (!res.ok) {
            showToast('error', data.error || 'Failed to create FAQ.');
        } else {
            showToast('success', 'FAQ created successfully!');
            await fetchFAQs();
        }
    } catch (err) {
        showToast('error', 'Failed to create FAQ.');
    } finally {
        hideLoading();
    }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
fetchFAQs();