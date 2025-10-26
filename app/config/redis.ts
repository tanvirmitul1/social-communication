import Redis from 'ioredis';
import { config } from './env.js';
import { logger } from '@logger/index.js';

class RedisClient {
  private static instance: Redis;

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD || undefined,
        db: config.REDIS_DB,
        retryStrategy: (times: number) => {
          if (times > 3) return null; // Stop retrying after 3 attempts
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });

      RedisClient.instance.on('connect', () => {
        logger.info('Redis client connected');
      });

      RedisClient.instance.on('error', (error) => {
        if (error.code === 'ECONNREFUSED') {
          logger.warn('Redis connection refused - Redis server not available');
        } else {
          logger.error({ error }, 'Redis client error');
        }
      });

      RedisClient.instance.on('close', () => {
        logger.warn('Redis client connection closed');
      });
    }

    return RedisClient.instance;
  }

  public static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit();
    }
  }
}

export const redis = RedisClient.getInstance();

// Handle Redis connection errors gracefully
redis.on('error', () => {
  // Silently handle errors to prevent unhandled rejections
});
