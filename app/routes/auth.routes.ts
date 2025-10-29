import { Router } from 'express';
import { container } from '@config/container.js';
import { AuthController } from '@controllers/AuthController.js';
import { validate } from '@middlewares/validation.middleware.js';
import { authenticate } from '@middlewares/auth.middleware.js';
import { authLimiter } from '@middlewares/rateLimit.middleware.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '@validations/index.js';

const router: Router = Router();
const authController = container.resolve(AuthController);

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authenticate, validate(refreshTokenSchema), authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.get('/me', authenticate, authController.getProfile);

export { router as authRoutes };
