const express = require('express');
const connectDB = require('./db');
const accountRoutes = require('./routes/api/accounts');
require('dotenv').config();

const app = express();

connectDB();

app.use(express.json());

// Serve API routes
app.use('/api/accounts', accountRoutes);

// Serve static frontend files from public folder
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});