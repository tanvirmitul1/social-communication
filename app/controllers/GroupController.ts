import { injectable, inject } from 'tsyringe';
import { Response } from 'express';
import { GroupService } from '@services/GroupService.js';
import { ResponseHandler } from '@utils/index.js';
import { AuthRequest } from '@middlewares/auth.middleware.js';
import { CreateGroupInput, UpdateGroupInput, AddGroupMemberInput } from '@validations/index.js';

@injectable()
export class GroupController {
  constructor(@inject('GroupService') private groupService: GroupService) {}

  async createGroup(req: AuthRequest, res: Response): Promise<Response> {
    const creatorId = req.user!.id;
    const data = req.body as CreateGroupInput;

    const group = await this.groupService.createGroup({
      ...data,
      creatorId,
    });

    return ResponseHandler.created(res, group, 'Group created successfully');
  }

  async getGroup(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    const group = await this.groupService.getGroupById(id);

    return ResponseHandler.success(res, group);
  }

  async getUserGroups(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const result = await this.groupService.getUserGroups(userId, Number(page), Number(limit));

    return ResponseHandler.paginated(res, result.groups, result.page, result.limit, result.total);
  }

  async updateGroup(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;
    const data = req.body as UpdateGroupInput;

    const group = await this.groupService.updateGroup(id, userId, data);

    return ResponseHandler.success(res, group, 'Group updated successfully');
  }

  async deleteGroup(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;

    await this.groupService.deleteGroup(id, userId);

    return ResponseHandler.success(res, null, 'Group deleted successfully');
  }

  async addMember(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;
    const { userId: targetUserId, role } = req.body as AddGroupMemberInput;

    await this.groupService.addMember(id, userId, targetUserId, role);

    return ResponseHandler.success(res, null, 'Member added successfully');
  }

  async removeMember(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id, memberId } = req.params;

    await this.groupService.removeMember(id, userId, memberId);

    return ResponseHandler.success(res, null, 'Member removed successfully');
  }

  async leaveGroup(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;

    await this.groupService.leaveGroup(id, userId);

    return ResponseHandler.success(res, null, 'Left group successfully');
  }
}
