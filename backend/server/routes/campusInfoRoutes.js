import express from 'express';
import CampusInfo from '../models/CampusInfo.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// ─── GET all sections ─────────────────────────────────────────────────────────
// Public — kiosk needs it
router.get('/', async (req, res) => {
    try {
        const sections = await CampusInfo.find().sort({ createdAt: 1 });
        res.json({ sections });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── GET single section by key ────────────────────────────────────────────────
// Public — kiosk needs it
router.get('/:key', async (req, res) => {
    try {
        const section = await CampusInfo.findOne({ key: req.params.key });
        if (!section) return res.status(404).json({ error: 'Section not found.' });
        res.json({ section });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── PATCH update section ─────────────────────────────────────────────────────
// Protected — admin only
router.patch('/:key', verifyToken, async (req, res) => {
    try {
        const { content, icon, videoUrl } = req.body;
        const section = await CampusInfo.findOne({ key: req.params.key });
        if (!section) return res.status(404).json({ error: 'Section not found.' });

        if (content !== undefined) section.content = content ?? null;
        if (icon !== undefined) section.icon = icon ?? null;
        if (videoUrl !== undefined) section.videoUrl = videoUrl ?? null;

        await section.save();
        res.json({ message: 'Section updated successfully.', section });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;