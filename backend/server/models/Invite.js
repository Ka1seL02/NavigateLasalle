import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    inviteToken: {
        type: String,
        required: true
    },
    inviteTokenExpires: {
        type: Date,
        required: true
    }
}, { timestamps: true });

export default mongoose.model('Invite', inviteSchema);