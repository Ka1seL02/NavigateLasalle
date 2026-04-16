import './config/env.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import connectDB from './config/db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { verifyToken } from './middleware/auth.js';

// Virtual Tour routes
import scenesRoutes from './routes/scenes.js';
import settingsRoutes from './routes/settings.js';

// Main project routes
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import buildingRoutes from './routes/buildingRoutes.js';
import mapGraphRoutes from './routes/mapGraphRoutes.js';
import officeRoutes from './routes/officeRoutes.js';
import campusInfoRoutes from './routes/campusInfoRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

connectDB();

const app = express();

// ── CORS ──
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));

// ── Middleware ──
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── API Routes ──
app.use('/api/scenes', scenesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/mapgraph', mapGraphRoutes);
app.use('/api/offices', officeRoutes);
app.use('/api/campus-info', campusInfoRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/weather', weatherRoutes);

// ── Bundled VT (production — serve dist/ if it exists) ──
const distPath = join(__dirname, '../../dist');
if (existsSync(distPath)) {
  app.use('/user/virtual-tour.html', express.static(join(distPath, 'user/virtual-tour.html')));
  app.use('/assets', express.static(join(distPath, 'assets')));
}

// ── Static Files ──
app.use('/admin/pages', verifyToken, express.static(join(__dirname, '../../frontend/admin/pages')));
app.use(express.static(join(__dirname, '../../frontend')));

// ── Root Route ──
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../../frontend/user/home.html'));
});

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start Server ──
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));