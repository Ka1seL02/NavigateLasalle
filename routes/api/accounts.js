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

module.exports = router;