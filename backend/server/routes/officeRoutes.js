import express from 'express';
import Office from '../models/Office.js';
import { uploadOffice } from '../middleware/upload.js';
import { verifyToken } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// ─── Get All Offices ──────────────────────────────────────────────────────────
// Public — kiosk needs it
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.building) filter.building = req.query.building;

        const offices = await Office.find(filter)
            .populate('building', 'name dataId')
            .populate('subOffices', 'name category')
            .sort({ category: 1, name: 1 });
        res.json({ offices });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Get One Office ───────────────────────────────────────────────────────────
// Public — kiosk needs it
router.get('/:id', async (req, res) => {
    try {
        const office = await Office.findById(req.params.id)
            .populate('building', 'name dataId')
            .populate('subOffices', 'name category');
        if (!office) return res.status(404).json({ error: 'Office not found' });
        res.json({ office });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Create Office ────────────────────────────────────────────────────────────
router.post('/', verifyToken, (req, res, next) => {
    uploadOffice.array('images', 10)(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File too large. Maximum size is 10MB per image.' });
            }
            return res.status(500).json({ error: 'Upload error.' });
        }
        next();
    });
}, async (req, res) => {
    try {
        const {
            name, category, head, description,
            email, phone, officeHours,
            personnel, subOffices, building, isVisible
        } = req.body;

        if (!name || !category) {
            return res.status(400).json({ error: 'Name and category are required' });
        }

        const images = req.files ? req.files.map(f => f.path) : [];
        const parsedPersonnel = personnel ? (typeof personnel === 'string' ? JSON.parse(personnel) : personnel) : [];
        const parsedSubOffices = subOffices ? (typeof subOffices === 'string' ? JSON.parse(subOffices) : subOffices) : [];

        const office = await Office.create({
            name,
            category,
            head: head || null,
            description: description || null,
            email: email || null,
            phone: phone || null,
            officeHours: officeHours || null,
            images,
            personnel: parsedPersonnel,
            subOffices: parsedSubOffices,
            building: building || null,
            isVisible: isVisible !== undefined ? isVisible : true
        });

        res.status(201).json({ message: 'Office created successfully', office });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Update Office ────────────────────────────────────────────────────────────
router.patch('/:id', verifyToken, (req, res, next) => {
    uploadOffice.array('images', 10)(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File too large. Maximum size is 10MB per image.' });
            }
            return res.status(500).json({ error: 'Upload error.' });
        }
        next();
    });
}, async (req, res) => {
    try {
        const office = await Office.findById(req.params.id);
        if (!office) return res.status(404).json({ error: 'Office not found' });

        const {
            name, category, head, description,
            email, phone, officeHours,
            personnel, subOffices, building,
            isVisible, removeImages
        } = req.body;

        if (removeImages) {
            const toRemove = typeof removeImages === 'string' ? JSON.parse(removeImages) : removeImages;
            for (const url of toRemove) {
                const publicId = url.split('/').slice(-2).join('/').split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }
            office.images = office.images.filter(img => !toRemove.includes(img));
        }

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(f => f.path);
            office.images = [...office.images, ...newImages];
        }

        if (name !== undefined) office.name = name;
        if (category !== undefined) office.category = category;
        if (head !== undefined) office.head = head || null;
        if (description !== undefined) office.description = description === '' ? null : description;
        if (email !== undefined) office.email = email || null;
        if (phone !== undefined) office.phone = phone || null;
        if (officeHours !== undefined) office.officeHours = officeHours || null;
        if (isVisible !== undefined) office.isVisible = isVisible;
        if (building !== undefined) office.building = building || null;
        if (personnel !== undefined) office.personnel = typeof personnel === 'string' ? JSON.parse(personnel) : personnel;
        if (subOffices !== undefined) office.subOffices = typeof subOffices === 'string' ? JSON.parse(subOffices) : subOffices;

        await office.save();
        res.json({ message: 'Office updated successfully', office });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Delete Office ────────────────────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const office = await Office.findById(req.params.id);
        if (!office) return res.status(404).json({ error: 'Office not found' });

        for (const url of office.images) {
            const publicId = url.split('/').slice(-2).join('/').split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        await Office.updateMany(
            { subOffices: office._id },
            { $pull: { subOffices: office._id } }
        );

        await Office.findByIdAndDelete(req.params.id);
        res.json({ message: 'Office deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;