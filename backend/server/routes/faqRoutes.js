import express from 'express';
import FAQ from '../models/FAQ.js';

const router = express.Router();

// GET ALL FAQS
router.get('/', async (req, res) => {
    try {
        const faqs = await FAQ.find().sort({ createdAt: -1 });
        res.json({ faqs });
    } catch (error) {
        console.error('Get FAQs error:', error);
        res.status(500).json({ message: 'Something went wrong.' });
    }
});

// CREATE FAQ
router.post('/', async (req, res) => {
    const { question, answer } = req.body;
    try {
        const existing = await FAQ.findOne({ question: { $regex: new RegExp(`^${question}$`, 'i') } });
        if (existing) {
            return res.status(400).json({ message: 'An FAQ with this question already exists.' });
        }

        const faq = new FAQ({ question, answer });
        await faq.save();
        res.json({ message: 'FAQ created successfully.', faq });
    } catch (error) {
        console.error('Create FAQ error:', error);
        res.status(500).json({ message: 'Something went wrong.' });
    }
});

// UPDATE FAQ
router.put('/:id', async (req, res) => {
    const { question, answer, isVisible } = req.body;
    try {
        // Check for duplicate question but exclude the current FAQ being edited
        const existing = await FAQ.findOne({
            question: { $regex: new RegExp(`^${question}$`, 'i') },
            _id: { $ne: req.params.id }
        });
        if (existing) {
            return res.status(400).json({ message: 'An FAQ with this question already exists.' });
        }

        const faq = await FAQ.findByIdAndUpdate(
            req.params.id,
            { question, answer, isVisible },
            { new: true }
        );
        if (!faq) return res.status(404).json({ message: 'FAQ not found.' });
        res.json({ message: 'FAQ updated successfully.', faq });
    } catch (error) {
        console.error('Update FAQ error:', error);
        res.status(500).json({ message: 'Something went wrong.' });
    }
});

// DELETE FAQ
router.delete('/:id', async (req, res) => {
    try {
        const faq = await FAQ.findByIdAndDelete(req.params.id);
        if (!faq) return res.status(404).json({ message: 'FAQ not found.' });
        res.json({ message: 'FAQ deleted successfully.' });
    } catch (error) {
        console.error('Delete FAQ error:', error);
        res.status(500).json({ message: 'Something went wrong.' });
    }
});

export default router;