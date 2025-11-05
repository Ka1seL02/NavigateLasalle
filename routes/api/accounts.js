const express = require('express');
const router = express.Router();
const Account = require('../../models/Account');

// Fetching all FAQ items
router.get('/', async (req, res) => {
    try {
        const accounts = await Account.find();
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

module.exports = router;