const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load env variables

// Import database functionality
const { connectDB } = require('./public/db');

const app = express();
const port = process.env.PORT || 3000; // fallback if PORT is not set

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Connect to database
connectDB();

// API Routes - now correctly referencing the path inside public folder
app.use('/api/news', require('./public/routes/api/news'));

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});