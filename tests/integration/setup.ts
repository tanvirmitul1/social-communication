import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../../config/prisma';
import { redis } from '../../config/redis';

// Set environment to test
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  // Setup test database
  await prisma.$connect();
});

afterAll(async () => {
  // Cleanup
  await prisma.$disconnect();
  await redis.quit();
});