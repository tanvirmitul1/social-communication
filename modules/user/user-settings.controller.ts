import { injectable, inject } from 'tsyringe';
import { Response } from 'express';
import { z } from 'zod';
import { UserSettingsService } from './user-settings.service.js';
import { ResponseHandler } from '@common/utils.js';
import { AuthRequest } from '@middlewares/auth-guard.js';

const updateSettingsSchema = z.object({
  notifyMessages:      z.boolean().optional(),
  notifyMentions:      z.boolean().optional(),
  notifyReactions:     z.boolean().optional(),
  notifyFriendRequests: z.boolean().optional(),
  notifyCalls:         z.boolean().optional(),
  showOnlineStatus:    z.boolean().optional(),
  allowFriendRequests: z.boolean().optional(),
  theme:               z.enum(['light', 'dark', 'system']).optional(),
  language:            z.string().min(2).max(10).optional(),
});

@injectable()
export class UserSettingsController {
  constructor(
    @inject('UserSettingsService') private settingsService: UserSettingsService
  ) {
    this.getSettings = this.getSettings.bind(this);
    this.updateSettings = this.updateSettings.bind(this);
  }

  /**
   * @swagger
   * /users/settings:
   *   get:
   *     summary: Get current user's settings (auto-created with defaults on first access)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Settings retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data: { $ref: '#/components/schemas/UserSettings' }
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   */
  async getSettings(req: AuthRequest, res: Response): Promise<Response> {
    const settings = await this.settingsService.getSettings(req.user!.id);
    return ResponseHandler.success(res, settings);
  }

  /**
   * @swagger
   * /users/settings:
   *   patch:
   *     summary: Update current user's settings (partial update — only send fields you want to change)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               notifyMessages: { type: boolean }
   *               notifyMentions: { type: boolean }
   *               notifyReactions: { type: boolean }
   *               notifyFriendRequests: { type: boolean }
   *               notifyCalls: { type: boolean }
   *               showOnlineStatus: { type: boolean }
   *               allowFriendRequests: { type: boolean }
   *               theme: { type: string, enum: [light, dark, system] }
   *               language: { type: string, minLength: 2, maxLength: 10, example: en }
   *     responses:
   *       200:
   *         description: Settings updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 message: { type: string, example: Settings updated successfully }
   *                 data: { $ref: '#/components/schemas/UserSettings' }
   *       400:
   *         description: Validation error (e.g. invalid theme value)
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   */
  async updateSettings(req: AuthRequest, res: Response): Promise<Response> {
    const data = updateSettingsSchema.parse(req.body);
    const settings = await this.settingsService.updateSettings(req.user!.id, data);
    return ResponseHandler.success(res, settings, 'Settings updated successfully');
  }
}
