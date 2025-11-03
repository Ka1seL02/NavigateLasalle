const express = require('express');
const router = express.Router();
const FAQ = require('../../models/FAQ');

// Fetching all FAQ items
router.get('/', async (req, res) => {
    try {
        const faqs = await FAQ.find();
        res.status(200).json(faqs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Inputting New FAQ Items
router.post('/', async (req, res) => {
    try {
        const { question, answer } = req.body;

        if (!question || !answer) {
            return res.status(400).json({ error: 'Missing Fields. '});
        }

        const newFAQ = new FAQ({ question, answer });
        await newFAQ.save();

        res.status(201).json({ message: 'FAQ added successfully', data: newFAQ });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;