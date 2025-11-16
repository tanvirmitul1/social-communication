import { PrismaClient } from '@prisma/client';

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Connected to database successfully');
    
    // Test a simple query
    const users = await prisma.user.findMany();
    console.log(`✅ Found ${users.length} users in database`);
    
    await prisma.$disconnect();
    console.log('✅ Disconnected from database');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

testConnection();