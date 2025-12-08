const express = require('express');
const router = express.Router();
const Location = require('../models/Location');

// GET all locations
router.get('/', async (req, res) => {
    try {
        const locations = await Location.find({});
        
        res.json({
            success: true,
            data: locations
        });
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch locations'
        });
    }
});

// POST create new location
router.post('/', async (req, res) => {
    try {
        const location = new Location(req.body);
        await location.save();
        
        res.status(201).json({
            success: true,
            data: location
        });
    } catch (error) {
        console.error('Error creating location:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create location'
        });
    }
});

// PUT update location by code
router.put('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const location = await Location.findOneAndUpdate(
            { code: code.toUpperCase() },
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!location) {
            return res.status(404).json({
                success: false,
                error: 'Location not found'
            });
        }
        
        res.json({
            success: true,
            data: location
        });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update location'
        });
    }
});

// DELETE location by code
router.delete('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const location = await Location.findOneAndDelete({ code: code.toUpperCase() });
        
        if (!location) {
            return res.status(404).json({
                success: false,
                error: 'Location not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Location deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting location:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete location'
        });
    }
});

module.exports = router;