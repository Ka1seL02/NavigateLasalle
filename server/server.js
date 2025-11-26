require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/db.js');

// Import route modules for handling API endpoints
const accountRoutes = require('./routes/accounts.js')

const app = express();
connectDB();

// Session configuration
app.use(session({
    secret: 'process.env.SESSION_SECRET',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Middleware for parsing information to be passed or fetch from DB
app.use(express.json()); // For parsing JSON Data
app.use(express.urlencoded({ extended: true })); // For parsing HTML Data

// Routes
app.use('/api/accounts', accountRoutes);

// Optional: serve static frontend
app.use(express.static(path.join(__dirname, '../public')));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));