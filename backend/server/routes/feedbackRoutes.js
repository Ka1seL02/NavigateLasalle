import express from 'express';
import Feedback from '../models/Feedback.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// ─── GET all feedbacks ────────────────────────────────────────────────────────
// Protected — admin only
// Supports ?isRead=true|false filter
router.get('/', verifyToken, async (req, res) => {
    try {
        const filter = {};
        if (req.query.isRead !== undefined) {
            filter.isRead = req.query.isRead === 'true';
        }

        const feedbacks = await Feedback.find(filter).sort({ createdAt: -1 });
        res.json({ feedbacks });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── POST create feedback ─────────────────────────────────────────────────────
// Public — kiosk submits feedback
router.post('/', async (req, res) => {
    try {
        const { rating, comment } = req.body;

        if (!rating) return res.status(400).json({ error: 'Rating is required.' });
        if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5.' });

        const feedback = await Feedback.create({
            rating,
            comment: comment || null
        });

        res.status(201).json({ feedback });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── PATCH mark as read ───────────────────────────────────────────────────────
// Protected — admin only
router.patch('/:id/read', verifyToken, async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) return res.status(404).json({ error: 'Feedback not found.' });

        feedback.isRead = true;
        await feedback.save();

        res.json({ feedback });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── DELETE feedback ──────────────────────────────────────────────────────────
// Protected — admin only
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) return res.status(404).json({ error: 'Feedback not found.' });

        await feedback.deleteOne();
        res.json({ message: 'Feedback deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;