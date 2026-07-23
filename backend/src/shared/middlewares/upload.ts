// backend/src/shared/middlewares/upload.ts

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../../utils/AppError';
import { env } from '../../config/env';

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR || 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    let subfolder = 'general';
    if (file.fieldname === 'attachment' || file.mimetype === 'application/pdf') {
      subfolder = 'notices';
    } else if (file.fieldname === 'image' || file.mimetype.startsWith('image/')) {
      subfolder = 'images';
    } else if (file.fieldname === 'document') {
      subfolder = 'downloads';
    }

    const folderPath = path.join(uploadDir, subfolder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    cb(null, folderPath);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// MIME Type & Signature Filter
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('অনুমোদিত ফাইল ফরম্যাট নয়। শুধুমাত্র PDF, JPG, PNG বা WEBP গ্রহণযোগ্য।', 400));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(env.MAX_FILE_SIZE || '5242880', 10), // 5MB limit
  },
});
