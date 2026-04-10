import './config/env.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { verifyToken } from './middleware/auth.js';

import authRoutes from './routes/authRoutes.js';
import buildingRoutes from './routes/buildingRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import faqRoutes from './routes/faqRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

connectDB();

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Protected Admin Pages ────────────────────────────────────────────────────
app.use('/admin/pages', verifyToken, express.static(join(__dirname, '../../frontend/admin/pages')));

// ─── Static Files ──────────────────────────────────────────────────────────────
app.use(express.static(join(__dirname, '../../frontend')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/faq', faqRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});