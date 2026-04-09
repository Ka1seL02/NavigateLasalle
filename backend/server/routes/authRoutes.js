import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { verifyToken } from '../middleware/auth.js';
import { sendResetEmail } from '../utils/emailService.js';

const router = express.Router();

// ─── Login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        admin.lastLogin = new Date();
        await admin.save();

        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({
            message: 'Login successful',
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Me (check logged in user) ─────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {

    try {

        const admin = await Admin
            .findById(req.admin.id)
            .select('-password');

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        res.json({ admin });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }

});

// ─── Forgot Password ──────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        // Always return success to prevent email enumeration
        if (!admin) {
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        admin.resetPasswordToken = token;
        admin.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 1 hour
        await admin.save();

        const resetLink = `${process.env.APP_URL}/admin/reset-password.html?token=${token}`;
        await sendResetEmail(email, admin.name, resetLink);

        res.json({ message: 'If that email exists, a reset link has been sent.' });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Verify Reset Token ───────────────────────────────────────────────────────
router.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const admin = await Admin.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!admin) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        res.json({ message: 'Token is valid' });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Reset Password ───────────────────────────────────────────────────────────
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const admin = await Admin.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!admin) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(password, salt);
        admin.resetPasswordToken = null;
        admin.resetPasswordExpires = null;
        await admin.save();

        res.json({ message: 'Password reset successful' });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {

    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'lax'
    });

    res.json({ message: 'Logged out successfully' });

});


export default router;