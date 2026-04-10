import express from 'express';
import Building from '../models/Building.js';
import { uploadBuilding } from '../middleware/upload.js';
import { verifyToken } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

router.use(verifyToken);

// ─── Get All Buildings ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const buildings = await Building.find().sort({ category: 1, name: 1 });
        res.json({ buildings });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Get One Building ─────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const building = await Building.findById(req.params.id);
        if (!building) return res.status(404).json({ error: 'Building not found' });
        res.json({ building });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Create Building ──────────────────────────────────────────────────────────
router.post('/', uploadBuilding.array('images', 10), async (req, res) => {
    try {
        const { name, dataId, category, description, isVisible, shape } = req.body;

        if (!name || !dataId || !category || !shape) {
            return res.status(400).json({ error: 'Name, dataId, category, and shape are required' });
        }

        const existing = await Building.findOne({ dataId });
        if (existing) {
            return res.status(409).json({ error: 'A building with that dataId already exists' });
        }

        const images = req.files ? req.files.map(f => f.path) : [];
        const parsedShape = typeof shape === 'string' ? JSON.parse(shape) : shape;

        const building = await Building.create({
            name, dataId, category, description,
            isVisible: isVisible !== undefined ? isVisible : true,
            images,
            shape: parsedShape
        });

        res.status(201).json({ message: 'Building created successfully', building });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Update Building ──────────────────────────────────────────────────────────
router.patch('/:id', uploadBuilding.array('images', 10), async (req, res) => {
    try {
        const building = await Building.findById(req.params.id);
        if (!building) return res.status(404).json({ error: 'Building not found' });

        const { name, dataId, category, description, isVisible, shape, removeImages } = req.body;

        if (dataId && dataId !== building.dataId) {
            const existing = await Building.findOne({ dataId });
            if (existing) return res.status(409).json({ error: 'A building with that dataId already exists' });
        }

        if (removeImages) {
            const toRemove = typeof removeImages === 'string' ? JSON.parse(removeImages) : removeImages;
            for (const url of toRemove) {
                const publicId = url.split('/').slice(-2).join('/').split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }
            building.images = building.images.filter(img => !toRemove.includes(img));
        }

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(f => f.path);
            building.images = [...building.images, ...newImages];
        }

        if (name !== undefined) building.name = name;
        if (dataId !== undefined) building.dataId = dataId;
        if (category !== undefined) building.category = category;
        if (description !== undefined) building.description = description;
        if (isVisible !== undefined) building.isVisible = isVisible;
        if (shape !== undefined) building.shape = typeof shape === 'string' ? JSON.parse(shape) : shape;

        await building.save();
        res.json({ message: 'Building updated successfully', building });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Delete Building ──────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
    try {
        const building = await Building.findById(req.params.id);
        if (!building) return res.status(404).json({ error: 'Building not found' });

        for (const url of building.images) {
            const publicId = url.split('/').slice(-2).join('/').split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        await Building.findByIdAndDelete(req.params.id);
        res.json({ message: 'Building deleted successfully' });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;