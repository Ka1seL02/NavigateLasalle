const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');

// Fetch all FAQ items
router.get('/', async (req, res) => {
    try {
        const faqs = await FAQ.find();
        res.status(200).json(faqs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new FAQ
router.post('/', async (req, res) => {
    try {
        const { question, answer, category } = req.body;
        if (!question || !answer || !category) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newFAQ = await FAQ.create({ question, answer, category });
        res.status(201).json(newFAQ);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'FAQ question already exists' });
        res.status(500).json({ message: err.message });
    }
});

// Bulk delete FAQs - IMPORTANT: Must be BEFORE /:id route
router.delete('/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !ids.length) return res.status(400).json({ message: 'No IDs provided' });

        await FAQ.deleteMany({ _id: { $in: ids } });
        res.status(200).json({ message: 'Selected FAQs deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update an FAQ
router.patch('/:id', async (req, res) => {
    try {
        const { question, answer, category } = req.body;
        const updatedFAQ = await FAQ.findByIdAndUpdate(
            req.params.id,
            { question, answer, category },
            { new: true, runValidators: true }
        );
        if (!updatedFAQ) return res.status(404).json({ message: 'FAQ not found' });
        res.status(200).json(updatedFAQ);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a single FAQ
router.delete('/:id', async (req, res) => {
    try {
        const deletedFAQ = await FAQ.findByIdAndDelete(req.params.id);
        if (!deletedFAQ) return res.status(404).json({ message: 'FAQ not found' });
        res.status(200).json({ message: 'FAQ deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;