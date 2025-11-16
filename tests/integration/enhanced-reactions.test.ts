import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../application/app';
import { prisma } from '../../config/prisma';
import { redis } from '../../config/redis';

describe('Enhanced Message Reactions Integration Tests', () => {
  let app: any;
  let request: any;
  let authToken: string;
  let authToken2: string;
  let testUser: any;
  let testUser2: any;
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
      await prisma.messageReaction.deleteMany();
      await prisma.message.deleteMany();
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
    // Clear reactions between tests
    try {
      await prisma.messageReaction.deleteMany();
    } catch (_error) {
      // Ignore if table doesn't exist yet
    }
  });

  describe('User Setup and Message Flow', () => {
    it('should register users, login, and send a message', async () => {
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

      // Send a message
      const messageData = {
        content: 'Hello, this is a test message for reactions!',
        receiverId: testUser2.id,
        type: 'TEXT',
      };

      response = await request
        .post('/api/v1/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(messageData.content);
      expect(response.body.data.receiverId).toBe(testUser2.id);
      testMessage = response.body.data;
    });
  });

  describe('Reaction Functionality', () => {
    it('should test all reaction functionality', async () => {
      // Add a reaction to the message
      let reactionData = {
        emoji: '👍',
      };

      let response = await request
        .post(`/api/v1/messages/${testMessage.id}/react`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(reactionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Reaction added');

      // Get user's reaction to the message
      response = await request
        .get(`/api/v1/messages/${testMessage.id}/reaction`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emoji).toBe('👍');

      // Get all reactions for the message
      response = await request
        .get(`/api/v1/messages/${testMessage.id}/reactions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].emoji).toBe('👍');
      expect(response.body.data[0].count).toBe(1);
      expect(response.body.data[0].users).toContain(testUser.id);

      // Allow second user to add a reaction
      reactionData = {
        emoji: '❤️',
      };

      response = await request
        .post(`/api/v1/messages/${testMessage.id}/react`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(reactionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Reaction added');

      // Show updated reactions after second user reacts
      response = await request
        .get(`/api/v1/messages/${testMessage.id}/reactions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      
      const likeReaction = response.body.data.find((r: any) => r.emoji === '👍');
      const heartReaction = response.body.data.find((r: any) => r.emoji === '❤️');
      
      expect(likeReaction).toBeDefined();
      expect(likeReaction.count).toBe(1);
      expect(likeReaction.users).toContain(testUser.id);
      
      expect(heartReaction).toBeDefined();
      expect(heartReaction.count).toBe(1);
      expect(heartReaction.users).toContain(testUser2.id);

      // Allow user to change their reaction
      // First user changes from 👍 to 😂
      reactionData = {
        emoji: '😂',
      };

      response = await request
        .post(`/api/v1/messages/${testMessage.id}/react`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(reactionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Reaction added');

      // Show updated reactions after user changes reaction
      response = await request
        .get(`/api/v1/messages/${testMessage.id}/reactions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      
      const laughReaction = response.body.data.find((r: any) => r.emoji === '😂');
      const heartReaction2 = response.body.data.find((r: any) => r.emoji === '❤️');
      
      expect(laughReaction).toBeDefined();
      expect(laughReaction.count).toBe(1);
      expect(laughReaction.users).toContain(testUser.id);
      
      expect(heartReaction2).toBeDefined();
      expect(heartReaction2.count).toBe(1);
      expect(heartReaction2.users).toContain(testUser2.id);

      // Allow user to remove their reaction
      reactionData = {
        emoji: '😂',
      };

      response = await request
        .delete(`/api/v1/messages/${testMessage.id}/react`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(reactionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Reaction removed');

      // Show updated reactions after user removes reaction
      response = await request
        .get(`/api/v1/messages/${testMessage.id}/reactions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      
      const heartReaction3 = response.body.data.find((r: any) => r.emoji === '❤️');
      
      expect(heartReaction3).toBeDefined();
      expect(heartReaction3.count).toBe(1);
      expect(heartReaction3.users).toContain(testUser2.id);
    });
  });
});