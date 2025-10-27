import { injectable, inject } from 'tsyringe';
import { Response } from 'express';
import { UserService } from '@services/UserService.js';
import { ResponseHandler } from '@utils/index.js';
import { AuthRequest } from '@middlewares/auth.middleware.js';
import { Helpers } from '@utils/index.js';

@injectable()
export class UserController {
  constructor(@inject('UserService') private userService: UserService) {}

  async getUser(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    const user = await this.userService.getUserById(id);
    const sanitizedUser = Helpers.sanitizeUser(user);

    return ResponseHandler.success(res, sanitizedUser);
  }

  async updateUser(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const updateData = req.body;

    const user = await this.userService.updateUser(userId, updateData);
    const sanitizedUser = Helpers.sanitizeUser(user);

    return ResponseHandler.success(res, sanitizedUser, 'User updated successfully');
  }

  async deleteUser(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;

    await this.userService.deleteUser(userId);

    return ResponseHandler.success(res, null, 'User deleted successfully');
  }

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

  async getUserPresence(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    const presence = await this.userService.getUserPresence(id);

    return ResponseHandler.success(res, presence);
  }
}
