// routes/api/accounts.js
const express = require('express');
const router = express.Router();
const Account = require('../../models/Account');

// GET all accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find().sort({ si: 1 });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single account
router.get('/:id', async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create account
router.post('/', async (req, res) => {
  try {
    const lastAccount = await Account.findOne().sort({ si: -1 });
    const nextSI = lastAccount ? lastAccount.si + 1 : 1;

    const account = new Account({
      si: nextSI,
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      status: 'active'
    });

    await account.save();
    res.status(201).json(account);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update account
router.put('/:id', async (req, res) => {
  try {
    const account = await Account.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE account
router.delete('/:id', async (req, res) => {
  try {
    const account = await Account.findByIdAndDelete(req.params.id);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH reset password
router.patch('/:id/reset', async (req, res) => {
  try {
    const account = await Account.findByIdAndUpdate(
      req.params.id,
      { password: '123456' }, // default password
      { new: true }
    );
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH deactivate/activate account
router.patch('/:id/status', async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    
    account.status = account.status === 'active' ? 'deactivated' : 'active';
    await account.save();
    
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;