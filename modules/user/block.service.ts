import { injectable, inject } from 'tsyringe';
import { BlockedUser } from '@prisma/client';
import { BlockRepository, BlockedUserWithProfile } from './block.repository.js';
import { CacheService } from '@infrastructure/cache.service.js';
import { CONSTANTS } from '@common/constants.js';
import { ConflictError, NotFoundError, ForbiddenError } from '@common/errors.js';

interface BlockListResult {
  blocked: BlockedUserWithProfile[];
  nextCursor: string | null;
  hasMore: boolean;
}

@injectable()
export class BlockService {
  constructor(
    @inject('BlockRepository') private blockRepository: BlockRepository,
    @inject('CacheService') private cacheService: CacheService
  ) {}

  async blockUser(blockerId: string, blockedId: string, reason?: string): Promise<BlockedUser> {
    if (blockerId === blockedId) {
      throw new ForbiddenError('You cannot block yourself');
    }

    const existing = await this.blockRepository.findOne(blockerId, blockedId);
    if (existing) {
      throw new ConflictError('User is already blocked');
    }

    const block = await this.blockRepository.create(blockerId, blockedId, reason);

    // Invalidate cache for both users
    await this.invalidateCache(blockerId);

    return block;
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const deleted = await this.blockRepository.delete(blockerId, blockedId);
    if (!deleted) {
      throw new NotFoundError('Block relationship not found');
    }
    await this.invalidateCache(blockerId);
  }

  async getBlockedUsers(
    userId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<BlockListResult> {
    const rows = await this.blockRepository.findBlockedByUser(userId, cursor, limit);

    const hasMore = rows.length > limit;
    const blocked = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? blocked[blocked.length - 1].id : null;

    return { blocked, nextCursor, hasMore };
  }

  /**
   * Fast check used by other services (messaging, friend-requests, etc.).
   * Checks bidirectionally: if A blocked B OR B blocked A → returns true.
   * Result is cached for 5 minutes.
   */
  async isBlocked(userA: string, userB: string): Promise<boolean> {
    // Sort IDs for a consistent cache key regardless of call order
    const [a, b] = [userA, userB].sort();
    const cacheKey = `${CONSTANTS.REDIS_KEYS.BLOCKED_USERS(a)}:${b}`;

    const cached = await this.cacheService.get<boolean>(cacheKey);
    if (cached !== null && cached !== undefined) return cached;

    const blocked = await this.blockRepository.isBlockedEither(userA, userB);
    await this.cacheService.setWithExpiry(cacheKey, blocked, CONSTANTS.CACHE_TTL.BLOCKED_USERS);

    return blocked;
  }

  private async invalidateCache(userId: string): Promise<void> {
    await this.cacheService.delete(CONSTANTS.REDIS_KEYS.BLOCKED_USERS(userId));
  }
}
