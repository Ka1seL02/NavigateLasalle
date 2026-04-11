import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
    {
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            trim: true,
            default: null
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

export default mongoose.model('Feedback', feedbackSchema);