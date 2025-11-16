import { prisma } from '../config/prisma';

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to database');
    
    // Try a simple query
    const users = await prisma.user.findMany({ take: 1 });
    console.log('Database query successful, found', users.length, 'users');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

testConnection();