import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../app/config/database';
import { redis } from '../app/config/redis';

beforeAll(async () => {
  // Setup test database
  await prisma.$connect();
});

afterAll(async () => {
  // Cleanup
  await prisma.$disconnect();
  await redis.quit();
});
