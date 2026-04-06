/**
 * PushNotificationService — Firebase Cloud Messaging (FCM) integration.
 *
 * Required env vars (all optional — service degrades gracefully without them):
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *
 * Called by NotificationService after persisting a Notification row so every
 * user with registered device tokens also receives an OS push.
 */

import * as admin from 'firebase-admin';
import { injectable } from 'tsyringe';
import { config } from '@config/env.js';
import { logger } from '@config/logger.js';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

@injectable()
export class PushNotificationService {
  private readonly app: admin.app.App | null = null;
  private readonly isConfigured: boolean;

  constructor() {
    const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = config as any;

    this.isConfigured = !!(FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY);

    if (this.isConfigured) {
      try {
        // Reuse existing app if already initialised (hot-reload safety)
        this.app = admin.apps.length
          ? admin.app()
          : admin.initializeApp({
              credential: admin.credential.cert({
                projectId: FIREBASE_PROJECT_ID,
                clientEmail: FIREBASE_CLIENT_EMAIL,
                // Env vars store \n as a literal string; replace to get real newlines
                privateKey: (FIREBASE_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
              }),
            });
        logger.info('PushNotificationService: Firebase Admin initialised');
      } catch (err) {
        logger.warn({ err }, 'PushNotificationService: Failed to initialise Firebase Admin');
      }
    } else {
      logger.warn('PushNotificationService: Firebase env vars not set — push disabled');
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /** Send to a single device token. Silently swaps invalid tokens. */
  async sendToToken(token: string, payload: PushPayload): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      await admin.messaging(this.app!).send({
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: payload.data,
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      });
      return true;
    } catch (err: any) {
      // FCM returns these codes for stale / unregistered tokens
      if (
        err?.errorInfo?.code === 'messaging/registration-token-not-registered' ||
        err?.errorInfo?.code === 'messaging/invalid-registration-token'
      ) {
        logger.debug({ token }, 'PushNotificationService: stale token — should be cleaned up');
        return false;
      }
      logger.warn({ err }, 'PushNotificationService: sendToToken failed');
      return false;
    }
  }

  /**
   * Send to multiple tokens (up to 500 per FCM batch limit).
   * Returns the list of tokens that failed so callers can clean them up.
   */
  async sendToTokens(tokens: string[], payload: PushPayload): Promise<string[]> {
    if (!this.isReady() || tokens.length === 0) return [];

    const failedTokens: string[] = [];
    const BATCH = 500;

    for (let i = 0; i < tokens.length; i += BATCH) {
      const batch = tokens.slice(i, i + BATCH);
      try {
        const response = await admin.messaging(this.app!).sendEachForMulticast({
          tokens: batch,
          notification: {
            title: payload.title,
            body: payload.body,
            ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
          },
          data: payload.data,
          android: { priority: 'high' },
          apns: { payload: { aps: { sound: 'default', badge: 1 } } },
        });

        response.responses.forEach((res, idx) => {
          if (!res.success) {
            const code = (res.error as any)?.code ?? (res.error as any)?.errorInfo?.code ?? '';
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              failedTokens.push(batch[idx]);
            }
          }
        });
      } catch (err) {
        logger.warn({ err }, 'PushNotificationService: batch send failed');
      }
    }

    return failedTokens;
  }

  /**
   * Send a push to all registered device tokens of a given user.
   * Cleans up stale tokens automatically.
   */
  async sendToUser(
    userId: string,
    payload: PushPayload,
    getTokens: (userId: string) => Promise<string[]>,
    removeTokens: (tokens: string[]) => Promise<void>
  ): Promise<void> {
    if (!this.isReady()) return;

    const tokens = await getTokens(userId);
    if (tokens.length === 0) return;

    const staleTokens = await this.sendToTokens(tokens, payload);
    if (staleTokens.length > 0) {
      await removeTokens(staleTokens).catch((err) =>
        logger.warn({ err }, 'PushNotificationService: failed to clean stale tokens')
      );
    }
  }

  // ============================================================================
  // PRIVATE
  // ============================================================================

  private isReady(): boolean {
    return this.isConfigured && this.app !== null;
  }
}
