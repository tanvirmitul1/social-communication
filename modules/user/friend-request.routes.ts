import { Router } from 'express';
import { container } from '@application/container.js';
import { FriendRequestController } from '@modules/user/friend-request.controller.js';
import { authenticate } from '@middlewares/auth-guard.js';
import { validate } from '@middlewares/validation.js';
import { createRateLimiter } from '@config/rate-limiter.js';
import { 
  sendFriendRequestSchema, 
  friendRequestIdSchema 
} from '@modules/user/friend-request.validation.js';

const router: Router = Router();
const friendRequestController = container.resolve(FriendRequestController);

// Apply authentication middleware to all routes
router.use(authenticate);

// Rate limiters
const generalRateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 10 });
const getRateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 30 });

// Friend request routes
router.post(
  '/',
  generalRateLimiter,
  validate(sendFriendRequestSchema),
  friendRequestController.sendFriendRequest
);

router.post(
  '/:id/accept',
  generalRateLimiter,
  validate(friendRequestIdSchema, 'params'),
  friendRequestController.acceptFriendRequest
);

router.post(
  '/:id/reject',
  generalRateLimiter,
  validate(friendRequestIdSchema, 'params'),
  friendRequestController.rejectFriendRequest
);

router.post(
  '/:id/cancel',
  generalRateLimiter,
  validate(friendRequestIdSchema, 'params'),
  friendRequestController.cancelFriendRequest
);

router.get(
  '/pending',
  getRateLimiter,
  friendRequestController.getPendingFriendRequests
);

export { router as friendRequestRoutes };