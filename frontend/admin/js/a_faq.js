import showToast from './a_toast.js';
import checkAuth from './a_auth.js';

let faqs = [];
let selectedFaqId = null;
let modalOverlay = null;
let confirmDeleteModal = null;

const renderFAQs = () => {
    const faqList = document.getElementById('faqList');
    faqList.innerHTML = '';

    faqs.forEach(faq => {
        const item = document.createElement('div');
        item.classList.add('faq-item');
        item.dataset.id = faq._id;

        item.innerHTML = `
            <div class="faq-header">
                <span class="faq-question">${faq.question}</span>
                <button class="toggle-expand">
                    <i class='bx bx-chevron-down'></i>
                </button>
            </div>
            <div class="faq-body hidden">
                <p class="faq-answer">${faq.answer}</p>
                <div class="faq-actions">
                    <button class="edit-faq-btn" title="Edit">
                        <i class='bx bx-edit'></i>
                    </button>
                    <button class="delete-faq-btn" title="Delete">
                        <i class='bx bx-trash'></i>
                    </button>
                    <button class="toggle-visible-btn" title="Toggle Visibility">
                        <i class='bx ${faq.isVisible ? 'bx-show' : 'bx-hide'}'></i>
                    </button>
                </div>
            </div>
        `;

        // Accordion toggle
        item.querySelector('.toggle-expand').addEventListener('click', () => {
            const body = item.querySelector('.faq-body');
            const icon = item.querySelector('.toggle-expand i');
            body.classList.toggle('hidden');
            icon.classList.toggle('bx-chevron-down');
            icon.classList.toggle('bx-chevron-up');
        });

        // Edit inline
        item.querySelector('.edit-faq-btn').addEventListener('click', () => {
            const questionEl = item.querySelector('.faq-question');
            const answerEl = item.querySelector('.faq-answer');

            const currentQuestion = questionEl.textContent;
            const currentAnswer = answerEl.textContent;

            questionEl.innerHTML = `<input type="text" class="edit-question-input" value="${currentQuestion}" />`;
            answerEl.innerHTML = `<textarea class="edit-answer-input" rows="3">${currentAnswer}</textarea>`;

            const editBtn = item.querySelector('.edit-faq-btn');
            editBtn.innerHTML = `<i class='bx bx-check'></i>`;
            editBtn.title = 'Save';

            // Add cancel button
            const cancelBtn = document.createElement('button');
            cancelBtn.classList.add('cancel-edit-btn');
            cancelBtn.title = 'Cancel';
            cancelBtn.innerHTML = `<i class='bx bx-x'></i>`;
            editBtn.insertAdjacentElement('afterend', cancelBtn);

            const saveHandler = async () => {
                const newQuestion = item.querySelector('.edit-question-input').value.trim();
                const newAnswer = item.querySelector('.edit-answer-input').value.trim();

                if (!newQuestion || !newAnswer) {
                    showToast('error', 'Question and answer cannot be empty.');
                    return;
                }

                try {
                    const response = await fetch(`/api/faq/${faq._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ question: newQuestion, answer: newAnswer, isVisible: faq.isVisible })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        showToast('success', 'FAQ updated successfully!');
                        editBtn.removeEventListener('click', saveHandler);
                        await fetchFAQs();
                    } else {
                        showToast('error', data.message);
                    }
                } catch (error) {
                    showToast('error', 'Something went wrong. Please try again.');
                }
            };

            editBtn.addEventListener('click', saveHandler);

            cancelBtn.addEventListener('click', async () => {
                editBtn.removeEventListener('click', saveHandler);
                await fetchFAQs();
            });

        }, { once: true });

        // Toggle visibility
        item.querySelector('.toggle-visible-btn').addEventListener('click', async () => {
            try {
                const response = await fetch(`/api/faq/${faq._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ question: faq.question, answer: faq.answer, isVisible: !faq.isVisible })
                });

                const data = await response.json();

                if (response.ok) {
                    showToast('success', `FAQ is now ${!faq.isVisible ? 'visible' : 'hidden'}.`);
                    await fetchFAQs();
                } else {
                    showToast('error', data.message);
                }
            } catch (error) {
                showToast('error', 'Something went wrong. Please try again.');
            }
        });

        // Delete
        item.querySelector('.delete-faq-btn').addEventListener('click', () => {
            selectedFaqId = faq._id;
            modalOverlay.classList.remove('hidden');
            confirmDeleteModal.classList.remove('hidden');
        });

        faqList.appendChild(item);
    });
};

const fetchFAQs = async () => {
    try {
        const response = await fetch('/api/faq', {
            credentials: 'include'
        });
        const data = await response.json();
        faqs = data.faqs;
        renderFAQs();
    } catch (error) {
        showToast('error', 'Failed to load FAQs.');
    }
};

const init = async () => {
    const admin = await checkAuth();
    if (!admin) return;

    await fetchFAQs();

    modalOverlay = document.getElementById('modalOverlay');
    confirmDeleteModal = document.getElementById('confirmDeleteModal');

    const createBtn = document.getElementById('createNewFAQ');
    const createFAQModal = document.getElementById('createFAQModal');
    const cancelCreateFaq = document.getElementById('cancelCreateFaq');
    const createFAQForm = document.getElementById('createFAQForm');
    const cancelDeleteFAQ = document.getElementById('cancelDeleteFAQ');
    const confirmDeleteFAQ = document.getElementById('confirmDeleteFAQ');

    // Open create modal
    createBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('hidden');
        createFAQModal.classList.remove('hidden');
    });

    // Close create modal
    cancelCreateFaq.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
        createFAQModal.classList.add('hidden');
        createFAQForm.reset();
    });

    // Submit create FAQ
    createFAQForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const question = document.getElementById('faqQuestion').value.trim();
        const answer = document.getElementById('faqAnswer').value.trim();

        try {
            const response = await fetch('/api/faq', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ question, answer })
            });

            const data = await response.json();

            if (response.ok) {
                showToast('success', 'FAQ created successfully!');
                modalOverlay.classList.add('hidden');
                createFAQModal.classList.add('hidden');
                createFAQForm.reset();
                await fetchFAQs();
            } else {
                showToast('error', data.message);
            }
        } catch (error) {
            showToast('error', 'Something went wrong. Please try again.');
        }
    });

    // Cancel delete modal
    cancelDeleteFAQ.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
        confirmDeleteModal.classList.add('hidden');
        selectedFaqId = null;
    });

    // Confirm delete
    confirmDeleteFAQ.addEventListener('click', async () => {
        if (!selectedFaqId) return;

        try {
            const response = await fetch(`/api/faq/${selectedFaqId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                showToast('success', 'FAQ deleted successfully!');
                modalOverlay.classList.add('hidden');
                confirmDeleteModal.classList.add('hidden');
                selectedFaqId = null;
                await fetchFAQs();
            } else {
                showToast('error', data.message);
            }
        } catch (error) {
            showToast('error', 'Something went wrong. Please try again.');
        }
    });
};

init();