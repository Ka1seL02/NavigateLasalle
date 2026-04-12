import express from 'express';
import FAQ from '../models/FAQ.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// ─── Get All FAQs ─────────────────────────────────────────────────────────────
// Public — kiosk needs it
router.get('/', async (req, res) => {
    try {
        const faqs = await FAQ.find({ isVisible: true }).sort({ createdAt: -1 });
        res.json({ faqs });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Create FAQ ───────────────────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
    const { question, answer } = req.body;

    try {
        if (!question || !answer) {
            return res.status(400).json({ error: 'Question and answer are required' });
        }

        const existing = await FAQ.findOne({ question: question.trim() });
        if (existing) {
            return res.status(409).json({ error: 'That question already exists' });
        }

        const faq = await FAQ.create({ question, answer });
        res.status(201).json({ message: 'FAQ created successfully', faq });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Update FAQ (question, answer, visibility) ────────────────────────────────
router.patch('/:id', verifyToken, async (req, res) => {
    const { question, answer, isVisible } = req.body;

    try {
        const faq = await FAQ.findById(req.params.id);
        if (!faq) return res.status(404).json({ error: 'FAQ not found' });

        if (question && question.trim() !== faq.question) {
            const existing = await FAQ.findOne({ question: question.trim() });
            if (existing) {
                return res.status(409).json({ error: 'That question already exists' });
            }
        }

        if (question !== undefined) faq.question = question;
        if (answer !== undefined) faq.answer = answer;
        if (isVisible !== undefined) faq.isVisible = isVisible;

        await faq.save();
        res.json({ message: 'FAQ updated successfully', faq });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Delete FAQ ───────────────────────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const faq = await FAQ.findById(req.params.id);
        if (!faq) return res.status(404).json({ error: 'FAQ not found' });

        await FAQ.findByIdAndDelete(req.params.id);
        res.json({ message: 'FAQ deleted successfully' });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;