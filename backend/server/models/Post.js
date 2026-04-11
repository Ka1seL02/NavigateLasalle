import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['news', 'announcement', 'event'],
            required: true,
        },
        office: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Office',
            default: null,
        },
        images: {
            type: [String],
            validate: {
                validator: (arr) => arr.length >= 1,
                message: 'At least one image is required.',
            },
        },
    },
    { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);
export default Post;