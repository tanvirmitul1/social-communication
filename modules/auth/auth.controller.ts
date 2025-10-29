import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { AuthService } from '@modules/auth/auth.service.js';
import { ResponseHandler } from '@common/utils.js';
import { AuthRequest } from '@middlewares/auth-guard.js';
import { LoginInput, RegisterInput } from './auth.validation.js';
import { Helpers } from '@common/utils.js';

@injectable()
export class AuthController {
  constructor(@inject('AuthService') private authService: AuthService) {}

  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - email
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 minLength: 3
   *                 maxLength: 50
   *                 pattern: '^[a-zA-Z0-9_]+$'
   *                 example: john_doe
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john@example.com
   *               password:
   *                 type: string
   *                 minLength: 8
   *                 example: Password123
   *     responses:
   *       201:
   *         description: User registered successfully
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
   *                   example: User registered successfully
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       409:
   *         description: User already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       429:
   *         description: Too many requests
   */
  async register(req: Request, res: Response): Promise<Response> {
    const { username, email, password } = req.body as RegisterInput;

    const user = await this.authService.register(username, email, password);
    const sanitizedUser = Helpers.sanitizeUser(user);

    return ResponseHandler.created(res, sanitizedUser, 'User registered successfully');
  }

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Login with email and password
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john@example.com
   *               password:
   *                 type: string
   *                 example: Password123
   *     responses:
   *       200:
   *         description: Login successful
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
   *                   example: Login successful
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     accessToken:
   *                       type: string
   *                     refreshToken:
   *                       type: string
   *       400:
   *         description: Validation error
   *       401:
   *         description: Invalid credentials
   *       429:
   *         description: Too many requests
   */
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

  /**
   * @swagger
   * /auth/logout:
   *   post:
   *     summary: Logout from current device
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Logout successful
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
   *                   example: Logout successful
   *       401:
   *         description: Unauthorized
   */
  async logout(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const refreshToken = req.body.refreshToken;

    await this.authService.logout(userId, refreshToken);

    return ResponseHandler.success(res, null, 'Logout successful');
  }

  /**
   * @swagger
   * /auth/logout-all:
   *   post:
   *     summary: Logout from all devices
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logged out from all devices
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
   *                   example: Logged out from all devices
   *       401:
   *         description: Unauthorized
   */
  async logoutAll(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;

    await this.authService.logoutAll(userId);

    return ResponseHandler.success(res, null, 'Logged out from all devices');
  }

  /**
   * @swagger
   * /auth/refresh:
   *   post:
   *     summary: Refresh access token
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Token refreshed successfully
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
   *                   example: Token refreshed successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     accessToken:
   *                       type: string
   *                     refreshToken:
   *                       type: string
   *       401:
   *         description: Invalid refresh token
   */
  async refreshToken(req: Request, res: Response): Promise<Response> {
    const { refreshToken } = req.body;

    const tokens = await this.authService.refreshAccessToken(refreshToken);

    return ResponseHandler.success(res, tokens, 'Token refreshed successfully');
  }

  /**
   * @swagger
   * /auth/me:
   *   get:
   *     summary: Get current user profile
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved successfully
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
   */
  async getProfile(req: AuthRequest, res: Response): Promise<Response> {
    const user = req.user;
    const sanitizedUser = Helpers.sanitizeUser(user);

    return ResponseHandler.success(res, sanitizedUser);
  }
}
