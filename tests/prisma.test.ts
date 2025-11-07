import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { PrismaClient } from '@prisma/client';

describe('Prisma Client', () => {
  it('should be defined', () => {
    const prisma = new PrismaClient();
    expect(prisma).toBeDefined();
    expect(prisma.user).toBeDefined();
  });
});