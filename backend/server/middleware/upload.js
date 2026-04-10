import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const createStorage = (folder) => new CloudinaryStorage({
    cloudinary,
    params: {
        folder: `navigate-lasalle/${folder}`,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { quality: 'auto', fetch_format: 'auto' }
        ]
    },
});

const createUpload = (folder) => multer({
    storage: createStorage(folder),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

export const uploadBuilding = createUpload('buildings');
export const uploadOffice = createUpload('offices');
export const uploadNews = createUpload('news');