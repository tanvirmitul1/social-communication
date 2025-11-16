import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../application/app';
import { prisma } from '../../config/prisma';
import { redis } from '../../config/redis';

describe('API Integration Tests', () => {
  let app: any;
  let request: any;
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    app = createApp();
    request = supertest(app);
    
    // Connect to database
    await prisma.$connect();
    
    // Clear test data (defensive approach)
    try {
      // Check if refreshToken model exists before trying to delete
      if (prisma['refreshToken']) {
        await prisma['refreshToken'].deleteMany();
      }
      await prisma.user.deleteMany();
    } catch (error) {
      // If there's an error, it might be because the models don't exist yet
      // This is okay for now, we'll continue with the tests
      console.warn('Warning: Could not clear test data', error);
    }
  });

  afterAll(async () => {
    // Clean up (defensive approach)
    try {
      // Check if refreshToken model exists before trying to delete
      if (prisma['refreshToken']) {
        await prisma['refreshToken'].deleteMany();
      }
      await prisma.user.deleteMany();
    } catch (error) {
      // If there's an error, it might be because the models don't exist yet
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
  });

  describe('Authentication Flow', () => {
    const userData = {
      username: `testuser${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'Password123!',
    };

    it('should register a new user', async () => {
      const response = await request
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.username).toBe(userData.username);
      expect(response.body.data.email).toBe(userData.email);

      testUser = response.body.data;
    });

    it('should login existing user', async () => {
      const response = await request
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      authToken = response.body.data.accessToken;
      testUser = response.body.data.user;
    });

    it('should get user profile with valid token', async () => {
      const response = await request
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.email).toBe(userData.email);
      // Username might not be in the JWT payload, but email should be
    });
  });

  describe('Protected Routes', () => {
    it('should reject requests without valid token', async () => {
      await request
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});