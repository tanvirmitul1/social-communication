import { injectable, inject } from 'tsyringe';
import { User } from '@prisma/client';
import { UserRepository } from '@modules/user/user.repository.js';
import { CacheService } from '@infrastructure/cache.service.js';
import { NotFoundError } from '@common/errors.js';
import { CONSTANTS } from '@common/constants.js';
import { Helpers } from '@common/utils.js';

@injectable()
export class UserService {
  constructor(
    @inject('UserRepository') private userRepository: UserRepository,
    @inject('CacheService') private cacheService: CacheService
  ) {}

  async getUserById(id: string): Promise<User> {
    // Try cache first
    const cacheKey = CONSTANTS.REDIS_KEYS.CACHED_USER(id);
    const cached = await this.cacheService.get<User>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Cache user
    await this.cacheService.setWithExpiry(cacheKey, user, CONSTANTS.CACHE_TTL.USER);

    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const user = await this.userRepository.update(id, data);

    // Invalidate cache
    await this.cacheService.delete(CONSTANTS.REDIS_KEYS.CACHED_USER(id));

    return user;
  }

  async deleteUser(id: string): Promise<User> {
    const user = await this.userRepository.delete(id);

    // Invalidate cache
    await this.cacheService.delete(CONSTANTS.REDIS_KEYS.CACHED_USER(id));

    return user;
  }

  async searchUsers(
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { skip, take } = Helpers.paginate(page, limit);
    const users = await this.userRepository.search(query, skip, take);
    const total = await this.userRepository.count({
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    });

    return { users, total, page, limit };
  }

  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await this.userRepository.updateOnlineStatus(userId, isOnline);

    // Update presence in cache
    const presenceKey = CONSTANTS.REDIS_KEYS.USER_PRESENCE(userId);
    await this.cacheService.setWithExpiry(
      presenceKey,
      { isOnline, lastSeen: new Date() },
      CONSTANTS.CACHE_TTL.PRESENCE
    );
  }

  async getUserPresence(userId: string): Promise<{ isOnline: boolean; lastSeen: Date }> {
    const cacheKey = CONSTANTS.REDIS_KEYS.USER_PRESENCE(userId);
    const cached = await this.cacheService.get<{ isOnline: boolean; lastSeen: Date }>(cacheKey);

    if (cached) {
      return cached;
    }

    const user = await this.getUserById(userId);
    return {
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    };
  }
}
