import { Router } from 'express';
import { container } from '@application/container.js';
import { MessageController } from '@modules/message/message.controller.js';
import { authenticate } from '@middlewares/auth-guard.js';
import { validate } from '@middlewares/validation.js';
import { messageLimiter } from '@config/rate-limiter.js';
import { sendMessageSchema, editMessageSchema, reactToMessageSchema } from '@validations/index.js';

const router: Router = Router();
const messageController = container.resolve(MessageController);

router.use(authenticate);

router.post('/', messageLimiter, validate(sendMessageSchema), messageController.sendMessage);
router.get('/search', messageController.searchMessages);
router.get('/group/:groupId', messageController.getGroupMessages);
router.get('/direct/:otherUserId', messageController.getDirectMessages);
router.get('/:id', messageController.getMessage);
router.patch('/:id', validate(editMessageSchema), messageController.editMessage);
router.delete('/:id', messageController.deleteMessage);
router.post('/:id/delivered', messageController.markAsDelivered);
router.post('/:id/seen', messageController.markAsSeen);
router.post('/:id/react', validate(reactToMessageSchema), messageController.addReaction);
router.delete('/:id/react', validate(reactToMessageSchema), messageController.removeReaction);

export { router as messageRoutes };
