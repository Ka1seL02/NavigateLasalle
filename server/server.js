const express = require('express');
const session = require('express-session');
const path = require('path');
const cron = require('node-cron');
const connectDB = require('./config/db.js');

// Routes
const weatherRoutes = require('./routes/weather');
const accountRoutes = require('./routes/accounts');
const newsRoutes = require('./routes/news.js');
const uploadRoutes = require('./routes/upload');
const faqRoutes = require('./routes/faqs');
const feedbackRoutes = require('./routes/feedbacks');

// Models
const News = require('./models/News');

const app = express();
connectDB();

// CRON JOB: AUTO-PUBLISH SCHEDULED NEWS //
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    
    const result = await News.updateMany(
      {
        status: 'scheduled',
        dateScheduled: { $lte: now }
      },
      {
        status: 'published',
        datePosted: now,
        dateScheduled: null
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Auto-published ${result.modifiedCount} scheduled news at ${now.toLocaleString()}`);
    }
  } catch (error) {
    console.error('❌ Cron job error:', error);
  }
});

// Run immediately on startup
(async () => {
  try {
    const now = new Date();
    const result = await News.updateMany(
      { status: 'scheduled', dateScheduled: { $lte: now } },
      { status: 'published', datePosted: now, dateScheduled: null }
    );
    if (result.modifiedCount > 0) {
      console.log(`✅ Startup: Auto-published ${result.modifiedCount} scheduled news`);
    }
  } catch (error) {
    console.error('❌ Startup check error:', error);
  }
})();

console.log('📅 News scheduler started - checking every minute');

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
app.use('/api/news', newsRoutes);
app.use('/api/upload', uploadRoutes);
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