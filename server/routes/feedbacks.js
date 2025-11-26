const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

// Inserting new Feedback
router.post('/', async (req, res) => {
  try {
    const { feedback, rating } = req.body;

    // Validation
    if (!feedback || !rating) {
      return res.status(400).json({ error: 'Feedback and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const newFeedback = new Feedback({
      feedback,
      rating,
      dateSubmitted: new Date(),
      isRead: false
    });

    await newFeedback.save();
    res.status(201).json({ message: 'Feedback successfully sent', data: newFeedback });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;