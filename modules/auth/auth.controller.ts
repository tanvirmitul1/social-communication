import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { AuthService } from '@modules/auth/auth.service.js';
import { ResponseHandler } from '@common/utils.js';
import { AuthRequest } from '@middlewares/auth-guard.js';
import { LoginInput, RegisterInput } from './auth.validation.js';
import { Helpers } from '@common/utils.js';

@injectable()
export class AuthController {
  constructor(@inject('AuthService') private authService: AuthService) {
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.logoutAll = this.logoutAll.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.getProfile = this.getProfile.bind(this);
    this.setup2FA = this.setup2FA.bind(this);
    this.enable2FA = this.enable2FA.bind(this);
    this.disable2FA = this.disable2FA.bind(this);
    this.verifyTwoFactorLogin = this.verifyTwoFactorLogin.bind(this);
  }

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

    const result = await this.authService.login(email, password);

    if (result.requiresTwoFactor) {
      return ResponseHandler.success(
        res,
        { requiresTwoFactor: true, twoFactorToken: result.twoFactorToken },
        'Two-factor authentication required'
      );
    }

    return ResponseHandler.success(
      res,
      { user: Helpers.sanitizeUser(result.user), ...result.tokens },
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

  // ============================================================================
  // TWO-FACTOR AUTHENTICATION
  // ============================================================================

  /**
   * @swagger
   * /auth/2fa/setup:
   *   post:
   *     summary: Generate a 2FA secret and QR code
   *     description: Returns a QR code data URL to scan with an authenticator app. Call enable after scanning.
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Secret and QR code generated
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 secret: { type: string }
   *                 otpauthUrl: { type: string }
   *                 qrCodeDataUrl: { type: string }
   */
  async setup2FA(req: AuthRequest, res: Response): Promise<Response> {
    const result = await this.authService.setup2FA(req.user!.id);
    return ResponseHandler.success(res, result, '2FA setup initiated — scan the QR code');
  }

  /**
   * @swagger
   * /auth/2fa/enable:
   *   post:
   *     summary: Activate 2FA by verifying the first code
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [token]
   *             properties:
   *               token: { type: string, description: "6-digit code from authenticator app" }
   *     responses:
   *       200:
   *         description: 2FA enabled
   *       401:
   *         description: Invalid code
   */
  async enable2FA(req: AuthRequest, res: Response): Promise<Response> {
    await this.authService.enable2FA(req.user!.id, req.body.token);
    return ResponseHandler.success(res, null, '2FA enabled successfully');
  }

  /**
   * @swagger
   * /auth/2fa/disable:
   *   post:
   *     summary: Disable 2FA (requires password + current code)
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [password, token]
   *             properties:
   *               password: { type: string }
   *               token: { type: string }
   */
  async disable2FA(req: AuthRequest, res: Response): Promise<Response> {
    await this.authService.disable2FA(req.user!.id, req.body.password, req.body.token);
    return ResponseHandler.success(res, null, '2FA disabled successfully');
  }

  /**
   * @swagger
   * /auth/2fa/verify:
   *   post:
   *     summary: Complete login by verifying 2FA code
   *     description: Exchange the twoFactorToken (from login) + a valid code for full auth tokens.
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [twoFactorToken, token]
   *             properties:
   *               twoFactorToken: { type: string }
   *               token: { type: string, description: "6-digit authenticator code" }
   *     responses:
   *       200:
   *         description: Login complete — full tokens returned
   *       401:
   *         description: Invalid or expired token / wrong code
   */
  async verifyTwoFactorLogin(req: Request, res: Response): Promise<Response> {
    const { twoFactorToken, token } = req.body;
    const result = await this.authService.verifyTwoFactorLogin(twoFactorToken, token);
    return ResponseHandler.success(
      res,
      { user: Helpers.sanitizeUser(result.user), ...result.tokens },
      'Login successful'
    );
  }
}
