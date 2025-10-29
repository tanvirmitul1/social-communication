import { injectable } from 'tsyringe';
import { redis } from '@config/redis.js';
import { logger } from '@config/logger.js';

@injectable()
export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error({ error, key }, 'Cache get error');
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      logger.error({ error, key }, 'Cache set error');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error({ error, key }, 'Cache delete error');
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error({ error, pattern }, 'Cache delete pattern error');
    }
  }

  async setWithExpiry(key: string, value: unknown, seconds: number): Promise<void> {
    await this.set(key, value, seconds);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error({ error, key }, 'Cache exists error');
      return false;
    }
  }

  async increment(key: string): Promise<number> {
    try {
      return await redis.incr(key);
    } catch (error) {
      logger.error({ error, key }, 'Cache increment error');
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await redis.expire(key, seconds);
    } catch (error) {
      logger.error({ error, key, seconds }, 'Cache expire error');
    }
  }
}
