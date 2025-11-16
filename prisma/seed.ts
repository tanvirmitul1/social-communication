import { PrismaClient, UserRole, GroupType, MessageType, MessageStatus, CallType, CallStatus, NotificationType, FriendRequestStatus } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with comprehensive data for all models...');

  // Clear existing data in correct order to avoid foreign key constraints
  console.log('🗑️  Cleaning existing data...');
  await prisma.activityLog.deleteMany();
  await prisma.typingIndicator.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.blockedUser.deleteMany();
  await prisma.callParticipant.deleteMany();
  await prisma.call.deleteMany();
  await prisma.messageReaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.friendRequest.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.device.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('✓ Database cleaned');

  // Create admin user
  console.log('👤 Creating users...');
  const adminPassword = await argon2.hash('Admin@123');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@socialcomm.com',
      username: 'admin',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      statusMessage: 'Platform Administrator',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin',
      isOnline: true,
    },
  });

  // Create test users
  const user1Password = await argon2.hash('User@123');
  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      username: 'alice',
      passwordHash: user1Password,
      role: UserRole.USER,
      statusMessage: 'Available for chat',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Alice',
      isOnline: true,
    },
  });

  const user2Password = await argon2.hash('User@123');
  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      username: 'bob',
      passwordHash: user2Password,
      role: UserRole.USER,
      statusMessage: 'Busy working',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Bob',
      isOnline: false,
    },
  });

  const user3Password = await argon2.hash('User@123');
  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@example.com',
      username: 'charlie',
      passwordHash: user3Password,
      role: UserRole.USER,
      statusMessage: 'On vacation',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Charlie',
      isOnline: true,
    },
  });

  const user4Password = await argon2.hash('User@123');
  const diana = await prisma.user.create({
    data: {
      email: 'diana@example.com',
      username: 'diana',
      passwordHash: user4Password,
      role: UserRole.USER,
      statusMessage: 'In a meeting',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Diana',
      isOnline: false,
    },
  });

  const user5Password = await argon2.hash('User@123');
  const eric = await prisma.user.create({
    data: {
      email: 'eric@example.com',
      username: 'eric',
      passwordHash: user5Password,
      role: UserRole.USER,
      statusMessage: 'Studying',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Eric',
      isOnline: true,
    },
  });

  console.log('✓ Created 6 users');

  // Create devices for users
  console.log('📱 Creating devices...');
  
  await prisma.device.createMany({
    data: [
      {
        userId: alice.id,
        deviceName: 'iPhone 14',
        deviceType: 'mobile',
        deviceToken: 'device-token-1',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      },
      {
        userId: bob.id,
        deviceName: 'MacBook Pro',
        deviceType: 'desktop',
        deviceToken: 'device-token-2',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0_1)',
      },
      {
        userId: charlie.id,
        deviceName: 'Samsung Galaxy',
        deviceType: 'mobile',
        deviceToken: 'device-token-3',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-G991B)',
      },
      {
        userId: diana.id,
        deviceName: 'Windows PC',
        deviceType: 'desktop',
        deviceToken: 'device-token-4',
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    ],
  });

  console.log('✓ Created devices');

  // Create refresh tokens
  console.log('🔑 Creating refresh tokens...');
  
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  await prisma.refreshToken.createMany({
    data: [
      {
        userId: alice.id,
        token: 'refresh-token-alice-1',
        expiresAt: thirtyDaysFromNow,
      },
      {
        userId: bob.id,
        token: 'refresh-token-bob-1',
        expiresAt: thirtyDaysFromNow,
      },
    ],
  });

  console.log('✓ Created refresh tokens');

  // Create friend requests
  console.log('🤝 Creating friend requests...');
  
  await prisma.friendRequest.createMany({
    data: [
      {
        senderId: alice.id,
        receiverId: bob.id,
        status: FriendRequestStatus.ACCEPTED,
      },
      {
        senderId: charlie.id,
        receiverId: alice.id,
        status: FriendRequestStatus.ACCEPTED,
      },
      {
        senderId: diana.id,
        receiverId: bob.id,
        status: FriendRequestStatus.PENDING,
      },
      {
        senderId: eric.id,
        receiverId: admin.id,
        status: FriendRequestStatus.REJECTED,
      },
    ],
  });

  console.log('✓ Created friend requests');

  // Create follows
  console.log('👥 Creating follows...');
  
  await prisma.follow.createMany({
    data: [
      { followerId: alice.id, followingId: bob.id },
      { followerId: bob.id, followingId: alice.id },
      { followerId: alice.id, followingId: charlie.id },
      { followerId: diana.id, followingId: alice.id },
      { followerId: eric.id, followingId: admin.id },
      { followerId: charlie.id, followingId: diana.id },
    ],
  });

  console.log('✓ Created follows');

  // Create blocked users
  console.log('🚫 Creating blocked users...');
  
  await prisma.blockedUser.createMany({
    data: [
      {
        blockerId: alice.id,
        blockedId: eric.id,
        reason: 'Spam messages',
      },
    ],
  });

  console.log('✓ Created blocked users');

  // Create groups
  console.log('👪 Creating groups...');
  const generalGroup = await prisma.group.create({
    data: {
      title: 'General Discussion',
      description: 'General discussion group for all users',
      type: GroupType.PUBLIC,
      cover: 'https://api.dicebear.com/7.x/bottts/svg?seed=General',
      members: {
        create: [
          { userId: admin.id, role: 'OWNER' },
          { userId: alice.id, role: 'ADMIN' },
          { userId: bob.id, role: 'MEMBER' },
          { userId: charlie.id, role: 'MEMBER' },
          { userId: diana.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const techGroup = await prisma.group.create({
    data: {
      title: 'Tech Enthusiasts',
      description: 'Discussion about latest technology trends',
      type: GroupType.PUBLIC,
      cover: 'https://api.dicebear.com/7.x/bottts/svg?seed=Tech',
      members: {
        create: [
          { userId: admin.id, role: 'OWNER' },
          { userId: alice.id, role: 'ADMIN' },
          { userId: bob.id, role: 'ADMIN' },
        ],
      },
    },
  });

  const privateGroup = await prisma.group.create({
    data: {
      title: 'Private Circle',
      description: 'Private group for close friends',
      type: GroupType.PRIVATE,
      cover: 'https://api.dicebear.com/7.x/bottts/svg?seed=Private',
      members: {
        create: [
          { userId: alice.id, role: 'OWNER' },
          { userId: bob.id, role: 'MEMBER' },
          { userId: diana.id, role: 'MEMBER' },
        ],
      },
    },
  });

  console.log('✓ Created 3 groups');

  // Create messages
  console.log('💬 Creating messages...');
  
  // Direct messages between Alice and Bob
  await prisma.message.createMany({
    data: [
      {
        senderId: alice.id,
        receiverId: bob.id,
        content: 'Hey Bob, how are you doing?',
        type: MessageType.TEXT,
        status: MessageStatus.SEEN,
      },
      {
        senderId: bob.id,
        receiverId: alice.id,
        content: 'Hi Alice! I\'m doing great, thanks for asking. How about you?',
        type: MessageType.TEXT,
        status: MessageStatus.SEEN,
      },
      {
        senderId: alice.id,
        receiverId: bob.id,
        content: 'I\'m good too. Working on that project we discussed.',
        type: MessageType.TEXT,
        status: MessageStatus.DELIVERED,
      },
    ],
  });

  // Messages in General group
  await prisma.message.createMany({
    data: [
      {
        senderId: admin.id,
        groupId: generalGroup.id,
        content: 'Welcome everyone to our community! Feel free to introduce yourselves.',
        type: MessageType.TEXT,
        status: MessageStatus.SEEN,
      },
      {
        senderId: alice.id,
        groupId: generalGroup.id,
        content: 'Hello everyone! I\'m Alice, excited to be part of this community.',
        type: MessageType.TEXT,
        status: MessageStatus.SEEN,
      },
      {
        senderId: bob.id,
        groupId: generalGroup.id,
        content: 'Hi all! Bob here. Looking forward to interesting discussions.',
        type: MessageType.TEXT,
        status: MessageStatus.SEEN,
      },
      {
        senderId: charlie.id,
        groupId: generalGroup.id,
        content: 'Greetings from Charlie! Happy to join you all.',
        type: MessageType.TEXT,
        status: MessageStatus.DELIVERED,
      },
    ],
  });

  // Messages in Tech group
  await prisma.message.createMany({
    data: [
      {
        senderId: admin.id,
        groupId: techGroup.id,
        content: 'Let\'s discuss the latest trends in web development!',
        type: MessageType.TEXT,
        status: MessageStatus.SEEN,
      },
      {
        senderId: bob.id,
        groupId: techGroup.id,
        content: 'I\'ve been experimenting with the new React features. They\'re quite impressive!',
        type: MessageType.TEXT,
        status: MessageStatus.SEEN,
      },
      {
        senderId: alice.id,
        groupId: techGroup.id,
        content: 'Yes, the new hooks are really powerful. Has anyone tried the new Next.js app router?',
        type: MessageType.TEXT,
        status: MessageStatus.DELIVERED,
      },
    ],
  });

  // Create a forwarded message
  const originalMessage = await prisma.message.findFirst({
    where: {
      content: 'Welcome everyone to our community! Feel free to introduce yourselves.',
    },
  });

  if (originalMessage) {
    await prisma.message.create({
      data: {
        senderId: diana.id,
        receiverId: eric.id,
        content: originalMessage.content,
        type: originalMessage.type,
        status: MessageStatus.SENT,
        parentId: originalMessage.id, // Reference to original message
      },
    });
  }

  console.log('✓ Created direct and group messages');

  // Create message reactions
  console.log('👍 Creating message reactions...');
  
  // Get some messages to react to
  const messages = await prisma.message.findMany({ take: 5 });
  
  if (messages.length > 0) {
    await prisma.messageReaction.createMany({
      data: [
        {
          messageId: messages[0].id,
          userId: bob.id,
          emoji: '👍',
        },
        {
          messageId: messages[0].id,
          userId: charlie.id,
          emoji: '❤️',
        },
        {
          messageId: messages[1].id,
          userId: alice.id,
          emoji: '😂',
        },
        {
          messageId: messages[2].id,
          userId: admin.id,
          emoji: '🔥',
        },
        {
          messageId: messages[3].id,
          userId: diana.id,
          emoji: '👏',
        },
      ],
    });
  }

  console.log('✓ Created message reactions');

  // Create calls
  console.log('📞 Creating calls...');
  
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);
  
  const fiftyMinutesAgo = new Date();
  fiftyMinutesAgo.setMinutes(fiftyMinutesAgo.getMinutes() - 50);
  
  const twoHoursAgo = new Date();
  twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
  
  await prisma.call.create({
    data: {
      initiatorId: alice.id,
      roomId: 'call-room-1',
      type: CallType.VIDEO,
      status: CallStatus.ENDED,
      startedAt: oneHourAgo,
      endedAt: fiftyMinutesAgo,
      participants: {
        create: [
          { 
            userId: alice.id, 
            joinedAt: oneHourAgo,
          },
          { 
            userId: bob.id, 
            joinedAt: new Date(oneHourAgo.getTime() + 5000),
          },
        ],
      },
    },
  });

  await prisma.call.create({
    data: {
      initiatorId: admin.id,
      roomId: 'call-room-2',
      type: CallType.AUDIO,
      status: CallStatus.MISSED,
      createdAt: twoHoursAgo,
      participants: {
        create: [
          { userId: admin.id },
          { userId: charlie.id },
        ],
      },
    },
  });

  await prisma.call.create({
    data: {
      initiatorId: diana.id,
      groupId: privateGroup.id,
      roomId: 'group-call-room-1',
      type: CallType.VIDEO,
      status: CallStatus.ONGOING,
      startedAt: new Date(),
      participants: {
        create: [
          { 
            userId: diana.id,
            joinedAt: new Date(),
          },
          { 
            userId: alice.id,
            joinedAt: new Date(Date.now() - 30000),
          },
        ],
      },
    },
  });

  console.log('✓ Created calls');

  // Create call participants
  console.log('👥 Creating additional call participants...');
  
  // Get the ongoing call
  const ongoingCall = await prisma.call.findFirst({
    where: {
      status: CallStatus.ONGOING,
    },
  });
  
  if (ongoingCall) {
    await prisma.callParticipant.create({
      data: {
        callId: ongoingCall.id,
        userId: bob.id,
        joinedAt: new Date(Date.now() - 15000),
      },
    });
  }

  console.log('✓ Created call participants');

  // Create notifications
  console.log('🔔 Creating notifications...');
  
  await prisma.notification.createMany({
    data: [
      {
        userId: bob.id,
        type: NotificationType.MESSAGE,
        title: 'New message',
        message: 'Alice sent you a message',
        data: { senderId: alice.id },
      },
      {
        userId: alice.id,
        type: NotificationType.REACTION,
        title: 'New reaction',
        message: 'Bob reacted to your message',
        data: { senderId: bob.id, emoji: '👍' },
      },
      {
        userId: charlie.id,
        type: NotificationType.CALL,
        title: 'Missed call',
        message: 'You missed a call from Admin',
        data: { callerId: admin.id },
      },
      {
        userId: diana.id,
        type: NotificationType.GROUP_INVITE,
        title: 'Group invitation',
        message: 'You were invited to join Private Circle',
        data: { groupId: privateGroup.id },
      },
      {
        userId: admin.id,
        type: NotificationType.SYSTEM,
        title: 'Welcome!',
        message: 'Welcome to SocialComm! Get started by joining some groups.',
        data: {},
      },
    ],
  });

  console.log('✓ Created notifications');

  // Create reports
  console.log('🚩 Creating reports...');
  
  await prisma.report.createMany({
    data: [
      {
        reporterId: alice.id,
        reportedId: eric.id,
        reason: 'Inappropriate content in messages',
        status: 'PENDING',
      },
    ],
  });

  console.log('✓ Created reports');

  // Create activity logs
  console.log('📝 Creating activity logs...');
  
  await prisma.activityLog.createMany({
    data: [
      {
        userId: alice.id,
        action: 'SEND_MESSAGE',
        resource: 'message',
        details: { groupId: generalGroup.id },
        ipAddress: '192.168.1.100',
      },
      {
        userId: bob.id,
        action: 'JOIN_GROUP',
        resource: 'group',
        details: { groupId: techGroup.id },
        ipAddress: '192.168.1.101',
      },
      {
        userId: admin.id,
        action: 'CREATE_GROUP',
        resource: 'group',
        details: { groupId: generalGroup.id },
        ipAddress: '192.168.1.100',
      },
      {
        userId: charlie.id,
        action: 'ADD_REACTION',
        resource: 'message',
        details: { messageId: messages[0]?.id || '' },
        ipAddress: '192.168.1.102',
      },
    ],
  });

  console.log('✓ Created activity logs');

  // Create typing indicators
  console.log('⌨️ Creating typing indicators...');
  
  const fiveMinutesAgo = new Date();
  fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
  
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);
  
  await prisma.typingIndicator.createMany({
    data: [
      {
        userId: alice.id,
        groupId: generalGroup.id,
        createdAt: fiveMinutesAgo,
        expiresAt: expiresAt,
      },
    ],
  });

  console.log('✓ Created typing indicators');

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n👥 Users created: 6');
  console.log('📱 Devices created: 4');
  console.log('🔑 Refresh tokens created: 2');
  console.log('🤝 Friend requests created: 4');
  console.log('👥 Follows created: 6');
  console.log('🚫 Blocked users created: 1');
  console.log('👪 Groups created: 3');
  console.log('💬 Messages created: 10+');
  console.log('👍 Message reactions created: 5');
  console.log('📞 Calls created: 3');
  console.log('👥 Call participants created: 5');
  console.log('🔔 Notifications created: 5');
  console.log('🚩 Reports created: 1');
  console.log('📝 Activity logs created: 4');
  console.log('⌨️ Typing indicators created: 1');
  
  console.log('\n📊 Data verification:');
  const userCount = await prisma.user.count();
  const groupCount = await prisma.group.count();
  const messageCount = await prisma.message.count();
  const callCount = await prisma.call.count();
  console.log(`   - Users: ${userCount}`);
  console.log(`   - Groups: ${groupCount}`);
  console.log(`   - Messages: ${messageCount}`);
  console.log(`   - Calls: ${callCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });