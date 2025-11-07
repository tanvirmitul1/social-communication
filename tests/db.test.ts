import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

describe('Database Connection', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to the database', async () => {
    await expect(prisma.$connect()).resolves.not.toThrow();
  });

  it('should be able to query the database', async () => {
    // Try a simple query
    const users = await prisma.user.findMany();
    expect(users).toBeDefined();
  });
});