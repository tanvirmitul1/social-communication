import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '@config/redis.js';
import { config } from '@config/env.js';
import { logger } from '@logger/index.js';

export const createRateLimiter = (options?: {
  windowMs?: number;
  max?: number;
  message?: string;
}) => {
  const rateLimitConfig: any = {
    windowMs: options?.windowMs || config.RATE_LIMIT_WINDOW_MS,
    max: options?.max || config.RATE_LIMIT_MAX_REQUESTS,
    message: options?.message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  };

  // Only use Redis store if Redis is connected
  try {
    if (redis.status === 'ready' || redis.status === 'connecting') {
      rateLimitConfig.store = new RedisStore({
        // @ts-expect-error - ioredis is compatible but types don't match
        sendCommand: (...args: any[]) => redis.call(...args),
        prefix: 'rl:',
      });
    } else {
      logger.warn('Redis not available for rate limiting - using memory store');
    }
  } catch (_error) {
    logger.warn('Failed to setup Redis rate limit store - using memory store');
  }

  return rateLimit(rateLimitConfig);
};

// Predefined rate limiters
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later',
});

export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});

export const messageLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many messages, please slow down',
});
