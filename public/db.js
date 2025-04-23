const mongoose = require('mongoose');

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  }
};

// News Schema
const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  date: { type: Date, default: Date.now },
  tag: { type: String, required: true }
});

const News = mongoose.model('News', newsSchema);

// Get latest news - limited to specified number (default: 5)
const getLatestNews = async (limit = 5) => {
  try {
    const limitNum = Math.max(1, parseInt(limit)); // Ensure limit is at least 1
    
    const news = await News.find()
      .sort({ date: -1 })
      .limit(limitNum);
      
    return news;
  } catch (err) {
    console.error('Error fetching news:', err);
    throw err;
  }
};

module.exports = {
  connectDB,
  News,
  getLatestNews
};