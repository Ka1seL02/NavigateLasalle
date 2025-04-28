const express = require('express');
const router = express.Router();
const { getAllFAQs } = require('../../db');

// GET /api/faq
router.get('/', async (req, res) => {
  try {
    const faqs = await getAllFAQs();
    res.json(faqs);
  } catch (err) {
    console.error('Error in FAQ route:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;