const express = require('express');
const router = express.Router();
const News = require('../models/News');

// GET latest 5 featured news
router.get('/featured', async (req, res) => {
  try {
    const featuredNews = await News.find({ status: 'posted' })
      .sort({ datePosted: -1 }) 
      .limit(5);

    res.json(featuredNews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;