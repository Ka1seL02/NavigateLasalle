import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Resolve backend/.env from backend/server/config/env.js
const filename = fileURLToPath(import.meta.url);
const __dirname = dirname(filename);
dotenv.config({ path: join(__dirname, '../../.env') });