import mongoose from 'mongoose';

const personnelSchema = new mongoose.Schema({
    role: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true }
}, { _id: false });

const officeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true
    },
    head: {
        type: String,
        trim: true,
        default: null
    },
    description: {
        type: String,
        default: null
    },
    email: {
        type: String,
        trim: true,
        default: null
    },
    phone: {
        type: String,
        trim: true,
        default: null
    },
    officeHours: {
        type: String,
        trim: true,
        default: null
    },
    images: {
        type: [String],
        default: []
    },
    personnel: {
        type: [personnelSchema],
        default: []
    },
    subOffices: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Office'
    }],
    building: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Building',
        default: null
    },
    isVisible: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default mongoose.model('Office', officeSchema);