require('dotenv').config();

const express = require('express');
const path = require('path');
const connectDB = require('./db');
// Import route modules for handling API endpoints
const accountRoutes = require('./routes/api/accounts');
const feedbackRoutes = require('./routes/api/feedbacks');
const newsRoutes = require('./routes/api/news');
const facilitiesRoutes = require('./routes/api/facilities');
const faqRoutes = require('./routes/api/faqs');

const app = express();

connectDB();

// Middleware for parsing information to be passed or fetch from DB
app.use(express.json()); // For parsing JSON Data
app.use(express.urlencoded({ extended: true })); // For parsing HTML Data

// Routes
app.use('/api/accounts', accountRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/faqs', faqRoutes);

// Optional: serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));