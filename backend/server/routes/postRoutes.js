import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import Post from '../models/Post.js';
import { verifyToken } from '../middleware/auth.js';
import { uploadNews } from '../middleware/upload.js';

const router = express.Router();

// Helper — extract Cloudinary public_id from URL
function getPublicId(url) {
    // URL format: .../navigate-lasalle/news/<public_id>.<ext>
    const parts = url.split('/');
    const file = parts[parts.length - 1];
    const folder = parts[parts.length - 2];
    const grandparent = parts[parts.length - 3];
    return `${grandparent}/${folder}/${file.split('.')[0]}`;
}

// ─── GET all posts ───────────────────────────────────────────────────────────
// Public — kiosk will need to read these
// Supports ?type=news|announcement|event and ?office=id filters
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.type) filter.type = req.query.type;
        if (req.query.office) filter.office = req.query.office;

        const posts = await Post.find(filter)
            .populate('office', 'name category')
            .sort({ createdAt: -1 });

        res.json({ posts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch posts.' });
    }
});

// ─── GET single post ─────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('office', 'name category');
        if (!post) return res.status(404).json({ message: 'Post not found.' });
        res.json({ post });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch post.' });
    }
});

// ─── POST create ─────────────────────────────────────────────────────────────
router.post('/', verifyToken, uploadNews.array('images', 10), async (req, res) => {
    try {
        const { title, content, type, office } = req.body;

        const images = req.files?.map((f) => f.path) ?? [];

        if (images.length < 1) {
            return res.status(400).json({ message: 'At least one image is required.' });
        }

        const post = await Post.create({
            title,
            content,
            type,
            office: office || null,
            images,
        });

        const populated = await post.populate('office', 'name category');
        res.status(201).json({ post: populated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create post.' });
    }
});

// ─── PATCH update ────────────────────────────────────────────────────────────
router.patch('/:id', verifyToken, uploadNews.array('images', 10), async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found.' });

        const { title, content, type, office, removeImages } = req.body;

        // Remove marked images from Cloudinary
        let currentImages = [...post.images];
        if (removeImages) {
            const toRemove = JSON.parse(removeImages); // array of URLs
            await Promise.all(toRemove.map((url) => cloudinary.uploader.destroy(getPublicId(url))));
            currentImages = currentImages.filter((img) => !toRemove.includes(img));
        }

        // Append newly uploaded images
        const newImages = req.files?.map((f) => f.path) ?? [];
        const finalImages = [...currentImages, ...newImages];

        if (finalImages.length < 1) {
            return res.status(400).json({ message: 'At least one image is required.' });
        }

        if (title !== undefined) post.title = title;
        if (content !== undefined) post.content = content;
        if (type !== undefined) post.type = type;
        if (office !== undefined) post.office = office || null;
        post.images = finalImages;

        await post.save();
        const populated = await post.populate('office', 'name category');
        res.json({ post: populated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update post.' });
    }
});

// ─── DELETE ──────────────────────────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found.' });

        // Delete all images from Cloudinary
        await Promise.all(post.images.map((url) => cloudinary.uploader.destroy(getPublicId(url))));

        await post.deleteOne();
        res.json({ message: 'Post deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete post.' });
    }
});

export default router;