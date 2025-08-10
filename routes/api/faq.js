const express = require('express');
const router = express.Router();
const FAQ = require('../../models/faq');

// GET all FAQs
router.get('/', async (req, res) => {
  try {
    const faqs = await FAQ.find();
    res.json(faqs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching FAQs' });
  }
});

module.exports = router;