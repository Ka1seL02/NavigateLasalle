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
        },
        icon: {
            type: String,
            default: null
        },
        type: {
            type: String,
            enum: ['rich_text', 'core_value'],
            default: 'rich_text'
        }
    },
    { timestamps: true }
);

export default mongoose.model('CampusInfo', campusInfoSchema);