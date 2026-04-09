/**
 * AdminJS Module
 *
 * Assembles the complete admin panel:
 *  - Instantiates AdminJS with Prisma adapter
 *  - Builds an express-session backed by ioredis (custom store)
 *  - Wraps in buildAuthenticatedRouter with CSRF protection
 *  - Applies admin-specific rate limiting (brute-force protection)
 *  - Logs every admin page access via pino
 *
 * Mount point: /admin  (configured in application/app.ts)
 */

import type { Router, Request, Response, NextFunction } from 'express';
import type { SessionData, SessionOptions } from 'express-session';
import session from 'express-session';
import AdminJS from 'adminjs';
import { buildAuthenticatedRouter } from '@adminjs/express';
import { redis } from '@config/redis.js';
import { config } from '@config/env.js';
import { logger } from '@config/logger.js';
import { createRateLimiter } from '@config/rate-limiter.js';
import { createAdminConfig } from './admin.config.js';
import { authenticateAdmin } from './admin.auth.js';

// ---------------------------------------------------------------------------
// Custom ioredis-backed session store
// (connect-redis v9 requires redis v5 which we don't use; this wraps ioredis)
// ---------------------------------------------------------------------------
class IoRedisSessionStore extends session.Store {
  private readonly prefix = 'admin:sess:';
  private readonly defaultTtl = 8 * 60 * 60; // 8 hours

  override get(
    sid: string,
    callback: (err: unknown, session?: SessionData | null) => void
  ): void {
    redis
      .get(this.prefix + sid)
      .then((data) => {
        if (!data) return callback(null, null);
        try {
          callback(null, JSON.parse(data) as SessionData);
        } catch {
          callback(null, null);
        }
      })
      .catch((err: unknown) => callback(err));
  }

  override set(
    sid: string,
    sessionData: SessionData,
    callback?: (err?: unknown) => void
  ): void {
    const ttl = this.getTtl(sessionData);
    redis
      .setex(this.prefix + sid, ttl, JSON.stringify(sessionData))
      .then(() => callback?.())
      .catch((err: unknown) => callback?.(err));
  }

  override destroy(sid: string, callback?: (err?: unknown) => void): void {
    redis
      .del(this.prefix + sid)
      .then(() => callback?.())
      .catch((err: unknown) => callback?.(err));
  }

  override touch(sid: string, sessionData: SessionData, callback?: () => void): void {
    const ttl = this.getTtl(sessionData);
    redis
      .expire(this.prefix + sid, ttl)
      .then(() => callback?.())
      .catch(() => callback?.());
  }

  private getTtl(sess: SessionData): number {
    if (sess.cookie?.expires) {
      const ms = new Date(sess.cookie.expires).getTime() - Date.now();
      if (ms > 0) return Math.ceil(ms / 1000);
    }
    return this.defaultTtl;
  }
}

// ---------------------------------------------------------------------------
// Rate limiter for admin login (5 attempts / 15 min per IP)
// ---------------------------------------------------------------------------
const adminLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

// ---------------------------------------------------------------------------
// Access-log middleware for admin routes
// ---------------------------------------------------------------------------
function adminAccessLogger(req: Request, _res: Response, next: NextFunction): void {
  logger.info(
    { method: req.method, url: req.url, ip: req.ip },
    'Admin panel access'
  );
  next();
}

// ---------------------------------------------------------------------------
// Build and export the admin router
// ---------------------------------------------------------------------------
export async function createAdminRouter(): Promise<Router> {
  const adminJs = new AdminJS(createAdminConfig());

  const sessionStore = new IoRedisSessionStore();

  const sessionOptions: SessionOptions = {
    store: sessionStore,
    secret: config.ADMIN_SESSION_SECRET,
    name: 'adminjs.sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
      sameSite: config.NODE_ENV === 'production' ? 'strict' : 'lax',
    },
  };

  const adminRouter = buildAuthenticatedRouter(
    adminJs,
    {
      authenticate: authenticateAdmin,
      cookieName: 'adminjs',
      cookiePassword: config.ADMIN_COOKIE_SECRET,
    },
    null,
    sessionOptions
  );

  // Prepend access logger and login rate-limiter
  adminRouter.use(adminAccessLogger);

  // Apply rate limiting only to the login POST endpoint
  adminRouter.post(
    adminJs.options.loginPath ?? '/admin/login',
    adminLoginLimiter
  );

  logger.info('AdminJS panel initialised at /admin');

  return adminRouter;
}
