const mongoose = require('mongoose');
const crypto = require('crypto');

const inviteSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        lowercase: true, 
        trim: true 
    },
    inviteToken: { 
        type: String, 
        required: true 
    },
    inviteExpires: { 
        type: Date, 
        required: true 
    },
    invitedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Accounts',
        required: true 
    },
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'expired'], 
        default: 'pending' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Index for automatic cleanup of expired invites
inviteSchema.index({ inviteExpires: 1 }, { expireAfterSeconds: 0 });

// Static method to create invite
inviteSchema.statics.createInvite = async function(email, invitedById) {
    // Check if there's already a pending invite for this email
    await this.deleteMany({ 
        email, 
        status: 'pending',
        inviteExpires: { $lt: Date.now() }
    });

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const invite = await this.create({
        email,
        inviteToken: hashedToken,
        inviteExpires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        invitedBy: invitedById
    });

    return { invite, token };
};

module.exports = mongoose.model('Invites', inviteSchema);