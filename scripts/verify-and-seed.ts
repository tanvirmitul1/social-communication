import { PrismaClient } from '@prisma/client';

async function verifyAndSeed() {
  console.log('🔍 Verifying database connectivity...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} existing users`);
    
    // Run the seed function directly
    console.log('🌱 Running seeder...');
    await import('../prisma/seed');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

verifyAndSeed();