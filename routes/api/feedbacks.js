const express = require('express');
const router = express.Router();
const Feedback = require('../../models/Feedback');

// Inserting new Feedback
router.post('/', async (req, res) => {
  try {
    const { feedback, rating } = req.body;
    const newFeedback = new Feedback({
      feedback,
      rating,
      dateSubmitted: new Date(),
      isRead: false
    });

    await newFeedback.save();
    res.status(201).json({ message: 'Feedback successfully sent' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch all Feedbacks with filtering + sorting
router.get('/', async (req, res) => {
  try {
    const { date, status, sortBy, order } = req.query;
    let query = {};

    // Filter by date
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.dateSubmitted = { $gte: start, $lt: end };
    }

    // Filter by status
    if (status === 'read') query.isRead = true;
    if (status === 'unread') query.isRead = false;

    // Sorting logic
    let sort = {};
    if (sortBy === 'dateSubmitted') sort.dateSubmitted = order === 'asc' ? 1 : -1;
    else if (sortBy === 'rating') sort.rating = order === 'asc' ? 1 : -1;
    else sort.dateSubmitted = -1; // default newest first

    const feedbacks = await Feedback.find(query).sort(sort);
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change status of feedback to Unread
router.patch('/:_id', async (req, res) => {
    try {
        const feedback = await Feedback.findOne({ _id: req.params._id });
        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
        
        if(!feedback.isRead) { 
            feedback.isRead = true 
            await feedback.save();
        }

        res.status(200).json({ message: 'Feedback marked as read successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete feedback
router.delete('/:_id', async (req, res) => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params._id);
    if (!deleted) return res.status(404).json({ message: 'Feedback not found' });
    res.json({ message: 'Feedback deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;