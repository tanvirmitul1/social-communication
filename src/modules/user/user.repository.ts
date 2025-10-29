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
}
