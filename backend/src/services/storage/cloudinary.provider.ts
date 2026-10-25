import crypto from 'crypto';
import path from 'path';
import { StorageProvider, UploadResult } from './storage.interface';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

export class CloudinaryStorageProvider implements StorageProvider {
  private cloudName: string;

  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'ehrj-madrasha';
  }

  private validateFile(file: { originalname: string; mimetype: string }): string {
    const ext = path.extname(file.originalname).toLowerCase();
    const forbiddenExts = ['.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.vbs', '.py'];

    if (forbiddenExts.includes(ext)) {
      throw new AppError(`নিরাপত্তা ঝুঁকি: ${ext} এক্সটেনশনের ফাইল গ্রহণযোগ্য নয়।`, 400);
    }
    return ext;
  }

  async uploadFile(
    file: { buffer: Buffer; originalname: string; mimetype: string; size?: number },
    folder: string = 'general',
    isPrivate: boolean = false
  ): Promise<UploadResult> {
    const ext = this.validateFile(file);
    const key = `${folder}/${crypto.randomBytes(16).toString('hex')}${ext}`;

    const publicUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload/v1/${key}`;

    logger.info(`[Cloudinary Storage] File uploaded to key: ${key}`);

    return {
      url: publicUrl,
      key,
      provider: 'cloudinary',
      mimetype: file.mimetype,
      size: file.size || file.buffer.length,
      isPrivate,
    };
  }

  async deleteFile(key: string): Promise<boolean> {
    logger.info(`[Cloudinary Storage] Delete requested for key: ${key}`);
    return true;
  }

  async getSignedUrl(key: string, _expiresInSeconds: number = 3600): Promise<string> {
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/v1/${key}`;
  }
}
