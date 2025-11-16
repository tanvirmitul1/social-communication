import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../application/app';
import { prisma } from '../../config/prisma';
import { redis } from '../../config/redis';

describe('Message Forwarding Integration Tests', () => {
  let app: any;
  let request: any;
  let authToken: string;
  let authToken2: string;
  let testUser: any;
  let testUser2: any;
  let testGroup: any;
  let testMessage: any;

  beforeAll(async () => {
    // Set environment variable to indicate integration test
    process.env.INTEGRATION_TEST = 'true';
    
    app = createApp();
    request = supertest(app);
    
    // Connect to database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await prisma.message.deleteMany();
      await prisma.groupMember.deleteMany();
      await prisma.group.deleteMany();
      await prisma.refreshToken.deleteMany();
      await prisma.user.deleteMany();
    } catch (error) {
      console.warn('Warning: Could not clean up test data', error);
    }
    
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.warn('Warning: Could not disconnect from database', error);
    }
    
    try {
      await redis.quit();
    } catch (error) {
      console.warn('Warning: Could not disconnect from Redis', error);
    }
    
    // Clear environment variable
    delete process.env.INTEGRATION_TEST;
  });

  beforeEach(async () => {
    // Clear messages between tests
    try {
      await prisma.message.deleteMany();
    } catch (_error) {
      // Ignore if table doesn't exist yet
    }
  });

  describe('User Setup', () => {
    it('should register and login users and create group', async () => {
      // Register first user
      const userData1 = {
        username: `testuser1${Date.now()}`,
        email: `test1${Date.now()}@example.com`,
        password: 'Password123!',
      };

      let response = await request
        .post('/api/v1/auth/register')
        .send(userData1)
        .expect(201);

      expect(response.body.success).toBe(true);
      testUser = response.body.data;

      // Login first user
      response = await request
        .post('/api/v1/auth/login')
        .send({
          email: userData1.email,
          password: userData1.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      authToken = response.body.data.accessToken;
      testUser = response.body.data.user;

      // Register second user
      const userData2 = {
        username: `testuser2${Date.now()}`,
        email: `test2${Date.now()}@example.com`,
        password: 'Password123!',
      };

      response = await request
        .post('/api/v1/auth/register')
        .send(userData2)
        .expect(201);

      expect(response.body.success).toBe(true);
      testUser2 = response.body.data;

      // Login second user
      response = await request
        .post('/api/v1/auth/login')
        .send({
          email: userData2.email,
          password: userData2.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      authToken2 = response.body.data.accessToken;
      testUser2 = response.body.data.user;

      // Create a group
      const groupData = {
        title: 'Test Group',
        description: 'A test group for message forwarding',
        type: 'PRIVATE',
      };

      response = await request
        .post('/api/v1/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(groupData.title);
      testGroup = response.body.data;

      // Add second user to group
      const memberData = {
        userId: testUser2.id,
        role: 'MEMBER',
      };

      response = await request
        .post(`/api/v1/groups/${testGroup.id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(memberData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Message Forwarding', () => {
    it('should send a message and test forwarding functionality', async () => {
      // Send a message to another user
      const messageData = {
        content: 'Hello, this is a test message for forwarding!',
        receiverId: testUser2.id,
        type: 'TEXT',
      };

      let response = await request
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(messageData.content);
      expect(response.body.data.receiverId).toBe(testUser2.id);
      testMessage = response.body.data;

      // Forward a message to another user
      const forwardData1 = {
        originalMessageId: testMessage.id,
        receiverId: testUser.id, // Send back to the original sender
      };

      response = await request
        .post(`/api/v1/messages/${testMessage.id}/forward`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(forwardData1)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Message forwarded successfully');
      expect(response.body.data.parentId).toBe(testMessage.id); // Should reference original message
      expect(response.body.data.content).toBe(testMessage.content); // Should have same content
      expect(response.body.data.senderId).toBe(testUser2.id); // Should be sent by the forwarding user
      expect(response.body.data.receiverId).toBe(testUser.id); // Should be sent to the specified user

      // Forward a message to a group
      const forwardData2 = {
        originalMessageId: testMessage.id,
        groupId: testGroup.id,
      };

      response = await request
        .post(`/api/v1/messages/${testMessage.id}/forward`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(forwardData2)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Message forwarded successfully');
      expect(response.body.data.parentId).toBe(testMessage.id); // Should reference original message
      expect(response.body.data.content).toBe(testMessage.content); // Should have same content
      expect(response.body.data.senderId).toBe(testUser2.id); // Should be sent by the forwarding user
      expect(response.body.data.groupId).toBe(testGroup.id); // Should be sent to the specified group

      // Fail to forward a message without target
      const forwardData3 = {
        originalMessageId: testMessage.id,
        // Missing both groupId and receiverId
      };

      response = await request
        .post(`/api/v1/messages/${testMessage.id}/forward`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(forwardData3)
        .expect(400);

      expect(response.body.success).toBe(false);

      // Fail to forward a non-existent message
      const forwardData4 = {
        originalMessageId: '00000000-0000-0000-0000-000000000000',
        receiverId: testUser.id,
      };

      response = await request
        .post(`/api/v1/messages/${forwardData4.originalMessageId}/forward`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(forwardData4)
        .expect(500); // Should fail because original message doesn't exist

      expect(response.body.success).toBe(false);
    });
  });
});