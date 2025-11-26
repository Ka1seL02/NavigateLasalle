const express = require('express');
const router = express.Router();

const Account = require('../models/Account');
const FRONTEND_URL = process.env.FRONTEND_URL;
const sendEmail = require('../utils/sendEmail');

const crypto = require('crypto');   // Token creation

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password.'
            });
        }

        // Find user
        const user = await Account.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Update last login
        user.lastLogin = Date.now();
        await user.save();

        // Create new session
        req.session.userId = user._id;
        req.session.userName = user.name;
        req.session.userEmail = user.email;
        req.session.userRole = user.role;

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// LOGOUT
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error logging out.'
            });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully.'
        });
    });
});

// CHECK SESSION
router.get('/check-session', (req, res) => {
    if (req.session && req.session.userId) {
        return res.status(200).json({
            success: true,
            isAuthenticated: true,
            user: {
                id: req.session.userId,
                name: req.session.userName,
                email: req.session.userEmail,
                role: req.session.userRole
            }
        });
    }
    return res.status(200).json({
        success: true,
        isAuthenticated: false
    });
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await Account.findOne({ email });

        if (user) {
            const resetToken = crypto.randomBytes(32).toString("hex");
            user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
            user.resetPasswordExpires = Date.now() + 1000 * 60 * 15; // 15 minutes
            await user.save();

            const resetLink = `${FRONTEND_URL}/admin/a_reset_password.html?token=${resetToken}`
            await sendEmail({
                to: email,
                subject: "Password Reset Request",
                templateId: 1,
                params: { RESET_LINK: resetLink, FIRSTNAME: user.name },
            })

            return res.status(200).json({
                success: true,
                message: "Please check you mail for further instruction."
            });
        }
        return res.status(200).json({
            success: true,
            message: "Please check you mail for further instruction."
        });

    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again later."
        });
    }
});

// VERIFY TOKEN 
router.post('/verify-reset-token', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "No token provided."
            });
        }

        // Hash the token to match what's in DB
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        // Find user with this token and check if it's not expired
        const user = await Account.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "This reset link is invalid or has expired."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Token is valid."
        });

    } catch (error) {
        console.error("Verify token error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again later."
        });
    }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required.'
            });
        }

        // Hash the token from URL to match what's in DB
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        // Find user with this token and check if it's not expired
        const user = await Account.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token."
            });
        }

        // Update password
        user.password = newPassword; // Will be hashed by pre-save hook
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password has been reset successfully."
        });

    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again later."
        });
    }
});

module.exports = router;