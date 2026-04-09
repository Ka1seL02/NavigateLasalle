import express from 'express';
import crypto from 'crypto';
import Admin from '../models/Admin.js';
import Invite from '../models/Invite.js';
import { verifyToken } from '../middleware/auth.js';
import { sendInviteEmail } from '../utils/emailService.js';

const router = express.Router();

router.use(verifyToken);

// ─── Get All Admins ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const admins = await Admin.find().select('-password -resetPasswordToken -resetPasswordExpires');
        res.json({ admins });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Invite Admin ─────────────────────────────────────────────────────────────
router.post('/invite', async (req, res) => {
    try {
        if (req.admin.role !== 'superadmin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        // Check if already an admin account
        const existing = await Admin.findOne({ email });
        if (existing) {
            return res.status(409).json({ error: 'An account with that email already exists' });
        }

        // Check if already has a pending unexpired invite
        const existingInvite = await Invite.findOne({ email });
        if (existingInvite) {
            if (existingInvite.inviteTokenExpires > Date.now()) {
                return res.status(409).json({ error: 'An invite has already been sent to that email' });
            }
            // Expired — delete and resend
            await Invite.deleteOne({ email });
        }

        const inviteToken = crypto.randomBytes(32).toString('hex');

        await Invite.create({
            email,
            inviteToken,
            inviteTokenExpires: Date.now() + 24 * 60 * 60 * 1000 // 1 day
        });

        const inviteLink = `${process.env.APP_URL}/admin/register.html?token=${inviteToken}`;
        await sendInviteEmail(email, inviteLink);

        res.json({ message: 'Invite sent successfully' });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Delete Admin ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
    try {
        if (req.admin.role !== 'superadmin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const target = await Admin.findById(req.params.id);
        if (!target) return res.status(404).json({ error: 'Admin not found' });

        if (target.role === 'superadmin') {
            return res.status(403).json({ error: 'Cannot delete a superadmin account' });
        }

        await Admin.findByIdAndDelete(req.params.id);
        res.json({ message: 'Admin deleted successfully' });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;