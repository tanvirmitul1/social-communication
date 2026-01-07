import { injectable, inject } from 'tsyringe';
import { Response } from 'express';
import { MessageService } from '@modules/message/message.service.js';
import { ResponseHandler } from '@common/utils.js';
import { AuthRequest } from '@middlewares/auth-guard.js';
import { SendMessageInput, EditMessageInput, ForwardMessageInput } from './message.validation.js';
import { MessageStatus } from '@prisma/client';

@injectable()
export class MessageController {
  constructor(@inject('MessageService') private messageService: MessageService) {
    this.sendMessage = this.sendMessage.bind(this);
    this.getMessage = this.getMessage.bind(this);
    this.getGroupMessages = this.getGroupMessages.bind(this);
    this.getDirectMessages = this.getDirectMessages.bind(this);
    this.editMessage = this.editMessage.bind(this);
    this.deleteMessage = this.deleteMessage.bind(this);
    this.markAsDelivered = this.markAsDelivered.bind(this);
    this.markAsSeen = this.markAsSeen.bind(this);
    this.addReaction = this.addReaction.bind(this);
    this.removeReaction = this.removeReaction.bind(this);
    this.getMessageReactions = this.getMessageReactions.bind(this);
    this.getUserReaction = this.getUserReaction.bind(this);
    this.searchMessages = this.searchMessages.bind(this);
    this.forwardMessage = this.forwardMessage.bind(this);
    this.getChatList = this.getChatList.bind(this);
  }

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
   * /messages/{id}/reactions:
   *   get:
   *     summary: Get all reactions for a message
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
   *         description: Message reactions retrieved successfully
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
   *                     type: object
   *                     properties:
   *                       emoji:
   *                         type: string
   *                       count:
   *                         type: number
   *                       users:
   *                         type: array
   *                         items:
   *                           type: string
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Message not found
   */
  async getMessageReactions(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    const reactions = await this.messageService.getMessageReactions(id);

    return ResponseHandler.success(res, reactions);
  }

  /**
   * @swagger
   * /messages/{id}/reaction:
   *   get:
   *     summary: Get current user's reaction to a message
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
   *         description: User reaction retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     emoji:
   *                       type: string
   *                       nullable: true
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Message not found
   */
  async getUserReaction(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;

    const reaction = await this.messageService.getUserReaction(id, userId);

    return ResponseHandler.success(res, { emoji: reaction });
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

  /**
   * @swagger
   * /messages/{id}/forward:
   *   post:
   *     summary: Forward a message
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
   *         description: Original message ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - originalMessageId
   *             properties:
   *               originalMessageId:
   *                 type: string
   *                 format: uuid
   *                 description: ID of the message to forward
   *               groupId:
   *                 type: string
   *                 format: uuid
   *                 description: Target group ID (for group forwarding)
   *               receiverId:
   *                 type: string
   *                 format: uuid
   *                 description: Target user ID (for direct message forwarding)
   *     responses:
   *       201:
   *         description: Message forwarded successfully
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
   *                   example: Message forwarded successfully
   *                 data:
   *                   $ref: '#/components/schemas/Message'
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Original message not found
   *       429:
   *         description: Too many requests
   */
  async forwardMessage(req: AuthRequest, res: Response): Promise<Response> {
    const senderId = req.user!.id;
    const { id } = req.params;
    const { groupId, receiverId } = req.body as ForwardMessageInput;

    const message = await this.messageService.forwardMessage({
      originalMessageId: id,
      senderId,
      groupId,
      receiverId,
    });

    return ResponseHandler.created(res, message, 'Message forwarded successfully');
  }

  /**
   * @swagger
   * /messages/chats:
   *   get:
   *     summary: Get chat list with last messages
   *     description: Retrieve all conversations (direct and group) with the last message and unread count
   *     tags: [Messages]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *           maximum: 100
   *         description: Items per page
   *     responses:
   *       200:
   *         description: Chat list retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       type:
   *                         type: string
   *                         enum: [direct, group]
   *                         description: Type of conversation
   *                       user:
   *                         type: object
   *                         description: Other user (for direct chats)
   *                         properties:
   *                           id:
   *                             type: string
   *                           username:
   *                             type: string
   *                           avatar:
   *                             type: string
   *                           email:
   *                             type: string
   *                       group:
   *                         type: object
   *                         description: Group info (for group chats)
   *                         properties:
   *                           id:
   *                             type: string
   *                           title:
   *                             type: string
   *                           cover:
   *                             type: string
   *                           type:
   *                             type: string
   *                       lastMessage:
   *                         $ref: '#/components/schemas/Message'
   *                       unreadCount:
   *                         type: integer
   *                         description: Number of unread messages
   *                       lastMessageAt:
   *                         type: string
   *                         format: date-time
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     total:
   *                       type: integer
   *       401:
   *         description: Unauthorized
   */
  async getChatList(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const result = await this.messageService.getChatList(
      userId,
      Number(page),
      Number(limit)
    );

    return ResponseHandler.paginated(res, result.chats, result.page, result.limit, result.total);
  }
}
