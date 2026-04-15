import mongoose from 'mongoose';

const buildingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    dataId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['building', 'facility', 'gate', 'landmark', 'parking', 'road'],
        required: true
    },
    description: {
        type: String,
        default: null
    },
    images: {
        type: [String],
        default: []
    },
    isVisible: {
        type: Boolean,
        default: true
    },
    shape: {
        type: {
            type: String,
            enum: ['rect', 'ellipse', 'polygon'],
            required: true
        },
        // rect fields
        x: Number,
        y: Number,
        width: Number,
        height: Number,
        rotate: Number,
        rx: Number,
        ry: Number,
        // ellipse fields
        cx: Number,
        cy: Number,
        // polygon fields
        points: [String]
    }
}, { timestamps: true });

export default mongoose.model('Building', buildingSchema);