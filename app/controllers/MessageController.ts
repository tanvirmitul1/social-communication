import { injectable, inject } from 'tsyringe';
import { Response } from 'express';
import { MessageService } from '@services/MessageService.js';
import { ResponseHandler } from '@utils/index.js';
import { AuthRequest } from '@middlewares/auth.middleware.js';
import { SendMessageInput, EditMessageInput } from '@validations/index.js';
import { MessageStatus } from '@prisma/client';

@injectable()
export class MessageController {
  constructor(@inject('MessageService') private messageService: MessageService) {}

  /**
   * @swagger
   * /messages:
   *   post:
   *     summary: Send a message
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - content
   *             properties:
   *               content:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 5000
   *                 example: Hello, how are you?
   *               type:
   *                 type: string
   *                 enum: [TEXT, IMAGE, FILE, VOICE, VIDEO]
   *                 default: TEXT
   *               groupId:
   *                 type: string
   *                 format: uuid
   *                 description: Target group ID (for group messages)
   *               receiverId:
   *                 type: string
   *                 format: uuid
   *                 description: Target user ID (for direct messages)
   *               parentId:
   *                 type: string
   *                 format: uuid
   *                 description: Parent message ID (for threaded replies)
   *               metadata:
   *                 type: object
   *                 description: Additional message metadata
   *     responses:
   *       201:
   *         description: Message sent successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Message sent successfully
   *                 data:
   *                   $ref: '#/components/schemas/Message'
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       429:
   *         description: Too many requests
   */
  async sendMessage(req: AuthRequest, res: Response): Promise<Response> {
    const senderId = req.user!.id;
    const data = req.body as SendMessageInput;

    const message = await this.messageService.sendMessage({
      senderId,
      ...data,
    });

    return ResponseHandler.created(res, message, 'Message sent successfully');
  }

  /**
   * @swagger
   * /messages/{id}:
   *   get:
   *     summary: Get message by ID
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Message ID
   *     responses:
   *       200:
   *         description: Message retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Message'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Message not found
   */
  async getMessage(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    const message = await this.messageService.getMessage(id);

    return ResponseHandler.success(res, message);
  }

  /**
   * @swagger
   * /messages/group/{groupId}:
   *   get:
   *     summary: Get group messages
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: groupId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Group ID
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *           maximum: 100
   *     responses:
   *       200:
   *         description: Messages retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Message'
   *                 pagination:
   *                   type: object
   *       401:
   *         description: Unauthorized
   */
  async getGroupMessages(req: AuthRequest, res: Response): Promise<Response> {
    const { groupId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await this.messageService.getGroupMessages(groupId, Number(page), Number(limit));

    return ResponseHandler.paginated(res, result.messages, result.page, result.limit, result.total);
  }

  /**
   * @swagger
   * /messages/direct/{userId}:
   *   get:
   *     summary: Get direct messages with another user
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Other user ID
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *           maximum: 100
   *     responses:
   *       200:
   *         description: Messages retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Message'
   *                 pagination:
   *                   type: object
   *       401:
   *         description: Unauthorized
   */
  async getDirectMessages(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { otherUserId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await this.messageService.getDirectMessages(
      userId,
      otherUserId,
      Number(page),
      Number(limit)
    );

    return ResponseHandler.paginated(res, result.messages, result.page, result.limit, result.total);
  }

  /**
   * @swagger
   * /messages/{id}:
   *   patch:
   *     summary: Edit a message
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Message ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - content
   *             properties:
   *               content:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 5000
   *     responses:
   *       200:
   *         description: Message edited successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/Message'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Not allowed to edit this message
   *       404:
   *         description: Message not found
   */
  async editMessage(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;
    const { content } = req.body as EditMessageInput;

    const message = await this.messageService.editMessage(id, userId, content);

    return ResponseHandler.success(res, message, 'Message edited successfully');
  }

  /**
   * @swagger
   * /messages/{id}:
   *   delete:
   *     summary: Delete a message
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Message ID
   *     responses:
   *       200:
   *         description: Message deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Not allowed to delete this message
   *       404:
   *         description: Message not found
   */
  async deleteMessage(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;

    await this.messageService.deleteMessage(id, userId);

    return ResponseHandler.success(res, null, 'Message deleted successfully');
  }

  /**
   * @swagger
   * /messages/{id}/delivered:
   *   post:
   *     summary: Mark message as delivered
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Message ID
   *     responses:
   *       200:
   *         description: Message marked as delivered
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Message'
   *       401:
   *         description: Unauthorized
   */
  async markAsDelivered(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    const message = await this.messageService.updateMessageStatus(id, MessageStatus.DELIVERED);

    return ResponseHandler.success(res, message);
  }

  /**
   * @swagger
   * /messages/{id}/seen:
   *   post:
   *     summary: Mark message as seen
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Message ID
   *     responses:
   *       200:
   *         description: Message marked as seen
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Message'
   *       401:
   *         description: Unauthorized
   */
  async markAsSeen(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    const message = await this.messageService.updateMessageStatus(id, MessageStatus.SEEN);

    return ResponseHandler.success(res, message);
  }

  /**
   * @swagger
   * /messages/{id}/react:
   *   post:
   *     summary: Add reaction to message
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Message ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - emoji
   *             properties:
   *               emoji:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 10
   *                 example: 👍
   *     responses:
   *       200:
   *         description: Reaction added
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       401:
   *         description: Unauthorized
   */
  async addReaction(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;
    const { emoji } = req.body;

    await this.messageService.addReaction(id, userId, emoji);

    return ResponseHandler.success(res, null, 'Reaction added');
  }

  /**
   * @swagger
   * /messages/{id}/react:
   *   delete:
   *     summary: Remove reaction from message
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Message ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - emoji
   *             properties:
   *               emoji:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 10
   *                 example: 👍
   *     responses:
   *       200:
   *         description: Reaction removed
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       401:
   *         description: Unauthorized
   */
  async removeReaction(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;
    const { emoji } = req.body;

    await this.messageService.removeReaction(id, userId, emoji);

    return ResponseHandler.success(res, null, 'Reaction removed');
  }

  /**
   * @swagger
   * /messages/search:
   *   get:
   *     summary: Search messages
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: query
   *         required: true
   *         schema:
   *           type: string
   *         description: Search query
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *           maximum: 100
   *     responses:
   *       200:
   *         description: Messages retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Message'
   *                 pagination:
   *                   type: object
   *       401:
   *         description: Unauthorized
   */
  async searchMessages(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { query, page = 1, limit = 20 } = req.query;

    const result = await this.messageService.searchMessages(
      query as string,
      userId,
      Number(page),
      Number(limit)
    );

    return ResponseHandler.paginated(res, result.messages, result.page, result.limit, result.total);
  }
}
