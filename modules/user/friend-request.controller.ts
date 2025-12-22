import { injectable, inject } from 'tsyringe';
import { Response } from 'express';
import { FriendRequestService } from '@modules/user/friend-request.service.js';
import { ResponseHandler } from '@common/response.js';
import { AuthRequest } from '@middlewares/auth-guard.js';

@injectable()
export class FriendRequestController {
  constructor(@inject('FriendRequestService') private friendRequestService: FriendRequestService) {}

  /**
   * @swagger
   * /friend-requests:
   *   post:
   *     summary: Send a friend request
   *     tags: [Friend Requests]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - receiverId
   *             properties:
   *               receiverId:
   *                 type: string
   *                 format: uuid
   *                 description: ID of the user to send friend request to
   *     responses:
   *       201:
   *         description: Friend request sent successfully
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
   *                   example: Friend request sent successfully
   *                 data:
   *                   $ref: '#/components/schemas/FriendRequest'
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: User not found
   *       409:
   *         description: Conflict (already friends, request already sent, etc.)
   */
  async sendFriendRequest(req: AuthRequest, res: Response): Promise<Response> {
    const senderId = req.user!.id;
    const { receiverId } = req.body;

    const friendRequest = await this.friendRequestService.sendFriendRequest(senderId, receiverId);

    return ResponseHandler.created(res, friendRequest, 'Friend request sent successfully');
  }

  /**
   * @swagger
   * /friend-requests/{id}/accept:
   *   post:
   *     summary: Accept a friend request
   *     tags: [Friend Requests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Friend request ID
   *     responses:
   *       200:
   *         description: Friend request accepted successfully
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
   *                   example: Friend request accepted successfully
   *                 data:
   *                   $ref: '#/components/schemas/FriendRequest'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden (not authorized to accept)
   *       404:
   *         description: Friend request not found
   *       409:
   *         description: Conflict (already accepted)
   */
  async acceptFriendRequest(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;

    const friendRequest = await this.friendRequestService.acceptFriendRequest(id, userId);

    return ResponseHandler.success(res, friendRequest, 'Friend request accepted successfully');
  }

  /**
   * @swagger
   * /friend-requests/{id}/reject:
   *   post:
   *     summary: Reject a friend request
   *     tags: [Friend Requests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Friend request ID
   *     responses:
   *       200:
   *         description: Friend request rejected successfully
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
   *                   example: Friend request rejected successfully
   *                 data:
   *                   $ref: '#/components/schemas/FriendRequest'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden (not authorized to reject)
   *       404:
   *         description: Friend request not found
   *       409:
   *         description: Conflict (already rejected)
   */
  async rejectFriendRequest(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;

    const friendRequest = await this.friendRequestService.rejectFriendRequest(id, userId);

    return ResponseHandler.success(res, friendRequest, 'Friend request rejected successfully');
  }

  /**
   * @swagger
   * /friend-requests/{id}/cancel:
   *   post:
   *     summary: Cancel a friend request (sender only)
   *     tags: [Friend Requests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Friend request ID
   *     responses:
   *       200:
   *         description: Friend request canceled successfully
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
   *                   example: Friend request canceled successfully
   *                 data:
   *                   $ref: '#/components/schemas/FriendRequest'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden (not authorized to cancel)
   *       404:
   *         description: Friend request not found
   *       409:
   *         description: Conflict (already canceled or accepted)
   */
  async cancelFriendRequest(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;

    const friendRequest = await this.friendRequestService.cancelFriendRequest(id, userId);

    return ResponseHandler.success(res, friendRequest, 'Friend request canceled successfully');
  }

  /**
   * @swagger
   * /friend-requests/pending:
   *   get:
   *     summary: Get pending friend requests
   *     tags: [Friend Requests]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Pending friend requests retrieved successfully
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
   *                     $ref: '#/components/schemas/FriendRequest'
   *       401:
   *         description: Unauthorized
   */
  async getPendingFriendRequests(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;

    const friendRequests = await this.friendRequestService.getPendingFriendRequests(userId);

    return ResponseHandler.success(res, friendRequests);
  }

  /**
   * @swagger
   * /friends:
   *   get:
   *     summary: Get friends list
   *     tags: [Friends]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Friends list retrieved successfully
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
   *       401:
   *         description: Unauthorized
   */
  async getFriends(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;

    const friends = await this.friendRequestService.getFriends(userId);

    return ResponseHandler.success(res, friends);
  }

  /**
   * @swagger
   * /friends/{id}:
   *   delete:
   *     summary: Remove a friend
   *     tags: [Friends]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Friend's user ID
   *     responses:
   *       200:
   *         description: Friend removed successfully
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
   *                   example: Friend removed successfully
   *       401:
   *         description: Unauthorized
   *       409:
   *         description: Conflict (not friends)
   */
  async removeFriend(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id: friendId } = req.params;

    await this.friendRequestService.removeFriend(userId, friendId);

    return ResponseHandler.success(res, null, 'Friend removed successfully');
  }
}