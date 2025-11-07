import { vi } from 'vitest';
import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../config/prisma';
import { redis } from '../config/redis';

beforeAll(async () => {
  // Setup test database
  await prisma.$connect();
});

afterAll(async () => {
  // Cleanup
  await prisma.$disconnect();
  await redis.quit();
});

// Mock Prisma client for isolated tests
vi.mock('../config/prisma', () => {
  return {
    prisma: {
      $connect: vi.fn().mockResolvedValue(undefined),
      $disconnect: vi.fn().mockResolvedValue(undefined),
    },
  };
});

// Mock Redis client for isolated tests
vi.mock('../config/redis', () => {
  return {
    redis: {
      quit: vi.fn().mockResolvedValue(undefined),
    },
  };
});

// Mock the cache service for isolated tests
vi.mock('../infrastructure/cache.service', () => {
  return {
    CacheService: vi.fn().mockImplementation(() => ({
      exists: vi.fn().mockResolvedValue(false),
      setWithExpiry: vi.fn().mockResolvedValue(true),
      get: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(1),
    })),
  };
});