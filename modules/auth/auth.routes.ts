import { Router } from 'express';
import { container } from '@application/container.js';
import { AuthController } from '@modules/auth/auth.controller.js';
import { validate } from '@middlewares/validation.js';
import { authenticate } from '@middlewares/auth-guard.js';
import { authLimiter } from '@config/rate-limiter.js';
import { registerSchema, loginSchema, refreshTokenSchema, logoutSchema } from './auth.validation.js';

const router: Router = Router();
const authController = container.resolve(AuthController);

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authenticate, validate(logoutSchema), authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.get('/me', authenticate, authController.getProfile);

export { router as authRoutes };
