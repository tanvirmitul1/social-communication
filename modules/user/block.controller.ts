import { injectable, inject } from 'tsyringe';
import { Response } from 'express';
import { BlockService } from './block.service.js';
import { ResponseHandler } from '@common/utils.js';
import { AuthRequest } from '@middlewares/auth-guard.js';

@injectable()
export class BlockController {
  constructor(@inject('BlockService') private blockService: BlockService) {
    this.blockUser = this.blockUser.bind(this);
    this.unblockUser = this.unblockUser.bind(this);
    this.getBlockedUsers = this.getBlockedUsers.bind(this);
    this.checkBlocked = this.checkBlocked.bind(this);
  }

  /**
   * @swagger
   * /users/blocks:
   *   post:
   *     summary: Block a user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [userId]
   *             properties:
   *               userId: { type: string, format: uuid }
   *               reason: { type: string, maxLength: 500 }
   *     responses:
   *       201:
   *         description: User blocked
   *       409:
   *         description: User already blocked
   */
  async blockUser(req: AuthRequest, res: Response): Promise<Response> {
    const blockerId = req.user!.id;
    const { userId, reason } = req.body;

    const block = await this.blockService.blockUser(blockerId, userId, reason);
    return ResponseHandler.success(res, block, 'User blocked successfully', 201);
  }

  /**
   * @swagger
   * /users/blocks/{userId}:
   *   delete:
   *     summary: Unblock a user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200:
   *         description: User unblocked
   *       404:
   *         description: Block relationship not found
   */
  async unblockUser(req: AuthRequest, res: Response): Promise<Response> {
    await this.blockService.unblockUser(req.user!.id, req.params.userId);
    return ResponseHandler.success(res, null, 'User unblocked successfully');
  }

  /**
   * @swagger
   * /users/blocks:
   *   get:
   *     summary: Get paginated list of users you have blocked
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: cursor
   *         schema: { type: string, format: uuid }
   *         description: Pagination cursor (last block record ID from previous page)
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 20, maximum: 50 }
   *     responses:
   *       200:
   *         description: Blocked users list
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: object
   *                   properties:
   *                     items:
   *                       type: array
   *                       items: { $ref: '#/components/schemas/BlockedUser' }
   *                     nextCursor: { type: string, format: uuid, nullable: true }
   *                     hasMore: { type: boolean }
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   */
  async getBlockedUsers(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { cursor, limit = 20 } = req.query;

    const result = await this.blockService.getBlockedUsers(
      userId,
      cursor as string | undefined,
      Math.min(Number(limit), 50)
    );

    return ResponseHandler.success(res, result);
  }

  /**
   * @swagger
   * /users/blocks/{userId}/status:
   *   get:
   *     summary: Check block status between you and another user (bidirectional)
   *     description: Returns true if either you blocked them OR they blocked you.
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema: { type: string, format: uuid }
   *         description: The other user's ID to check
   *     responses:
   *       200:
   *         description: Block status returned
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data:
   *                   type: object
   *                   properties:
   *                     isBlocked: { type: boolean, example: false }
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   */
  async checkBlocked(req: AuthRequest, res: Response): Promise<Response> {
    const isBlocked = await this.blockService.isBlocked(req.user!.id, req.params.userId);
    return ResponseHandler.success(res, { isBlocked });
  }
}
