import { vi } from 'vitest';
import { beforeAll, afterAll } from 'vitest';

// Only mock in unit tests, not integration tests
if (process.env.NODE_ENV !== 'test' || !process.env.INTEGRATION_TEST) {
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
}

beforeAll(async () => {
  // Setup will be handled by individual test files
});

afterAll(async () => {
  // Cleanup will be handled by individual test files
});