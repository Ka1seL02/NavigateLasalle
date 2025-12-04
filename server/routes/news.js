const express = require('express');
const router = express.Router();
const News = require('../models/News');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to delete images from Cloudinary
async function deleteImagesFromCloudinary(images) {
  if (!images || images.length === 0) return;
  
  const deletePromises = images.map(async (img) => {
    try {
      await cloudinary.uploader.destroy(img.publicId);
      console.log(`Deleted image from Cloudinary: ${img.publicId}`);
    } catch (error) {
      console.error(`Failed to delete image ${img.publicId}:`, error);
      // Continue with other deletions even if one fails
    }
  });
  
  await Promise.all(deletePromises);
}

// GET all news
router.get('/', async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET latest 5 featured news (published only)
router.get('/featured', async (req, res) => {
  try {
    const featuredNews = await News.find({ status: 'published' })
      .sort({ datePosted: -1 }) 
      .limit(5);

    res.json(featuredNews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single news by ID
router.get('/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ message: 'News not found' });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE new news
router.post('/', async (req, res) => {
  try {
    const { title, tag, content, image, author, status, dateScheduled } = req.body;

    if (!title || !tag || !content || !author) {
      return res.status(400).json({ message: 'Title, tag, content, and author are required' });
    }

    const newNews = new News({
      title,
      tag,
      content,
      image: image || [],
      author,
      status: status || 'draft',
      dateScheduled: status === 'scheduled' ? dateScheduled : null,
      datePosted: status === 'published' ? new Date() : null
    });

    await newNews.save();
    res.status(201).json({ message: 'News created successfully', news: newNews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE news
router.patch('/:id', async (req, res) => {
  try {
    const { title, tag, content, image, status, dateScheduled } = req.body;
    
    const updateData = { title, tag, content, image };
    
    if (status) {
      updateData.status = status;
      if (status === 'published') {
        updateData.datePosted = new Date();
        updateData.dateScheduled = null;
      } else if (status === 'scheduled') {
        updateData.dateScheduled = dateScheduled;
        updateData.datePosted = null;
      } else if (status === 'draft') {
        updateData.datePosted = null;
        updateData.dateScheduled = null;
      }
    }

    const updatedNews = await News.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedNews) return res.status(404).json({ message: 'News not found' });
    res.json({ message: 'News updated successfully', news: updatedNews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUBLISH news immediately
router.patch('/:id/publish', async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'published',
        datePosted: new Date(),
        dateScheduled: null
      },
      { new: true }
    );

    if (!news) return res.status(404).json({ message: 'News not found' });
    res.json({ message: 'News published successfully', news });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MOVE to draft
router.patch('/:id/draft', async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'draft',
        datePosted: null,
        dateScheduled: null
      },
      { new: true }
    );

    if (!news) return res.status(404).json({ message: 'News not found' });
    res.json({ message: 'News moved to draft successfully', news });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BULK publish
router.patch('/bulk-publish', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ message: 'No IDs provided' });

    await News.updateMany(
      { _id: { $in: ids } },
      { 
        status: 'published',
        datePosted: new Date(),
        dateScheduled: null
      }
    );
    
    res.json({ message: 'Selected news published successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BULK delete - UPDATED WITH CLOUDINARY CLEANUP
router.delete('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ message: 'No IDs provided' });

    // First, get all news to delete their images from Cloudinary
    const newsToDelete = await News.find({ _id: { $in: ids } });
    
    // Delete all images from Cloudinary
    for (const news of newsToDelete) {
      if (news.image && news.image.length > 0) {
        await deleteImagesFromCloudinary(news.image);
      }
    }

    // Then delete from database
    await News.deleteMany({ _id: { $in: ids } });
    
    res.json({ message: 'Selected news deleted successfully' });
  } catch (err) {
    console.error('Bulk delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE single news - UPDATED WITH CLOUDINARY CLEANUP
router.delete('/:id', async (req, res) => {
  try {
    // First, get the news to delete its images from Cloudinary
    const news = await News.findById(req.params.id);
    
    if (!news) return res.status(404).json({ message: 'News not found' });

    // Delete images from Cloudinary
    if (news.image && news.image.length > 0) {
      await deleteImagesFromCloudinary(news.image);
    }

    // Then delete from database
    await News.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'News deleted successfully' });
  } catch (err) {
    console.error('Delete news error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;