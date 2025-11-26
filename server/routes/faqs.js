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

module.exports = router;