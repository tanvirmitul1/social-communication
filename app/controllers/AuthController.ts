import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { AuthService } from '@services/AuthService.js';
import { ResponseHandler } from '@utils/index.js';
import { AuthRequest } from '@middlewares/auth.middleware.js';
import { LoginInput, RegisterInput } from '@validations/index.js';
import { Helpers } from '@utils/index.js';

@injectable()
export class AuthController {
  constructor(@inject('AuthService') private authService: AuthService) {}

  async register(req: Request, res: Response): Promise<Response> {
    const { username, email, password } = req.body as RegisterInput;

    const user = await this.authService.register(username, email, password);
    const sanitizedUser = Helpers.sanitizeUser(user);

    return ResponseHandler.created(res, sanitizedUser, 'User registered successfully');
  }

  async login(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body as LoginInput;

    const { user, tokens } = await this.authService.login(email, password);
    const sanitizedUser = Helpers.sanitizeUser(user);

    return ResponseHandler.success(
      res,
      {
        user: sanitizedUser,
        ...tokens,
      },
      'Login successful'
    );
  }

  async logout(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const refreshToken = req.body.refreshToken;

    await this.authService.logout(userId, refreshToken);

    return ResponseHandler.success(res, null, 'Logout successful');
  }

  async logoutAll(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;

    await this.authService.logoutAll(userId);

    return ResponseHandler.success(res, null, 'Logged out from all devices');
  }

  async refreshToken(req: Request, res: Response): Promise<Response> {
    const { refreshToken } = req.body;

    const tokens = await this.authService.refreshAccessToken(refreshToken);

    return ResponseHandler.success(res, tokens, 'Token refreshed successfully');
  }

  async getProfile(req: AuthRequest, res: Response): Promise<Response> {
    const user = req.user;
    const sanitizedUser = Helpers.sanitizeUser(user);

    return ResponseHandler.success(res, sanitizedUser);
  }
}
