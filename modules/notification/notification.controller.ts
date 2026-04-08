import { injectable, inject } from 'tsyringe';
import { Response } from 'express';
import { NotificationService } from './notification.service.js';
import { ResponseHandler } from '@common/utils.js';
import { AuthRequest } from '@middlewares/auth-guard.js';

@injectable()
export class NotificationController {
  constructor(
    @inject('NotificationService') private notificationService: NotificationService
  ) {
    this.getNotifications = this.getNotifications.bind(this);
    this.getUnreadCount = this.getUnreadCount.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.markManyAsRead = this.markManyAsRead.bind(this);
    this.markAllAsRead = this.markAllAsRead.bind(this);
    this.deleteNotification = this.deleteNotification.bind(this);
    this.deleteAllNotifications = this.deleteAllNotifications.bind(this);
  }

  /**
   * @swagger
   * /notifications:
   *   get:
   *     summary: Get user notifications (cursor-paginated)
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: cursor
   *         schema: { type: string, format: uuid }
   *         description: Pagination cursor (last notification id from previous page)
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 20, maximum: 50 }
   *     responses:
   *       200:
   *         description: Notifications retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean }
   *                 data:
   *                   type: object
   *                   properties:
   *                     notifications: { type: array }
   *                     nextCursor: { type: string, nullable: true }
   *                     hasMore: { type: boolean }
   *                     unreadCount: { type: integer }
   */
  async getNotifications(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { cursor, limit = 20 } = req.query;

    const result = await this.notificationService.getNotifications(
      userId,
      cursor as string | undefined,
      Math.min(Number(limit), 50)
    );

    return ResponseHandler.success(res, result);
  }

  /**
   * @swagger
   * /notifications/unread-count:
   *   get:
   *     summary: Get unread notification count
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Unread count
   */
  async getUnreadCount(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const count = await this.notificationService.getUnreadCount(userId);
    return ResponseHandler.success(res, { count });
  }

  /**
   * @swagger
   * /notifications/{id}/read:
   *   patch:
   *     summary: Mark a single notification as read
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Notification marked as read
   *       404:
   *         description: Notification not found
   */
  async markAsRead(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const notification = await this.notificationService.markAsRead(req.params.id, userId);
    return ResponseHandler.success(res, notification, 'Notification marked as read');
  }

  /**
   * @swagger
   * /notifications/read:
   *   patch:
   *     summary: Mark multiple notifications as read
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [ids]
   *             properties:
   *               ids:
   *                 type: array
   *                 items: { type: string, format: uuid }
   *                 minItems: 1
   *                 maxItems: 100
   */
  async markManyAsRead(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    await this.notificationService.markManyAsRead(req.body.ids, userId);
    return ResponseHandler.success(res, null, 'Notifications marked as read');
  }

  /**
   * @swagger
   * /notifications/read-all:
   *   patch:
   *     summary: Mark all notifications as read
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: All notifications marked as read
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 message: { type: string, example: All notifications marked as read }
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   */
  async markAllAsRead(req: AuthRequest, res: Response): Promise<Response> {
    await this.notificationService.markAllAsRead(req.user!.id);
    return ResponseHandler.success(res, null, 'All notifications marked as read');
  }

  /**
   * @swagger
   * /notifications/{id}:
   *   delete:
   *     summary: Delete a single notification
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: Notification deleted
   *       404:
   *         description: Notification not found
   */
  async deleteNotification(req: AuthRequest, res: Response): Promise<Response> {
    await this.notificationService.deleteNotification(req.params.id, req.user!.id);
    return ResponseHandler.success(res, null, 'Notification deleted');
  }

  /**
   * @swagger
   * /notifications:
   *   delete:
   *     summary: Delete all notifications for the authenticated user
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: All notifications deleted
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 message: { type: string, example: All notifications deleted }
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   */
  async deleteAllNotifications(req: AuthRequest, res: Response): Promise<Response> {
    await this.notificationService.deleteAllNotifications(req.user!.id);
    return ResponseHandler.success(res, null, 'All notifications deleted');
  }
}
