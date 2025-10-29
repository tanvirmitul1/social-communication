import { injectable, inject } from 'tsyringe';
import { Response } from 'express';
import { GroupService } from '@modules/group/group.service.js';
import { ResponseHandler } from '@common/utils.js';
import { AuthRequest } from '@middlewares/auth-guard.js';
import { CreateGroupInput, UpdateGroupInput, AddGroupMemberInput } from '@validations/index.js';

@injectable()
export class GroupController {
  constructor(@inject('GroupService') private groupService: GroupService) {}

  /**
   * @swagger
   * /groups:
   *   post:
   *     summary: Create a new group
   *     tags: [Groups]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *             properties:
   *               title:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 100
   *                 example: Project Team
   *               description:
   *                 type: string
   *                 maxLength: 500
   *                 example: Discussion group for our project
   *               cover:
   *                 type: string
   *                 format: uri
   *               type:
   *                 type: string
   *                 enum: [PRIVATE, PUBLIC, SECRET]
   *                 default: PRIVATE
   *     responses:
   *       201:
   *         description: Group created successfully
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
   *                   $ref: '#/components/schemas/Group'
   *       401:
   *         description: Unauthorized
   */
  async createGroup(req: AuthRequest, res: Response): Promise<Response> {
    const creatorId = req.user!.id;
    const data = req.body as CreateGroupInput;

    const group = await this.groupService.createGroup({
      ...data,
      creatorId,
    });

    return ResponseHandler.created(res, group, 'Group created successfully');
  }

  /**
   * @swagger
   * /groups/{id}:
   *   get:
   *     summary: Get group by ID
   *     tags: [Groups]
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
   *         description: Group retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Group'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Group not found
   */
  async getGroup(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    const group = await this.groupService.getGroupById(id);

    return ResponseHandler.success(res, group);
  }

  /**
   * @swagger
   * /groups:
   *   get:
   *     summary: Get user's groups
   *     tags: [Groups]
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
   *         description: Groups retrieved successfully
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
   *                     $ref: '#/components/schemas/Group'
   *                 pagination:
   *                   type: object
   *       401:
   *         description: Unauthorized
   */
  async getUserGroups(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const result = await this.groupService.getUserGroups(userId, Number(page), Number(limit));

    return ResponseHandler.paginated(res, result.groups, result.page, result.limit, result.total);
  }

  /**
   * @swagger
   * /groups/{id}:
   *   patch:
   *     summary: Update group
   *     tags: [Groups]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               cover:
   *                 type: string
   *               type:
   *                 type: string
   *                 enum: [PRIVATE, PUBLIC, SECRET]
   *     responses:
   *       200:
   *         description: Group updated successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Not allowed
   *       404:
   *         description: Group not found
   */
  async updateGroup(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;
    const data = req.body as UpdateGroupInput;

    const group = await this.groupService.updateGroup(id, userId, data);

    return ResponseHandler.success(res, group, 'Group updated successfully');
  }

  /**
   * @swagger
   * /groups/{id}:
   *   delete:
   *     summary: Delete group
   *     tags: [Groups]
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
   *         description: Group deleted successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Not allowed
   *       404:
   *         description: Group not found
   */
  async deleteGroup(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;

    await this.groupService.deleteGroup(id, userId);

    return ResponseHandler.success(res, null, 'Group deleted successfully');
  }

  /**
   * @swagger
   * /groups/{id}/members:
   *   post:
   *     summary: Add member to group
   *     tags: [Groups]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *             properties:
   *               userId:
   *                 type: string
   *                 format: uuid
   *               role:
   *                 type: string
   *                 enum: [MEMBER, ADMIN]
   *                 default: MEMBER
   *     responses:
   *       200:
   *         description: Member added successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Not allowed
   */
  async addMember(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;
    const { userId: targetUserId, role } = req.body as AddGroupMemberInput;

    await this.groupService.addMember(id, userId, targetUserId, role);

    return ResponseHandler.success(res, null, 'Member added successfully');
  }

  /**
   * @swagger
   * /groups/{id}/members/{userId}:
   *   delete:
   *     summary: Remove member from group
   *     tags: [Groups]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Member removed successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Not allowed
   */
  async removeMember(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id, memberId } = req.params;

    await this.groupService.removeMember(id, userId, memberId);

    return ResponseHandler.success(res, null, 'Member removed successfully');
  }

  /**
   * @swagger
   * /groups/{id}/leave:
   *   post:
   *     summary: Leave group
   *     tags: [Groups]
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
   *         description: Left group successfully
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Group not found
   */
  async leaveGroup(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;

    await this.groupService.leaveGroup(id, userId);

    return ResponseHandler.success(res, null, 'Left group successfully');
  }
}
