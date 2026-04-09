import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

/**
 * Flexible password update script
 * 
 * Usage:
 * 1. Update all users:
 *    pnpm tsx scripts/update-password-flexible.ts --all
 * 
 * 2. Update specific user by email:
 *    pnpm tsx scripts/update-password-flexible.ts --email admin@socialcomm.com --password "NewPassword123!"
 * 
 * 3. Update specific user by username:
 *    pnpm tsx scripts/update-password-flexible.ts --username alice --password "NewPassword123!"
 * 
 * 4. Update all admins:
 *    pnpm tsx scripts/update-password-flexible.ts --role admin --password "AdminPass123!"
 * 
 * 5. Update all regular users:
 *    pnpm tsx scripts/update-password-flexible.ts --role user --password "UserPass123!"
 */

interface Args {
  all?: boolean;
  email?: string;
  username?: string;
  role?: 'admin' | 'user';
  password?: string;
}

function parseArgs(): Args {
  const args: Args = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const nextArg = argv[i + 1];

    switch (arg) {
      case '--all':
        args.all = true;
        break;
      case '--email':
        args.email = nextArg;
        i++;
        break;
      case '--username':
        args.username = nextArg;
        i++;
        break;
      case '--role':
        args.role = nextArg as 'admin' | 'user';
        i++;
        break;
      case '--password':
        args.password = nextArg;
        i++;
        break;
    }
  }

  return args;
}

async function updatePasswords() {
  const args = parseArgs();

  console.log('🔐 Password Update Script\n');

  // Default passwords
  const MASTER_PASSWORD = 'Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|';
  const REGULAR_PASSWORD = '12345678@Aa';

  try {
    let users;

    // Determine which users to update
    if (args.all) {
      console.log('📊 Updating ALL users...\n');
      users = await prisma.user.findMany({
        select: { id: true, email: true, username: true, role: true },
      });
    } else if (args.email) {
      console.log(`📊 Updating user with email: ${args.email}\n`);
      const user = await prisma.user.findUnique({
        where: { email: args.email },
        select: { id: true, email: true, username: true, role: true },
      });
      users = user ? [user] : [];
    } else if (args.username) {
      console.log(`📊 Updating user with username: ${args.username}\n`);
      const user = await prisma.user.findUnique({
        where: { username: args.username },
        select: { id: true, email: true, username: true, role: true },
      });
      users = user ? [user] : [];
    } else if (args.role) {
      const roleFilter = args.role === 'admin' ? ['ADMIN', 'SUPER_ADMIN'] : ['USER'];
      console.log(`📊 Updating all ${args.role.toUpperCase()} users...\n`);
      users = await prisma.user.findMany({
        where: { role: { in: roleFilter as any } },
        select: { id: true, email: true, username: true, role: true },
      });
    } else {
      console.error('❌ Error: Please specify --all, --email, --username, or --role');
      console.log('\nUsage examples:');
      console.log('  pnpm tsx scripts/update-password-flexible.ts --all');
      console.log('  pnpm tsx scripts/update-password-flexible.ts --email admin@socialcomm.com --password "NewPass123!"');
      console.log('  pnpm tsx scripts/update-password-flexible.ts --username alice --password "NewPass123!"');
      console.log('  pnpm tsx scripts/update-password-flexible.ts --role admin --password "AdminPass123!"');
      process.exit(1);
    }

    if (users.length === 0) {
      console.log('⚠️  No users found matching the criteria');
      process.exit(0);
    }

    console.log(`Found ${users.length} user(s) to update\n`);

    // Update each user
    for (const user of users) {
      const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      
      // Determine password to use
      let password: string;
      if (args.password) {
        password = args.password;
      } else {
        password = isAdmin ? MASTER_PASSWORD : REGULAR_PASSWORD;
      }

      const hashedPassword = await argon2.hash(password);

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword },
      });

      console.log(`✅ Updated: ${user.username} (${user.email}) [${user.role}]`);
      console.log(`   Password: ${password}\n`);
    }

    console.log('✅ Password update completed successfully!');
    console.log(`\n📊 Summary: ${users.length} user(s) updated`);
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updatePasswords();
