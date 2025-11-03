require('dotenv').config();

const express = require('express');
const path = require('path');
const connectDB = require('./db');
const faqRoutes = require('./routes/api/faqs');
const accountRoutes = require('./routes/api/accounts');

const app = express();

connectDB();

// Middleware for parsing information to be passed or fetch from DB
app.use(express.json()); // For parsing JSON Data
app.use(express.urlencoded({ extended: true })); // For parsing HTML Data

// Routes
app.use('/api/faqs', faqRoutes);
app.use('/api/accounts', accountRoutes);

// Optional: serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
