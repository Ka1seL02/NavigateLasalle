const express = require('express');
const router = express.Router();
const Account = require('../../models/Account');

// Fetching all FAQ items
router.get('/', async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = {};
        // Search Filter
        if (search && search.trim() !== '') {
            query.name = { $regex: search, $options: 'i'};
        }
        // Status filter
        if (status === 'active') query.isActive = true;
        if (status === 'deactivated') query.isActive = false;

        const accounts = await Account.find(query).sort({ si: 1 });
        res.status(200).json(accounts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Inputting/Creating new Account
router.post('/', async (req, res) => {
    try {
        const { 
            name,
            email,
            password,
        } = req.body;

        const newAccount = new Account({
            name,
            email,
            password
        });

        await newAccount.save();
        res.status(201).json({ message: 'Account added successfully', data: newAccount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete User
router.delete('/:si', async (req, res) => {
    try {
        const deletedAccount = await Account.findOneAndDelete({ si: req.params.si });
        if (!deletedAccount) return res.status(404).json({ message: 'Account not found' });
        res.json({ message: 'Account deleted successfully '});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/:si', async (req, res) => {
    try {
        const { action } = req.body;
        const account = await Account.findOne({ si: req.params.si });
        if (!account) return res.status(404).json({ message: 'Account not found' });

        if (action === 'deactivate') {
            account.isActive = !account.isActive;
            await account.save();
            return res.json({
                message: `Account ${account.isActive ? 'activated' : 'deactivated'} successfully`,
                isActive: account.isActive
            });
        }

        if (action === 'reset') {
            account.password = 'admin12345';
            account.markModified('password');
            await account.save();
            return res.json({ message: 'Password reset to default (admin12345)' });
        }

        return res.status(400).json({ message: 'Invalid action specified' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;