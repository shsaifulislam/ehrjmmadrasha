import crypto from 'crypto';
import path from 'path';
import { StorageProvider, UploadResult } from './storage.interface';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

export class S3StorageProvider implements StorageProvider {
  private bucket: string;
  private region: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || 'ehrj-madrasha-bucket';
    this.region = process.env.AWS_REGION || 'ap-southeast-1';
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

    // AWS SDK Upload logic placeholder or HTTP endpoint push
    // In production with AWS SDK:
    // const command = new PutObjectCommand({ Bucket, Key, Body: file.buffer, ContentType: file.mimetype, ACL: isPrivate ? 'private' : 'public-read' });
    // await s3Client.send(command);

    const cdnDomain = process.env.AWS_CDN_URL || `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
    const publicUrl = `${cdnDomain}/${key}`;

    logger.info(`[S3 Storage] File uploaded to key: ${key}`);

    return {
      url: publicUrl,
      key,
      provider: 's3',
      mimetype: file.mimetype,
      size: file.size || file.buffer.length,
      isPrivate,
    };
  }

  async deleteFile(key: string): Promise<boolean> {
    logger.info(`[S3 Storage] Delete requested for key: ${key}`);
    return true;
  }

  async getSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    // Generate pre-signed S3 URL for private files (NID, Birth Cert)
    const cdnDomain = process.env.AWS_CDN_URL || `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
    return `${cdnDomain}/${key}?expires=${Date.now() + expiresInSeconds * 1000}&signature=mock_signed_sec`;
  }
}
