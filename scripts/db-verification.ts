import { PrismaClient } from '@prisma/client';

async function verifyDatabase() {
  console.log('🔍 Verifying database connectivity...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Found ${userCount} existing users`);
    } catch (_queryError) {
      console.log('ℹ️  No users table yet, which is expected for a fresh database');
    }
    
    // List all available models
    console.log('📋 Available Prisma models:');
    const models = Object.keys(prisma).filter(key => 
      typeof (prisma as any)[key] === 'object' && 
      (prisma as any)[key] !== null &&
      typeof (prisma as any)[key].count === 'function'
    );
    
    models.forEach(model => {
      console.log(`   - ${model}`);
    });
    
    await prisma.$disconnect();
    console.log('✅ Database verification completed');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    await prisma.$disconnect();
  }
}

verifyDatabase();