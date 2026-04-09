import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

/**
 * Update all user passwords
 * 
 * Usage:
 * - Development: pnpm tsx scripts/update-passwords.ts
 * - Production: NODE_ENV=production pnpm tsx scripts/update-passwords.ts
 */

async function updatePasswords() {
  console.log('🔐 Starting password update...\n');

  // Use master password for ALL users
  const MASTER_PASSWORD = 'Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|';

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    console.log(`📊 Found ${users.length} users to update\n`);

    // Update each user with master password
    for (const user of users) {
      const hashedPassword = await argon2.hash(MASTER_PASSWORD);

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword },
      });

      console.log(`✅ Updated: ${user.username} (${user.email}) [${user.role}]`);
    }

    console.log('\n✅ Password update completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Total users updated: ${users.length}`);
    console.log(`   - Password for ALL users: ${MASTER_PASSWORD}`);

    console.log('\n🔑 Login credentials:');
    users.forEach((u) => {
      console.log(`   - ${u.email} / ${MASTER_PASSWORD}`);
    });
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updatePasswords();
