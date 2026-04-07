import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import Post from '../models/Post.js';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET ALL POSTS
router.get('/', async (req, res) => {
    try {
        const { status, category, sort } = req.query;
        let query = {};

        if (status) query.status = status;
        if (category) query.category = category;

        const posts = await Post.find(query)
            .populate('author', 'name')
            .sort({ publishedAt: sort === 'asc' ? 1 : -1 });

        res.json({ posts });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ message: 'Something went wrong.' });
    }
});

// GET SINGLE POST
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('author', 'name');
        if (!post) return res.status(404).json({ message: 'Post not found.' });
        res.json({ post });
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ message: 'Something went wrong.' });
    }
});

// CREATE POST
router.post('/', upload.array('images', 10), async (req, res) => {
    try {
        const { title, category, body, status, scheduledAt, authorId } = req.body;

        // Validate scheduled time
        if (status === 'Scheduled') {
            if (!scheduledAt) {
                return res.status(400).json({ message: 'Scheduled date and time is required.' });
            }
            const scheduledDate = new Date(scheduledAt);
            const minTime = new Date(Date.now() + 15 * 60 * 1000);
            if (scheduledDate < minTime) {
                return res.status(400).json({ message: 'Scheduled time must be at least 15 minutes in the future.' });
            }
        }

        // Upload images to Cloudinary
        const images = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        { folder: 'navigate-lasalle/posts' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    ).end(file.buffer);
                });
                images.push({ url: result.secure_url, publicId: result.public_id });
            }
        }

        const post = new Post({
            title,
            category,
            body,
            images,
            status,
            scheduledAt: status === 'Scheduled' ? new Date(scheduledAt) : null,
            publishedAt: status === 'Published' ? new Date() : null,
            author: authorId
        });

        await post.save();
        res.json({ message: 'Post created successfully.', post });

    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ message: 'Something went wrong.' });
    }
});

// UPDATE POST
router.put('/:id', upload.array('images', 10), async (req, res) => {
    try {
        const { title, category, body, status, scheduledAt, removeImages } = req.body;

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found.' });

        // Validate scheduled time
        if (status === 'Scheduled') {
            if (!scheduledAt) {
                return res.status(400).json({ message: 'Scheduled date and time is required.' });
            }
            const scheduledDate = new Date(scheduledAt);
            const minTime = new Date(Date.now() + 15 * 60 * 1000);
            if (scheduledDate < minTime) {
                return res.status(400).json({ message: 'Scheduled time must be at least 15 minutes in the future.' });
            }
        }

        // Remove images if requested
        if (removeImages) {
            const toRemove = JSON.parse(removeImages);
            for (const publicId of toRemove) {
                await cloudinary.uploader.destroy(publicId);
            }
            post.images = post.images.filter(img => !toRemove.includes(img.publicId));
        }

        // Upload new images
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        { folder: 'navigate-lasalle/posts' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    ).end(file.buffer);
                });
                post.images.push({ url: result.secure_url, publicId: result.public_id });
            }
        }

        post.title = title;
        post.category = category;
        post.body = body;
        post.status = status;
        post.scheduledAt = status === 'Scheduled' ? new Date(scheduledAt) : null;
        post.publishedAt = status === 'Published' && !post.publishedAt ? new Date() : post.publishedAt;

        await post.save();
        res.json({ message: 'Post updated successfully.', post });

    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ message: 'Something went wrong.' });
    }
});

// DELETE POST
router.delete('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found.' });

        // Delete images from Cloudinary
        for (const image of post.images) {
            await cloudinary.uploader.destroy(image.publicId);
        }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted successfully.' });

    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ message: 'Something went wrong.' });
    }
});

export default router;