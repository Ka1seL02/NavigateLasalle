const express = require('express');
const router = express.Router();
const { getLatestNews } = require('../../db');

// GET /api/news
router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit || 5;
    const news = await getLatestNews(limit);
    res.json(news);
  } catch (err) {
    console.error('Error in news route:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;