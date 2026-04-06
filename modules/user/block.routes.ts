import { Router } from 'express';
import { container } from '@application/container.js';
import { BlockController } from './block.controller.js';
import { authenticate } from '@middlewares/auth-guard.js';
import { validate } from '@middlewares/validation.js';
import { createRateLimiter } from '@config/rate-limiter.js';
import { z } from 'zod';

const router: Router = Router();
const ctrl = container.resolve(BlockController);

const blockLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });

const blockUserSchema = z.object({
  userId: z.string().uuid('userId must be a valid UUID'),
  reason: z.string().max(500).optional(),
});

router.use(authenticate);

router.get('/', ctrl.getBlockedUsers);
router.post('/', blockLimiter, validate(blockUserSchema), ctrl.blockUser);
router.get('/:userId/status', ctrl.checkBlocked);
router.delete('/:userId', blockLimiter, ctrl.unblockUser);

export { router as blockRoutes };
