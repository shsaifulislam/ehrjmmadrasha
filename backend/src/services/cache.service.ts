import { Redis } from 'ioredis';
import { logger } from '../utils/logger';

/**
 * CacheService provides a distributed, Redis-ready caching abstraction.
 * It gracefully degrades if Redis is unavailable, avoiding application crashes.
 */
class CacheService {
  private redisClient: Redis | null = null;
  private isConnected = false;

  constructor() {
    // Only initialize Redis if explicitly configured for production or scaling
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        this.redisClient = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });

        this.redisClient.on('connect', () => {
          this.isConnected = true;
          logger.info('CacheService: Connected to Redis successfully');
        });

        this.redisClient.on('error', (err) => {
          this.isConnected = false;
          logger.warn(`CacheService: Redis connection error - ${err.message}`);
        });
      } catch (error) {
        logger.error('CacheService: Failed to initialize Redis', error);
      }
    } else {
      logger.info('CacheService: REDIS_URL not provided. Running without distributed cache.');
    }
  }

  /**
   * Retrieves a value from the cache.
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.redisClient) return null;

    try {
      const data = await this.redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error(`CacheService: Error reading key ${key}`, error);
      return null; // Fallback to DB
    }
  }

  /**
   * Sets a value in the cache with an optional TTL (in seconds).
   * Default TTL is 1 hour (3600 seconds).
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!this.isConnected || !this.redisClient) return;

    try {
      const stringValue = JSON.stringify(value);
      await this.redisClient.set(key, stringValue, 'EX', ttlSeconds);
    } catch (error) {
      logger.error(`CacheService: Error setting key ${key}`, error);
    }
  }

  /**
   * Deletes a specific key from the cache.
   */
  async delete(key: string): Promise<void> {
    if (!this.isConnected || !this.redisClient) return;

    try {
      await this.redisClient.del(key);
    } catch (error) {
      logger.error(`CacheService: Error deleting key ${key}`, error);
    }
  }

  /**
   * Invalidates multiple keys matching a pattern.
   * NOTE: KEYS command should be used cautiously in production.
   * For production, tracking keys in Sets or using SCAN is preferred.
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.redisClient) return;

    try {
      const stream = this.redisClient.scanStream({
        match: pattern,
        count: 100,
      });

      stream.on('data', async (keys: string[]) => {
        if (keys.length) {
          const pipeline = this.redisClient!.pipeline();
          keys.forEach((key) => pipeline.del(key));
          await pipeline.exec();
        }
      });
    } catch (error) {
      logger.error(`CacheService: Error invalidating pattern ${pattern}`, error);
    }
  }
}

export const cacheService = new CacheService();
