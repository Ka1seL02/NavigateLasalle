require('dotenv').config();

// Import modules
const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/db.js');

// Import route modules for handling API endpoints
const accountRoutes = require('./routes/accounts.js');
const faqRoutes = require('./routes/faqs.js');
const feedbackRoutes = require('./routes/feedbacks.js');

// App setup
const app = express();
connectDB();

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { 
        secure: false, // false if Local, true if HTTPS is enabled
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // Lifetime of a cookie after inactivity (24 hours)
        sameSite: 'lax'
    }
}));

// Middleware for parsing information to be passed or fetch from DB
app.use(express.json()); // For parsing JSON Data
app.use(express.urlencoded({ extended: true })); // For parsing HTML Data

// Routes
app.use('/api/accounts', accountRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/feedbacks', feedbackRoutes);

// Optional: serve static frontend
app.use(express.static(path.join(__dirname, '../public')));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));