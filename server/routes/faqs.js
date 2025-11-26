const express = require('express');
const router = express.Router();
const FAQ = require('../../models/FAQ');

// Fetch all FAQ items
router.get('/', async (req, res) => {
    try {
        const faqs = await FAQ.find();
        res.status(200).json(faqs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a new FAQ item
router.post('/', async (req, res) => {
    try {
        const { question, answer } = req.body;

        if (!question || !answer) {
            return res.status(400).json({ error: 'Missing fields.' });
        }

        const newFAQ = new FAQ({ question, answer });
        await newFAQ.save();

        res.status(201).json({ message: 'FAQ added successfully', data: newFAQ });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a single FAQ by ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedFAQ = await FAQ.findByIdAndDelete(req.params.id);

        if (!deletedFAQ) {
            return res.status(404).json({ error: 'FAQ not found' });
        }

        res.status(200).json({ message: 'FAQ deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete multiple FAQs by IDs
router.delete('/', async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No IDs provided for deletion.' });
        }

        const result = await FAQ.deleteMany({ _id: { $in: ids } });

        res.status(200).json({
            message: `${result.deletedCount} FAQ(s) deleted successfully.`,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;