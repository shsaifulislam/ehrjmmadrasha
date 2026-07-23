import { StorageProvider } from './storage.interface';
import { LocalStorageProvider } from './local.provider';
import { S3StorageProvider } from './s3.provider';
import { CloudinaryStorageProvider } from './cloudinary.provider';
import { logger } from '../../utils/logger';

class StorageFactory {
  private static instance: StorageProvider;

  public static getProvider(): StorageProvider {
    if (!StorageFactory.instance) {
      const providerType = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();

      switch (providerType) {
        case 's3':
          logger.info('[StorageFactory] Using S3StorageProvider');
          StorageFactory.instance = new S3StorageProvider();
          break;
        case 'cloudinary':
          logger.info('[StorageFactory] Using CloudinaryStorageProvider');
          StorageFactory.instance = new CloudinaryStorageProvider();
          break;
        case 'local':
        default:
          logger.info('[StorageFactory] Using LocalStorageProvider (Default)');
          StorageFactory.instance = new LocalStorageProvider();
          break;
      }
    }
    return StorageFactory.instance;
  }
}

export const storageService = StorageFactory.getProvider();
