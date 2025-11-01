import { beforeAll, afterAll } from 'vitest';
import { prisma } from '@config/database.js';
import { redis } from '@config/redis.js';

beforeAll(async () => {
  // Setup test database
  await prisma.$connect();
});

afterAll(async () => {
  // Cleanup
  await prisma.$disconnect();
  await redis.quit();
});
