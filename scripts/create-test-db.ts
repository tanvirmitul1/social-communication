import { PrismaClient } from '@prisma/client';

// Create a Prisma client with the test database URL
const testDbUrl = 'postgresql://postgres:141532@localhost:5432/postgres?schema=public';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: testDbUrl,
    },
  },
});

async function createTestDatabase() {
  try {
    // Create the test database
    await prisma.$queryRaw`CREATE DATABASE social_communication_test;`;
    console.log('Test database created successfully');
  } catch (error: any) {
    if (error.message && error.message.includes('already exists')) {
      console.log('Test database already exists');
    } else {
      console.error('Error creating test database:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestDatabase();