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
   *     description: |
   *       Returns full auth tokens on success.
   *       If the account has 2FA enabled, returns `{ requiresTwoFactor: true, twoFactorToken }` instead.
   *       Exchange the `twoFactorToken` via `POST /auth/2fa/verify`.
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
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
   *         description: Login successful (or 2FA required)
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/LoginResponse'
   *                 - type: object
   *                   description: 2FA is enabled — use twoFactorToken with POST /auth/2fa/verify
   *                   properties:
   *                     success: { type: boolean, example: true }
   *                     data:
   *                       $ref: '#/components/schemas/TwoFactorRequiredResponse'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
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
   *     summary: Step 1 — Generate a 2FA secret and QR code
   *     description: |
   *       Generates a TOTP secret, stores it on the account, and returns a QR code.
   *       Render `data.qrCodeDataUrl` as an `<img>` tag for the user to scan.
   *       2FA is **not active** until the user calls `POST /auth/2fa/enable` with a valid code.
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Secret and QR code generated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 message: { type: string, example: 2FA setup initiated — scan the QR code }
   *                 data:
   *                   $ref: '#/components/schemas/TwoFactorSetupResponse'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   */
  async setup2FA(req: AuthRequest, res: Response): Promise<Response> {
    const result = await this.authService.setup2FA(req.user!.id);
    return ResponseHandler.success(res, result, '2FA setup initiated — scan the QR code');
  }

  /**
   * @swagger
   * /auth/2fa/enable:
   *   post:
   *     summary: Step 2 — Activate 2FA by verifying the first code
   *     description: Verifies the 6-digit code from the authenticator app and marks 2FA as active on the account.
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
   *               token:
   *                 type: string
   *                 description: 6-digit code from authenticator app
   *                 example: '123456'
   *     responses:
   *       200:
   *         description: 2FA enabled successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 message: { type: string, example: 2FA enabled successfully }
   *       401:
   *         description: Invalid 2FA code
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   *       409:
   *         description: 2FA is already enabled on this account
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   */
  async enable2FA(req: AuthRequest, res: Response): Promise<Response> {
    await this.authService.enable2FA(req.user!.id, req.body.token);
    return ResponseHandler.success(res, null, '2FA enabled successfully');
  }

  /**
   * @swagger
   * /auth/2fa/disable:
   *   post:
   *     summary: Disable 2FA (requires current password + valid code)
   *     description: Requires both the account password and a valid TOTP code to prevent unauthorized disabling.
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
   *               password:
   *                 type: string
   *                 description: Current account password
   *               token:
   *                 type: string
   *                 description: 6-digit code from authenticator app
   *                 example: '654321'
   *     responses:
   *       200:
   *         description: 2FA disabled successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 message: { type: string, example: 2FA disabled successfully }
   *       401:
   *         description: Invalid password or 2FA code
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   *       409:
   *         description: 2FA is not enabled on this account
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   */
  async disable2FA(req: AuthRequest, res: Response): Promise<Response> {
    await this.authService.disable2FA(req.user!.id, req.body.password, req.body.token);
    return ResponseHandler.success(res, null, '2FA disabled successfully');
  }

  /**
   * @swagger
   * /auth/2fa/verify:
   *   post:
   *     summary: Step 3 — Complete 2FA login and receive full auth tokens
   *     description: |
   *       Exchange the `twoFactorToken` received from `POST /auth/login` (when 2FA is required)
   *       along with the 6-digit authenticator code for full access + refresh tokens.
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [twoFactorToken, token]
   *             properties:
   *               twoFactorToken:
   *                 type: string
   *                 description: The short-lived JWT returned by POST /auth/login when 2FA is required
   *               token:
   *                 type: string
   *                 description: 6-digit code from authenticator app
   *                 example: '123456'
   *     responses:
   *       200:
   *         description: Login complete — full tokens returned
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       401:
   *         description: Invalid or expired twoFactorToken, or wrong authenticator code
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
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
