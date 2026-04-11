import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Admin from '../models/Admin.js';
import Invite from '../models/Invite.js';
import { verifyToken } from '../middleware/auth.js';
import { sendInviteEmail, sendEmailChangeCode } from '../utils/emailService.js';

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

        const existing = await Admin.findOne({ email });
        if (existing) {
            return res.status(409).json({ error: 'An account with that email already exists' });
        }

        const existingInvite = await Invite.findOne({ email });
        if (existingInvite) {
            if (existingInvite.inviteTokenExpires > Date.now()) {
                return res.status(409).json({ error: 'An invite has already been sent to that email' });
            }
            await Invite.deleteOne({ email });
        }

        const inviteToken = crypto.randomBytes(32).toString('hex');

        await Invite.create({
            email,
            inviteToken,
            inviteTokenExpires: Date.now() + 24 * 60 * 60 * 1000
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

// ─── Update Own Profile (name only) ──────────────────────────────────────────
router.patch('/me', async (req, res) => {
    try {
        const { name } = req.body;
        const admin = await Admin.findById(req.admin.id);
        if (!admin) return res.status(404).json({ error: 'Admin not found' });

        if (name) admin.name = name;
        await admin.save();

        res.json({
            message: 'Profile updated successfully.',
            admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Request Email Change ─────────────────────────────────────────────────────
router.post('/me/email-change', async (req, res) => {
    try {
        const { newEmail } = req.body;
        if (!newEmail) return res.status(400).json({ error: 'New email is required.' });

        const admin = await Admin.findById(req.admin.id);
        if (!admin) return res.status(404).json({ error: 'Admin not found.' });

        if (newEmail === admin.email) {
            return res.status(400).json({ error: 'New email must be different from current email.' });
        }

        const existing = await Admin.findOne({ email: newEmail });
        if (existing) return res.status(409).json({ error: 'Email already in use.' });

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const EXPIRES_IN = 3;

        admin.emailChangeCode = code;
        admin.emailChangeExpires = Date.now() + EXPIRES_IN * 60 * 1000;
        admin.emailChangePending = newEmail;
        await admin.save();

        await sendEmailChangeCode(admin.email, admin.name, code, EXPIRES_IN);

        res.json({ message: 'Verification code sent to your current email.' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Verify Email Change Code ─────────────────────────────────────────────────
router.patch('/me/email-change/verify', async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'Code is required.' });

        const admin = await Admin.findById(req.admin.id);
        if (!admin) return res.status(404).json({ error: 'Admin not found.' });

        if (!admin.emailChangeCode || !admin.emailChangePending) {
            return res.status(400).json({ error: 'No email change request found.' });
        }

        if (Date.now() > admin.emailChangeExpires) {
            admin.emailChangeCode = null;
            admin.emailChangeExpires = null;
            admin.emailChangePending = null;
            await admin.save();
            return res.status(400).json({ error: 'Code has expired. Please try again.' });
        }

        if (admin.emailChangeCode !== code) {
            return res.status(400).json({ error: 'Incorrect code.' });
        }

        admin.email = admin.emailChangePending;
        admin.emailChangeCode = null;
        admin.emailChangeExpires = null;
        admin.emailChangePending = null;
        await admin.save();

        res.json({ message: 'Email updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Change Own Password ──────────────────────────────────────────────────────
router.patch('/me/password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required.' });
        }

        const admin = await Admin.findById(req.admin.id);
        if (!admin) return res.status(404).json({ error: 'Admin not found' });

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect.' });

        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(newPassword, salt);
        await admin.save();

        res.json({ message: 'Password changed successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;