const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const sharp = require('sharp');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max before compression
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, BMP, and TIFF are allowed.'));
    }
  }
});

// Compression helper function
async function compressImage(buffer, originalFormat) {
  let imageBuffer = buffer;
  const fileSizeInMB = imageBuffer.length / (1024 * 1024);

  if (fileSizeInMB > 10) {
    console.log(`Compressing image from ${fileSizeInMB.toFixed(2)}MB to under 10MB`);
    
    const outputFormat = (originalFormat === 'image/gif' || originalFormat === 'image/webp') 
      ? originalFormat.split('/')[1] 
      : 'jpeg';

    let sharpInstance = sharp(imageBuffer);
    
    if (outputFormat === 'jpeg') {
      sharpInstance = sharpInstance.jpeg({ quality: 80, progressive: true });
    } else if (outputFormat === 'png') {
      sharpInstance = sharpInstance.png({ quality: 80, compressionLevel: 9 });
    } else if (outputFormat === 'webp') {
      sharpInstance = sharpInstance.webp({ quality: 80 });
    }

    imageBuffer = await sharpInstance.toBuffer();

    let currentSize = imageBuffer.length / (1024 * 1024);
    let quality = 70;
    
    while (currentSize > 10 && quality > 20) {
      sharpInstance = sharp(buffer);
      
      if (outputFormat === 'jpeg') {
        sharpInstance = sharpInstance.jpeg({ quality: quality, progressive: true });
      } else if (outputFormat === 'png') {
        sharpInstance = sharpInstance.jpeg({ quality: quality, progressive: true });
      } else if (outputFormat === 'webp') {
        sharpInstance = sharpInstance.webp({ quality: quality });
      }

      imageBuffer = await sharpInstance.toBuffer();
      currentSize = imageBuffer.length / (1024 * 1024);
      quality -= 10;
    }

    console.log(`Compressed to ${currentSize.toFixed(2)}MB`);
  }

  return imageBuffer;
}

// ====== NEWS IMAGE UPLOAD ======
router.post('/news-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imageBuffer = await compressImage(req.file.buffer, req.file.mimetype);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'news-upload',
        resource_type: 'image',
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ message: 'Failed to upload image', error: error.message });
        }

        res.status(200).json({
          message: 'Image uploaded successfully',
          imageUrl: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    uploadStream.end(imageBuffer);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error during upload', error: error.message });
  }
});

// ====== LOCATION IMAGE UPLOAD ======
router.post('/location-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imageBuffer = await compressImage(req.file.buffer, req.file.mimetype);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'campus-map',
        resource_type: 'image',
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ message: 'Failed to upload image', error: error.message });
        }

        res.status(200).json({
          message: 'Image uploaded successfully',
          imageUrl: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    uploadStream.end(imageBuffer);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error during upload', error: error.message });
  }
});

// ====== DELETE NEWS IMAGE ======
router.delete('/news-image/:publicId', async (req, res) => {
  try {
    const publicId = req.params.publicId.replace(/_/g, '/');
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      res.status(200).json({ message: 'Image deleted successfully' });
    } else {
      res.status(404).json({ message: 'Image not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Failed to delete image', error: error.message });
  }
});

// ====== DELETE LOCATION IMAGE ======
router.delete('/location-image/:publicId', async (req, res) => {
  try {
    const publicId = req.params.publicId.replace(/_/g, '/');
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      res.status(200).json({ message: 'Image deleted successfully' });
    } else {
      res.status(404).json({ message: 'Image not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Failed to delete image', error: error.message });
  }
});

module.exports = router;