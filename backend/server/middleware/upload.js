import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const createStorage = (folder) => new CloudinaryStorage({
    cloudinary,
    params: {
        folder: `navigate-lasalle/${folder}`,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
});

export const uploadBuilding = multer({ storage: createStorage('buildings') });
export const uploadOffice = multer({ storage: createStorage('offices') });
export const uploadNews = multer({ storage: createStorage('news') });