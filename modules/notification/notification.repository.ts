import { injectable } from 'tsyringe';
import { Notification, NotificationType, Prisma } from '@prisma/client';
import { BaseRepository } from '@infrastructure/base.repository.js';

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

@injectable()
export class NotificationRepository extends BaseRepository {
  async create(input: CreateNotificationData): Promise<Notification> {
    return this.db.notification.create({
      data: { ...input, data: input.data as Prisma.InputJsonValue ?? Prisma.JsonNull },
    });
  }

  /** Batch insert — skips duplicate rows if they somehow already exist. */
  async createMany(inputs: CreateNotificationData[]): Promise<void> {
    await this.db.notification.createMany({
      data: inputs.map((n) => ({ ...n, data: n.data as Prisma.InputJsonValue ?? Prisma.JsonNull })),
      skipDuplicates: false,
    });
  }

  async findByUserId(userId: string, cursor?: string, limit: number = 20): Promise<Notification[]> {
    return this.db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // fetch one extra to determine hasMore
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.db.notification.count({ where: { userId, isRead: false } });
  }

  async findById(id: string): Promise<Notification | null> {
    return this.db.notification.findUnique({ where: { id } });
  }

  /** Returns null when the notification doesn't belong to userId (safe ownership check). */
  async markAsRead(id: string, userId: string): Promise<Notification | null> {
    try {
      return await this.db.notification.update({
        where: { id, userId },
        data: { isRead: true },
      });
    } catch {
      return null;
    }
  }

  async markManyAsRead(ids: string[], userId: string): Promise<void> {
    await this.db.notification.updateMany({
      where: { id: { in: ids }, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /** Returns false when the notification doesn't exist or doesn't belong to userId. */
  async delete(id: string, userId: string): Promise<boolean> {
    try {
      await this.db.notification.delete({ where: { id, userId } });
      return true;
    } catch {
      return false;
    }
  }

  async deleteAll(userId: string): Promise<void> {
    await this.db.notification.deleteMany({ where: { userId } });
  }
}
