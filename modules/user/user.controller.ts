import { injectable, inject } from 'tsyringe';
import { Response } from 'express';
import { UserService } from '@modules/user/user.service.js';
import { ResponseHandler } from '@common/utils.js';
import { AuthRequest } from '@middlewares/auth-guard.js';
import { Helpers } from '@common/utils.js';

@injectable()
export class UserController {
  constructor(@inject('UserService') private userService: UserService) {}

  /**
   * @swagger
   * /users/{id}:
   *   get:
   *     summary: Get user by ID
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: User ID
   *     responses:
   *       200:
   *         description: User retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: User not found
   */
  async getUser(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    const user = await this.userService.getUserById(id);
    const sanitizedUser = Helpers.sanitizeUser(user);

    return ResponseHandler.success(res, sanitizedUser);
  }

  /**
   * @swagger
   * /users/{id}:
   *   patch:
   *     summary: Update user profile
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: User ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *                 minLength: 3
   *                 maxLength: 50
   *               avatar:
   *                 type: string
   *                 format: uri
   *               statusMessage:
   *                 type: string
   *                 maxLength: 200
   *     responses:
   *       200:
   *         description: User updated successfully
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
   *                   example: User updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: User not found
   */
  async updateUser(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const updateData = req.body;

    const user = await this.userService.updateUser(userId, updateData);
    const sanitizedUser = Helpers.sanitizeUser(user);

    return ResponseHandler.success(res, sanitizedUser, 'User updated successfully');
  }

  /**
   * @swagger
   * /users/{id}:
   *   delete:
   *     summary: Delete user account
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: User ID
   *     responses:
   *       200:
   *         description: User deleted successfully
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
   *                   example: User deleted successfully
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: User not found
   */
  async deleteUser(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;

    await this.userService.deleteUser(userId);

    return ResponseHandler.success(res, null, 'User deleted successfully');
  }

  /**
   * @swagger
   * /users:
   *   get:
   *     summary: Search users
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: query
   *         required: true
   *         schema:
   *           type: string
   *         description: Search query (username or email)
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
   *         description: Users retrieved successfully
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
   *                     $ref: '#/components/schemas/User'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     total:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   *       401:
   *         description: Unauthorized
   */
  async searchUsers(req: AuthRequest, res: Response): Promise<Response> {
    const { query, page = 1, limit = 20 } = req.query;

    const result = await this.userService.searchUsers(query as string, Number(page), Number(limit));

    return ResponseHandler.paginated(
      res,
      result.users.map((u) => Helpers.sanitizeUser(u)),
      result.page,
      result.limit,
      result.total
    );
  }

  /**
   * @swagger
   * /users/{id}/presence:
   *   get:
   *     summary: Get user presence status
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: User ID
   *     responses:
   *       200:
   *         description: User presence retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     isOnline:
   *                       type: boolean
   *                     lastSeen:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: User not found
   */
  async getUserPresence(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    const presence = await this.userService.getUserPresence(id);

    return ResponseHandler.success(res, presence);
  }
}
