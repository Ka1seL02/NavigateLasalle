import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['News', 'Announcement', 'Event'],
        required: true
    },
    body: {
        type: String,
        required: true
    },
    images: [
        {
            url: { type: String },
            publicId: { type: String }
        }
    ],
    status: {
        type: String,
        enum: ['Published', 'Scheduled'],
        default: 'Published'
    },
    scheduledAt: {
        type: Date,
        default: null
    },
    publishedAt: {
        type: Date,
        default: null
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    }
}, { timestamps: true });

export default mongoose.model('Post', postSchema);