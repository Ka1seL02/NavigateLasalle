import mongoose from 'mongoose';

const campusInfoSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        label: {
            type: String,
            required: true,
            trim: true
        },
        content: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

export default mongoose.model('CampusInfo', campusInfoSchema);