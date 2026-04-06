import express from 'express';
import crypto from 'crypto';
import Admin from '../models/Admin.js';
import Invite from '../models/Invite.js';

import { sendInviteEmail } from '../utils/emailService.js';
import { inviteLimiter } from '../middleware/rateLimiter.js';
import requireSuperAdmin from '../middleware/requireSuperAdmin.js';

const router = express.Router();

// SEND INVITE
router.post('/send', requireSuperAdmin, inviteLimiter, async (req, res) => {
    const { email } = req.body;

    try {
        // Check if email already exists in admins
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        // Check if a valid invite already exists for this email
        const existingInvite = await Invite.findOne({
            email,
            inviteTokenExpires: { $gt: Date.now() }
        });
        if (existingInvite) {
            return res.status(400).json({ message: 'An invite has already been sent to this email.' });
        }

        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        // Save invite — upsert in case an expired one exists
        await Invite.findOneAndUpdate(
            { email },
            { inviteToken: hashedToken, inviteTokenExpires: new Date(expires) },
            { upsert: true, new: true }
        );

        // Send email
        const inviteLink = `${process.env.FRONTEND_URL}/admin/a_register.html?token=${token}`;
        await sendInviteEmail(email, inviteLink);

        res.json({ message: 'Invite sent successfully.' });

    } catch (error) {
        console.error('Send invite error:', error);
        res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
});

// VERIFY INVITE TOKEN
router.get('/verify', async (req, res) => {
    const { token } = req.query;

    try {
        if (!token) {
            return res.status(400).json({ valid: false });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const invite = await Invite.findOne({
            inviteToken: hashedToken,
            inviteTokenExpires: { $gt: Date.now() }
        });

        if (!invite) {
            return res.status(400).json({ valid: false });
        }

        res.json({ valid: true, email: invite.email });

    } catch (error) {
        console.error('Verify invite token error:', error);
        res.status(500).json({ valid: false });
    }
});

export default router;