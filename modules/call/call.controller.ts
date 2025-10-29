import { injectable, inject } from 'tsyringe';
import { Response } from 'express';
import { CallService } from '@modules/call/call.service.js';
import { ResponseHandler } from '@common/utils.js';
import { AuthRequest } from '@middlewares/auth-guard.js';
import { CallType } from '@prisma/client';

@injectable()
export class CallController {
  constructor(@inject('CallService') private callService: CallService) {}

  /**
   * @swagger
   * /calls:
   *   post:
   *     summary: Initiate a new call
   *     tags: [Calls]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - type
   *               - participantIds
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [AUDIO, VIDEO]
   *                 example: VIDEO
   *               participantIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: uuid
   *               groupId:
   *                 type: string
   *                 format: uuid
   *     responses:
   *       201:
   *         description: Call initiated successfully
   *       401:
   *         description: Unauthorized
   */
  async initiateCall(req: AuthRequest, res: Response): Promise<Response> {
    const initiatorId = req.user!.id;
    const { type, participantIds, groupId } = req.body;

    const result = await this.callService.initiateCall({
      initiatorId,
      type: type as CallType,
      participantIds,
      groupId,
    });

    return ResponseHandler.created(res, result, 'Call initiated successfully');
  }

  /**
   * @swagger
   * /calls/{id}/join:
   *   post:
   *     summary: Join an existing call
   *     tags: [Calls]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Joined call successfully
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Call not found
   */
  async joinCall(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await this.callService.joinCall(id, userId);

    return ResponseHandler.success(res, result, 'Joined call successfully');
  }

  /**
   * @swagger
   * /calls/{id}/end:
   *   post:
   *     summary: End a call
   *     tags: [Calls]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Call ended successfully
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Call not found
   */
  async endCall(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;

    const call = await this.callService.endCall(id, userId);

    return ResponseHandler.success(res, call, 'Call ended successfully');
  }

  /**
   * @swagger
   * /calls/{id}/leave:
   *   post:
   *     summary: Leave a call
   *     tags: [Calls]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Left call successfully
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Call not found
   */
  async leaveCall(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;

    await this.callService.leaveCall(id, userId);

    return ResponseHandler.success(res, null, 'Left call successfully');
  }

  /**
   * @swagger
   * /calls/{id}/reject:
   *   post:
   *     summary: Reject a call
   *     tags: [Calls]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Call rejected
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Call not found
   */
  async rejectCall(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;

    const call = await this.callService.rejectCall(id, userId);

    return ResponseHandler.success(res, call, 'Call rejected');
  }

  /**
   * @swagger
   * /calls/{id}:
   *   get:
   *     summary: Get call by ID
   *     tags: [Calls]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Call retrieved successfully
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Call not found
   */
  async getCall(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    const call = await this.callService.getCallById(id);

    return ResponseHandler.success(res, call);
  }

  /**
   * @swagger
   * /calls:
   *   get:
   *     summary: Get user's call history
   *     tags: [Calls]
   *     security:
   *       - bearerAuth: []
   *     parameters:
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
   *         description: Calls retrieved successfully
   *       401:
   *         description: Unauthorized
   */
  async getUserCalls(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const result = await this.callService.getUserCalls(userId, Number(page), Number(limit));

    return ResponseHandler.paginated(res, result.calls, result.page, result.limit, result.total);
  }
}
