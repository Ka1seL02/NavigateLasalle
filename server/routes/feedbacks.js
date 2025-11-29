const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

// Get all feedbacks
router.get('/', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ dateSubmitted: -1 });
    res.status(200).json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Inserting new Feedback
router.post('/', async (req, res) => {
  try {
    const { feedback, rating } = req.body;

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

// IMPORTANT: Bulk routes MUST come BEFORE /:id routes
// Bulk mark as read
router.patch('/bulk/read', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ message: 'No IDs provided' });

    await Feedback.updateMany(
      { _id: { $in: ids } },
      { isRead: true }
    );
    res.status(200).json({ message: 'Selected feedbacks marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk mark as unread
router.patch('/bulk/unread', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ message: 'No IDs provided' });

    await Feedback.updateMany(
      { _id: { $in: ids } },
      { isRead: false }
    );
    res.status(200).json({ message: 'Selected feedbacks marked as unread' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk delete feedbacks
router.delete('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ message: 'No IDs provided' });

    await Feedback.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ message: 'Selected feedbacks deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark feedback as read
router.patch('/:id/read', async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.status(200).json({ message: 'Feedback marked as read', feedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark feedback as unread
router.patch('/:id/unread', async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { isRead: false },
      { new: true }
    );
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.status(200).json({ message: 'Feedback marked as unread', feedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete single feedback
router.delete('/:id', async (req, res) => {
  try {
    const deletedFeedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!deletedFeedback) return res.status(404).json({ message: 'Feedback not found' });
    res.status(200).json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;