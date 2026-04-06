import { Router } from 'express';
import { container } from '@application/container.js';
import { NotificationController } from './notification.controller.js';
import { authenticate } from '@middlewares/auth-guard.js';
import { validate } from '@middlewares/validation.js';
import { createRateLimiter } from '@config/rate-limiter.js';
import { markManyAsReadSchema } from './notification.validation.js';

const router: Router = Router();
const ctrl = container.resolve(NotificationController);

// Rate limiter: 60 read/write ops per minute per IP
const notifLimiter = createRateLimiter({ windowMs: 60_000, max: 60 });

router.use(authenticate);

// GET
router.get('/', ctrl.getNotifications);
router.get('/unread-count', ctrl.getUnreadCount);

// PATCH — mark as read (order matters: specific paths before :id)
router.patch('/read', notifLimiter, validate(markManyAsReadSchema), ctrl.markManyAsRead);
router.patch('/read-all', notifLimiter, ctrl.markAllAsRead);
router.patch('/:id/read', notifLimiter, ctrl.markAsRead);

// DELETE
router.delete('/', ctrl.deleteAllNotifications);
router.delete('/:id', ctrl.deleteNotification);

export { router as notificationRoutes };
