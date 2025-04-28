const express = require('express');
const router = express.Router();
const { createFeedback } = require('../../db');

// POST /api/feedback
router.post('/', async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    if (!rating || !feedback) {
      return res.status(400).json({ message: 'Rating and feedback are required.' });
    }

    await createFeedback(rating, feedback);

    res.status(201).json({ message: 'Feedback submitted successfully.' });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
