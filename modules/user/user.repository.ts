import { injectable } from 'tsyringe';
import { User, Prisma, UserStatus } from '@prisma/client';
import { BaseRepository } from '@infrastructure/base.repository.js';

@injectable()
export class UserRepository extends BaseRepository {
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.db.user.create({ data });
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id, status: { not: UserStatus.DELETED } },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email, status: { not: UserStatus.DELETED } },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { username, status: { not: UserStatus.DELETED } },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.db.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: { status: UserStatus.DELETED },
    });
  }

  async updateOnlineStatus(id: string, isOnline: boolean): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: {
        isOnline,
        lastSeen: new Date(),
      },
    });
  }

  async search(query: string, skip: number, take: number): Promise<User[]> {
    return this.db.user.findMany({
      where: {
        status: { not: UserStatus.DELETED },
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      skip,
      take,
    });
  }

  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return this.db.user.count({ where });
  }

  async countSearchResults(query: string): Promise<number> {
    return this.db.user.count({
      where: {
        status: { not: UserStatus.DELETED },
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
  }

  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.db.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  async findRefreshToken(token: string) {
    return this.db.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.db.refreshToken.update({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getSuggestions(userId: string, limit: number = 8): Promise<User[]> {
    // Get users that:
    // 1. Are not the current user
    // 2. Are not already followed by the current user
    // 3. Have mutual connections (friends of friends) OR are popular users
    // 4. Are active (not deleted)

    // First, get users the current user is already following
    const following = await this.db.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId); // Exclude self

    // Strategy: Get users with most followers (popular users) who are not already followed
    const suggestions = await this.db.user.findMany({
      where: {
        id: { notIn: followingIds },
        status: { not: UserStatus.DELETED },
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        statusMessage: true,
        isOnline: true,
        lastSeen: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            followers: true, // Count followers for ranking
          },
        },
      },
      orderBy: {
        followers: { _count: 'desc' }, // Order by popularity (most followers)
      },
      take: limit * 2, // Get more to filter
    });

    // Return top suggestions (sorted by follower count)
    return suggestions.slice(0, limit).map((user) => {
      const { _count, ...userData } = user;
      return userData as User;
    });
  }

  async getProfilePreview(targetUserId: string, viewerId: string) {
    const user = await this.db.user.findUnique({
      where: { id: targetUserId, status: { not: UserStatus.DELETED } },
      select: {
        id: true,
        username: true,
        avatar: true,
        statusMessage: true,
        isOnline: true,
        lastSeen: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) return null;

    // Check friendship status
    const [friendship, pendingRequest, sentRequest, mutualFriends] = await Promise.all([
      this.db.friendRequest.findFirst({
        where: {
          OR: [
            { senderId: viewerId, receiverId: targetUserId, status: 'ACCEPTED' },
            { senderId: targetUserId, receiverId: viewerId, status: 'ACCEPTED' },
          ],
        },
      }),
      this.db.friendRequest.findFirst({
        where: { senderId: targetUserId, receiverId: viewerId, status: 'PENDING' },
      }),
      this.db.friendRequest.findFirst({
        where: { senderId: viewerId, receiverId: targetUserId, status: 'PENDING' },
      }),
      this.db.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT f2."followingId")::int as count
        FROM "Follow" f1
        INNER JOIN "Follow" f2 ON f1."followingId" = f2."followerId"
        WHERE f1."followerId" = ${viewerId}
        AND f2."followingId" = ${targetUserId}
      `,
    ]);

    return {
      ...user,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      isFriend: !!friendship,
      hasPendingRequest: !!pendingRequest,
      hasSentRequest: !!sentRequest,
      mutualFriendsCount: Number(mutualFriends[0]?.count || 0),
    };
  }
}
