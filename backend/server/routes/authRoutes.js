import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import { sendResetEmail } from '../utils/emailService.js';

const router = express.Router();

// LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: admin._id },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        admin.lastLogin = new Date();
        await admin.save();

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.json({ message: 'Login successful.' });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
});

// FORGOT PASSWORD REQUEST
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (admin) {
            const tokenStillValid = admin.resetPasswordToken && admin.resetPasswordExpires > Date.now();

            if (!tokenStillValid) {
                const token = crypto.randomBytes(32).toString('hex');
                const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
                const expires = Date.now() + 15 * 60 * 1000; // 15 mins before token expires

                admin.resetPasswordToken = hashedToken;
                admin.resetPasswordExpires = new Date(expires);
                await admin.save();

                const resetLink = `${process.env.FRONTEND_URL}/admin/a_reset-password.html?token=${token}`;
                await sendResetEmail(admin.email, admin.name, resetLink);
            }
        } else {
            // Timing attack prevention
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        res.json({
            message: 'If an account with that email exists, a password reset link has been sent.'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
});

// VERIFY RESET TOKEN VALIDITY
router.get('/verify-reset-token', async (req, res) => {
    const { token } = req.query;

    try {
        if (!token) {
            return res.status(400).json({ valid: false });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const admin = await Admin.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!admin) {
            return res.status(400).json({ valid: false });
        }

        res.json({ valid: true });

    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({ valid: false });
    }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        // Hash the incoming token to compare with DB
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const admin = await Admin.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!admin) {
            return res.status(400).json({ message: 'Invalid or expired reset token.' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        admin.password = hashedPassword;
        admin.resetPasswordToken = null;
        admin.resetPasswordExpires = null;
        await admin.save();

        res.json({ message: 'Password has been reset successfully.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
});

// AUTHENTICATE USER
router.get('/me', async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'Not authenticated.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id).select('-password -resetPasswordToken -resetPasswordExpires');

        if (!admin) {
            return res.status(401).json({ message: 'Not authenticated.' });
        }

        res.json({
            name: admin.name,
            email: admin.email,
            role: admin.role
        });

    } catch (error) {
        res.status(401).json({ message: 'Not authenticated.' });
    }
});

// LOGOUT
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.json({ message: 'Logged out successfully.' });
});

export default router;