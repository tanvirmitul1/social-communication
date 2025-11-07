import { PrismaClient } from '@prisma/client';

// Create a single instance of PrismaClient for the application
const prisma = new PrismaClient();

export { prisma };
