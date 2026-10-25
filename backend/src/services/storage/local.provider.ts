import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { StorageProvider, UploadResult } from './storage.interface';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR || 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private validateFile(file: { originalname: string; mimetype: string; buffer: Buffer }): string {
    const ext = path.extname(file.originalname).toLowerCase();
    const forbiddenExts = ['.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.vbs', '.py', '.pl', '.cgi', '.html', '.htm'];

    if (forbiddenExts.includes(ext)) {
      throw new AppError(`নিরাপত্তা ঝুঁকি: ${ext} এক্সটেনশনের ফাইল আপলোড গ্রহণযোগ্য নয়।`, 400);
    }

    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new AppError('অনুমোদিত ফাইল ফরম্যাট নয়। শুধুমাত্র PDF, JPG, PNG বা WEBP গ্রহণযোগ্য।', 400);
    }

    return ext;
  }

  async uploadFile(
    file: { buffer: Buffer; originalname: string; mimetype: string; size?: number },
    folder: string = 'general',
    isPrivate: boolean = false
  ): Promise<UploadResult> {
    const ext = this.validateFile(file);
    const randomKey = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    const targetFolder = path.join(this.uploadDir, folder);

    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const filePath = path.join(targetFolder, randomKey);
    await fs.promises.writeFile(filePath, file.buffer);

    const relativeKey = `${folder}/${randomKey}`;
    const publicUrl = `/uploads/${relativeKey}`;

    return {
      url: publicUrl,
      key: relativeKey,
      provider: 'local',
      mimetype: file.mimetype,
      size: file.size || file.buffer.length,
      isPrivate,
    };
  }

  async deleteFile(keyOrUrl: string): Promise<boolean> {
    try {
      const cleanKey = keyOrUrl.replace('/uploads/', '').replace(/^\/+/, '');
      const fullPath = path.join(this.uploadDir, cleanKey);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async getSignedUrl(key: string, _expiresInSeconds: number = 3600): Promise<string> {
    // For local storage, returns the URL endpoint
    const cleanKey = key.replace('/uploads/', '').replace(/^\/+/, '');
    return `/uploads/${cleanKey}`;
  }
}
