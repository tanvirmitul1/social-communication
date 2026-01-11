import { PrismaClient } from '@prisma/client';

// Create a single instance of PrismaClient for the application
const prisma = new PrismaClient();

export abstract class BaseRepository {
  protected db = prisma;

  // Expose prisma client for transactions and advanced queries
  get prisma(): PrismaClient {
    return this.db;
  }
}