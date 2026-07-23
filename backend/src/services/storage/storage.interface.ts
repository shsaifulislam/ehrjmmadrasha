export interface UploadResult {
  url: string;
  key: string;
  provider: 'local' | 's3' | 'cloudinary';
  mimetype: string;
  size: number;
  isPrivate?: boolean;
}

export interface StorageProvider {
  /**
   * Upload a file buffer or Express Multer file
   */
  uploadFile(
    file: { buffer: Buffer; originalname: string; mimetype: string; size?: number },
    folder?: string,
    isPrivate?: boolean
  ): Promise<UploadResult>;

  /**
   * Delete a file by object key or stored URL
   */
  deleteFile(keyOrUrl: string): Promise<boolean>;

  /**
   * Get a temporary signed URL for private document access (NID, Birth Cert)
   */
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
