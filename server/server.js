const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/db.js');

// Routes
const weatherRoutes = require('./routes/weather');
const accountRoutes = require('./routes/accounts.js');
const faqRoutes = require('./routes/faqs.js');
const feedbackRoutes = require('./routes/feedbacks.js');

const app = express();
connectDB();

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { 
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/weather', weatherRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/feedbacks', feedbackRoutes);

// Serve static files from public
app.use(express.static(path.join(__dirname, '../public')));

// Root route → serve u_dashboard.html from public/user
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/user/u_dashboard.html'));
});

// Admin folder static (optional)
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
