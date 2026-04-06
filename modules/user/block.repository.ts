import { injectable } from 'tsyringe';
import { BlockedUser } from '@prisma/client';
import { BaseRepository } from '@infrastructure/base.repository.js';

export type BlockedUserWithProfile = BlockedUser & {
  blocked: {
    id: string;
    username: string;
    avatar: string | null;
    statusMessage: string | null;
    isOnline: boolean;
  };
};

@injectable()
export class BlockRepository extends BaseRepository {
  async create(blockerId: string, blockedId: string, reason?: string): Promise<BlockedUser> {
    return this.db.blockedUser.create({
      data: { blockerId, blockedId, reason },
    });
  }

  async delete(blockerId: string, blockedId: string): Promise<boolean> {
    try {
      await this.db.blockedUser.delete({
        where: { blockerId_blockedId: { blockerId, blockedId } },
      });
      return true;
    } catch {
      return false;
    }
  }

  async findOne(blockerId: string, blockedId: string): Promise<BlockedUser | null> {
    return this.db.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
  }

  /** Check if either user has blocked the other (bidirectional). */
  async isBlockedEither(userA: string, userB: string): Promise<boolean> {
    const count = await this.db.blockedUser.count({
      where: {
        OR: [
          { blockerId: userA, blockedId: userB },
          { blockerId: userB, blockedId: userA },
        ],
      },
    });
    return count > 0;
  }

  async findBlockedByUser(
    blockerId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<BlockedUserWithProfile[]> {
    return this.db.blockedUser.findMany({
      where: { blockerId },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            avatar: true,
            statusMessage: true,
            isOnline: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    }) as unknown as BlockedUserWithProfile[];
  }
}
