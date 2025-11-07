import 'reflect-metadata';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserService } from '../modules/user/user.service';
import { UserRepository } from '../modules/user/user.repository';
import { CacheService } from '../infrastructure/cache.service';
import { PrismaClient } from '@prisma/client';

describe('User Service', () => {
  let userService: UserService;
  let userRepository: UserRepository;
  let cacheService: CacheService;
  let prisma: PrismaClient;

  beforeEach(() => {
    // Create a new Prisma client for each test
    prisma = new PrismaClient();
    // Directly instantiate the services instead of using the container
    userRepository = new UserRepository();
    cacheService = new CacheService();
    userService = new UserService(userRepository, cacheService);
  });

  afterEach(async () => {
    // Clean up database after each test
    await prisma.user.deleteMany();
    // Disconnect the Prisma client after each test
    await prisma.$disconnect();
  });

  describe('getUserById', () => {
    it('should find a user by ID', async () => {
      // First create a user
      const createdUser = await userRepository.create({
        username: `testuser-${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hashed-password',
      });
      
      // Then find the user
      const foundUser = await userService.getUserById(createdUser.id);
      
      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(createdUser.id);
      expect(foundUser.username).toContain('testuser-');
    });

    it('should throw NotFoundError for non-existent user', async () => {
      await expect(
        userService.getUserById('non-existent-id')
      ).rejects.toThrow(/User not found/);
    });
  });

  describe('searchUsers', () => {
    beforeEach(async () => {
      // Create multiple test users with unique usernames and emails
      await userRepository.create({
        username: `alice-${Date.now()}`,
        email: `alice-${Date.now()}@example.com`,
        passwordHash: 'hashed-password',
      });
      await userRepository.create({
        username: `bob-${Date.now()}`,
        email: `bob-${Date.now()}@example.com`,
        passwordHash: 'hashed-password',
      });
      await userRepository.create({
        username: `charlie-${Date.now()}`,
        email: `charlie-${Date.now()}@example.com`,
        passwordHash: 'hashed-password',
      });
    });

    it('should search users by username', async () => {
      const result = await userService.searchUsers('alice', 1, 10);
      
      expect(result).toBeDefined();
      expect(result.users.length).toBeGreaterThanOrEqual(1);
      expect(result.users[0].username).toContain('alice');
      expect(result.total).toBeGreaterThanOrEqual(1);
    });

    it('should search users by email', async () => {
      const result = await userService.searchUsers('bob-', 1, 10);
      
      expect(result).toBeDefined();
      expect(result.users.length).toBeGreaterThanOrEqual(1);
      expect(result.users[0].email).toContain('bob-');
      expect(result.total).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for no matches', async () => {
      const result = await userService.searchUsers('nonexistent', 1, 10);
      
      expect(result).toBeDefined();
      expect(result.users.length).toBe(0);
      expect(result.total).toBe(0);
    });
  });
});