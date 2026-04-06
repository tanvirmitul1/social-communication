import { injectable, inject } from 'tsyringe';
import { Notification, NotificationType } from '@prisma/client';
import {
  NotificationRepository,
  CreateNotificationData,
} from './notification.repository.js';
import { CacheService } from '@infrastructure/cache.service.js';
import { SocketService } from '@infrastructure/socket.service.js';
import { CONSTANTS } from '@common/constants.js';
import { NotFoundError } from '@common/errors.js';
import { logger } from '@config/logger.js';

interface NotificationResult {
  notifications: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
  unreadCount: number;
}

@injectable()
export class NotificationService {
  constructor(
    @inject('NotificationRepository') private notificationRepository: NotificationRepository,
    @inject('CacheService') private cacheService: CacheService
  ) {}

  // ============================================================================
  // CREATION  (called by other services — message, friend-request, post, etc.)
  // ============================================================================

  /**
   * Creates a single notification and delivers it in real-time via Socket.IO.
   * Fire-and-forget for socket delivery — never throws on socket errors.
   */
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    const notification = await this.notificationRepository.create(data);

    await this.invalidateCountCache(data.userId);

    // Real-time delivery
    try {
      SocketService.emitToUser(data.userId, CONSTANTS.SOCKET_EVENTS.NOTIFICATION_NEW, notification);
    } catch (err) {
      logger.warn({ err }, 'Failed to emit notification via socket');
    }

    return notification;
  }

  /**
   * Bulk-creates notifications (e.g. fan-out to many users).
   * Unique user caches are invalidated; socket events are fire-and-forget.
   */
  async createBulkNotifications(data: CreateNotificationData[]): Promise<void> {
    if (data.length === 0) return;

    await this.notificationRepository.createMany(data);

    const uniqueUserIds = [...new Set(data.map((d) => d.userId))];
    await Promise.all(uniqueUserIds.map((id) => this.invalidateCountCache(id)));

    // Non-blocking socket fan-out
    for (const item of data) {
      try {
        SocketService.emitToUser(item.userId, CONSTANTS.SOCKET_EVENTS.NOTIFICATION_NEW, {
          type: item.type,
          title: item.title,
          message: item.message,
          data: item.data,
        });
      } catch {
        // continue on individual emit failure
      }
    }
  }

  // ============================================================================
  // RETRIEVAL
  // ============================================================================

  async getNotifications(
    userId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<NotificationResult> {
    const [rawNotifications, unreadCount] = await Promise.all([
      this.notificationRepository.findByUserId(userId, cursor, limit),
      this.getUnreadCount(userId),
    ]);

    const hasMore = rawNotifications.length > limit;
    const notifications = hasMore ? rawNotifications.slice(0, limit) : rawNotifications;
    const nextCursor = hasMore ? notifications[notifications.length - 1].id : null;

    return { notifications, nextCursor, hasMore, unreadCount };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = CONSTANTS.REDIS_KEYS.NOTIFICATION_COUNT(userId);
    const cached = await this.cacheService.get<number>(cacheKey);
    if (cached !== null && cached !== undefined) return cached;

    const count = await this.notificationRepository.countUnread(userId);
    await this.cacheService.setWithExpiry(cacheKey, count, CONSTANTS.CACHE_TTL.NOTIFICATION);
    return count;
  }

  // ============================================================================
  // READ / DELETE
  // ============================================================================

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.markAsRead(id, userId);
    if (!notification) throw new NotFoundError('Notification not found');

    await this.invalidateCountCache(userId);

    SocketService.emitToUser(userId, CONSTANTS.SOCKET_EVENTS.NOTIFICATION_READ, { id });

    return notification;
  }

  async markManyAsRead(ids: string[], userId: string): Promise<void> {
    await this.notificationRepository.markManyAsRead(ids, userId);
    await this.invalidateCountCache(userId);
    SocketService.emitToUser(userId, CONSTANTS.SOCKET_EVENTS.NOTIFICATION_READ, { ids });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
    await this.invalidateCountCache(userId);
    SocketService.emitToUser(userId, CONSTANTS.SOCKET_EVENTS.NOTIFICATION_READ, { all: true });
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    const deleted = await this.notificationRepository.delete(id, userId);
    if (!deleted) throw new NotFoundError('Notification not found');
    await this.invalidateCountCache(userId);
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    await this.notificationRepository.deleteAll(userId);
    await this.invalidateCountCache(userId);
  }

  // ============================================================================
  // HELPER — exposed for other services to send typed notifications
  // ============================================================================

  async notifyUser(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.createNotification({ userId, type, title, message, data });
    } catch (err) {
      // Don't let a failed notification break the main operation
      logger.error({ err }, 'Failed to create notification');
    }
  }

  // ============================================================================
  // PRIVATE
  // ============================================================================

  private async invalidateCountCache(userId: string): Promise<void> {
    await this.cacheService.delete(CONSTANTS.REDIS_KEYS.NOTIFICATION_COUNT(userId));
  }
}
