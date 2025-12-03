const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const Account = require('../models/Account');
const Invite = require('../models/Invite');
const sendEmail = require('../utils/sendEmail');

const FRONTEND_URL = process.env.FRONTEND_URL;

// MIDDLEWARE TO CHECK IF CURRENT USER IS SUPER-ADMIN
const requireSuperAdmin = (req, res, next) => {
    if (!req.session.userId || req.session.userRole !== 'super-admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Insufficient access.'
        })
    }
    next();
}

// ====================================================
// PUBLIC ROUTES
// No authentication required

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
        const user = await Account.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }
        user.lastLogin = Date.now();
        await user.save();
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
            const now = Date.now();
            // Only generate/send new token if there is no valid token
            if (!user.resetPasswordToken || !user.resetPasswordExpires || user.resetPasswordExpires < now) {
                const resetToken = crypto.randomBytes(32).toString("hex");
                user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
                user.resetPasswordExpires = now + 1000 * 60 * 15; // 15 minutes
                await user.save();

                const resetLink = `${FRONTEND_URL}/admin/a_reset_password.html?token=${resetToken}`;
                await sendEmail({
                    to: email,
                    subject: "Password Reset Request",
                    templateId: 1,
                    params: { RESET_LINK: resetLink, FIRSTNAME: user.name }
                });
            }
        }
        // Always return generic message
        return res.status(200).json({
            success: true,
            message: "If an account exists, a reset link has been sent."
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again later."
        });
    }
});
// VERIFY RESET TOKEN
router.post('/verify-reset-token', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                message: "No token provided."
            });
        }
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
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
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
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
        user.password = newPassword;
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
// VERIFY INVITE TOKEN
router.post('/verify-invite-token', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                message: "No token provided."
            });
        }
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const invite = await Invite.findOne({
            inviteToken: hashedToken,
            status: 'pending',
            inviteExpires: { $gt: Date.now() }
        });
        if (!invite) {
            return res.status(400).json({
                success: false,
                message: "This invitation link is invalid or has expired."
            });
        }
        return res.status(200).json({
            success: true,
            message: "Token is valid.",
            email: invite.email
        });
    } catch (error) {
        console.error("Verify invite token error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again later."
        });
    }
});
// CREATE ACCOUNT FROM INVITE
router.post('/create-from-invite', async (req, res) => {
    try {
        const { token, name, password } = req.body;
        if (!token || !name || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.'
            });
        }
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const invite = await Invite.findOne({
            inviteToken: hashedToken,
            status: 'pending',
            inviteExpires: { $gt: Date.now() }
        });
        if (!invite) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired invitation."
            });
        }
        const existingAccount = await Account.findOne({ email: invite.email });
        if (existingAccount) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }
        const newAccount = await Account.create({
            name,
            email: invite.email,
            password,
            role: 'admin'
        });
        invite.status = 'accepted';
        await invite.save();
        return res.status(201).json({
            success: true,
            message: "Account created successfully. You can now log in."
        });
    } catch (error) {
        console.error("Create account error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again later."
        });
    }
});

// ====================================================
// ROUTES REQUIRING SUPER-ADMIN
// Only accessible by users with the 'super-admin' role

// GET ALL ACCOUNTS FOR DISPLAY
router.get('/', requireSuperAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;
        const query = {
            // Exclude self from display
            _id: { $ne: req.session.userId }
        };
        // Search filter if there is one
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        const total = await Account.countDocuments(query);
        const accounts = await Account.find(query)
            .select('-password -resetPasswordToken -resetPasswordExpires')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.status(200).json({
            success: true,
            accounts,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit
            }
        });
    } catch (error) {
        console.error('Get accounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});
// SEND INVITE TO EMAIL
router.post('/invite', requireSuperAdmin, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required.'
            });
        }
        const existingAccount = await Account.findOne({ email });
        if (existingAccount) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }
        const pendingInvite = await Invite.findOne({
            email,
            status: 'pending',
            inviteExpires: { $gt: Date.now() }
        });
        if (pendingInvite) {
            const expiresIn = Math.ceil((pendingInvite.inviteExpires - Date.now()) / (1000 * 60 * 60 * 24)); // Days
            return res.status(400).json({
                success: false,
                message: `A pending invitation already exists for this email. It will expire in ${expiresIn} day(s).`
            });
        }
        await Invite.deleteMany({
            email,
            status: 'pending',
            inviteExpires: { $lt: Date.now() }
        });
        const { invite, token } = await Invite.createInvite(email, req.session.userId);
        const inviteLink = `${FRONTEND_URL}/admin/a_create_account.html?token=${token}`;
        await sendEmail({
            to: email,
            subject: "Admin Invitation - Navigate La Salle",
            templateId: 3,
            params: {
                RESET_LINK: inviteLink,
                FIRSTNAME: email.split('@')[0]
            }
        });
        res.status(200).json({
            success: true,
            message: 'Invitation sent successfully.'
        });
    } catch (error) {
        console.error('Send invite error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});
// DELETE ACCOUNT(S)
router.delete('/', requireSuperAdmin, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No account IDs provided.'
            });
        }
        // Prevent deleting own account
        if (ids.includes(req.session.userId.toString())) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account.'
            });
        }
        const result = await Account.deleteMany({ _id: { $in: ids } });
        res.status(200).json({
            success: true,
            message: `${result.deletedCount} account(s) deleted successfully.`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Delete accounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});
// ADMIN-INITIATED PASSWORD RESET
router.post('/admin-reset-password', requireSuperAdmin, async (req, res) => {
    try {
        const { accountId } = req.body;
        if (!accountId) {
            return res.status(400).json({
                success: false,
                message: 'Account ID is required'
            });
        }
        const user = await Account.findById(accountId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }
        const now = Date.now();
        // Check if there is already a valid reset token
        if (user.resetPasswordToken && user.resetPasswordExpires && user.resetPasswordExpires > now) {
            const expiresIn = Math.ceil((user.resetPasswordExpires - now) / (1000 * 60)); // in minutes
            return res.status(400).json({
                success: false,
                message: `A password reset link has already been sent. It will expire in ${expiresIn} minute(s).`
            });
        }
        // Generate new reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        user.resetPasswordExpires = now + 1000 * 60 * 15; // 15 minutes
        await user.save();
        // Send email
        const resetLink = `${FRONTEND_URL}/admin/a_reset_password.html?token=${resetToken}`;
        await sendEmail({
            to: user.email,
            subject: "Password Reset Request",
            templateId: 1,
            params: { RESET_LINK: resetLink, FIRSTNAME: user.name }
        });
        return res.status(200).json({
            success: true,
            message: `Password reset link sent to ${user.email}`
        });
    } catch (error) {
        console.error("Admin reset password error:", error);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again later."
        });
    }
});

module.exports = router;