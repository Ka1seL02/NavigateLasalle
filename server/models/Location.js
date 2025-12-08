const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['academic', 'facility', 'administrative', 'security', 'learning-space', 'chapel', 'parking'],
        lowercase: true
    },
    section: {
        type: String,
        enum: ['east', 'west'],
        lowercase: true
    },
    description: {
        type: String,
        default: ''
    },
    shape: {
        type: {
            type: String,
            required: true,
            enum: ['rect', 'ellipse', 'polygon']
        },
        x: Number,
        y: Number,
        width: Number,
        height: Number,
        rx: Number,
        ry: Number,
        rotate: Number,
        cx: Number,
        cy: Number,
        points: [String]
    },
    images: [{
        imageUrl: {
            type: String,
            required: false
        },
        publicId: {
            type: String,
            required: false
        }
    }],
    offices: [{
        name: String,
        floor: String,
        operating_hours: mongoose.Schema.Types.Mixed,
        contact: {
            phone: String,
            email: String,
            extension: String
        }
    }],
    departments: [{
        name: String,
        floor: String,
        operating_hours: mongoose.Schema.Types.Mixed,
        contact: {
            phone: String,
            email: String,
            extension: String
        }
    }]
}, {
    collection: 'locations'
});

module.exports = mongoose.model('Location', locationSchema);