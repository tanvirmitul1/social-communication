import { PrismaClient, UserRole } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await argon2.hash('Admin@123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@socialcomm.com' },
    update: {},
    create: {
      email: 'admin@socialcomm.com',
      username: 'admin',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      statusMessage: 'Platform Administrator',
    },
  });

  console.log('✓ Created admin user:', admin.email);

  // Create test users
  const user1Password = await argon2.hash('User@123');
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      username: 'alice',
      passwordHash: user1Password,
      role: UserRole.USER,
      statusMessage: 'Available',
    },
  });

  const user2Password = await argon2.hash('User@123');
  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      username: 'bob',
      passwordHash: user2Password,
      role: UserRole.USER,
      statusMessage: 'Busy',
    },
  });

  console.log('✓ Created test users:', user1.email, user2.email);

  // Create a test group
  const group = await prisma.group.create({
    data: {
      title: 'General',
      description: 'General discussion group',
      type: 'PUBLIC',
      members: {
        create: [
          { userId: admin.id, role: 'OWNER' },
          { userId: user1.id, role: 'MEMBER' },
          { userId: user2.id, role: 'MEMBER' },
        ],
      },
    },
  });

  console.log('✓ Created test group:', group.title);

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
