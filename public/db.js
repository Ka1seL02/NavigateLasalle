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
}, {collection: 'news'});

const News = mongoose.model('News', newsSchema);

// FAQ Schema
const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
}, {collection: 'faq'});

const FAQ = mongoose.model('FAQ', faqSchema);

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  rating: { type: Number, required: true },
  feedback: { type: String, required: true },
  date: { type: Date, default: Date.now }
}, {collection: 'feedback'});

const Feedback = mongoose.model('Feedback', feedbackSchema);

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

// Get all FAQs
const getAllFAQs = async () => {
  try {
    const faqs = await FAQ.find();
    return faqs;
  } catch (err) {
    console.error('Error fetching FAQs:', err);
    throw err;
  }
};

// Create Feedback Entry
const createFeedback = async (rating, feedbackText) => {
  try {
    const newFeedback = new Feedback({
      rating,
      feedback: feedbackText
    });

    await newFeedback.save();
  } catch (err) {
    console.error('Error saving feedback:', err);
    throw err;
  }
};

module.exports = {
  connectDB,
  News,
  FAQ,
  getLatestNews,
  getAllFAQs,
  createFeedback
};