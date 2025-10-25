import { injectable, inject } from 'tsyringe';
import { Response } from 'express';
import { CallService } from '@services/CallService.js';
import { ResponseHandler } from '@utils/index.js';
import { AuthRequest } from '@middlewares/auth.middleware.js';
import { CallType } from '@prisma/client';

@injectable()
export class CallController {
  constructor(@inject('CallService') private callService: CallService) {}

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

  async joinCall(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await this.callService.joinCall(id, userId);

    return ResponseHandler.success(res, result, 'Joined call successfully');
  }

  async endCall(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;

    const call = await this.callService.endCall(id, userId);

    return ResponseHandler.success(res, call, 'Call ended successfully');
  }

  async leaveCall(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;

    await this.callService.leaveCall(id, userId);

    return ResponseHandler.success(res, null, 'Left call successfully');
  }

  async rejectCall(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;

    const call = await this.callService.rejectCall(id, userId);

    return ResponseHandler.success(res, call, 'Call rejected');
  }

  async getCall(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    const call = await this.callService.getCallById(id);

    return ResponseHandler.success(res, call);
  }

  async getUserCalls(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const result = await this.callService.getUserCalls(userId, Number(page), Number(limit));

    return ResponseHandler.paginated(res, result.calls, result.page, result.limit, result.total);
  }
}
