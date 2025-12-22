import { Router } from 'express';
import { container } from '@application/container.js';
import { FriendRequestController } from '@modules/user/friend-request.controller.js';
import { authenticate } from '@middlewares/auth-guard.js';
import { validate } from '@middlewares/validation.js';
import { createRateLimiter } from '@config/rate-limiter.js';
import { 
  friendIdSchema 
} from '@modules/user/friend-request.validation.js';

const router: Router = Router();
const friendRequestController = container.resolve(FriendRequestController);

// Apply authentication middleware to all routes
router.use(authenticate);

// Rate limiters
const generalRateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 10 });
const getRateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 30 });

// Friends routes
router.get(
  '/',
  getRateLimiter,
  friendRequestController.getFriends
);

router.delete(
  '/:id',
  generalRateLimiter,
  validate(friendIdSchema),
  friendRequestController.removeFriend
);

export { router as friendRoutes };