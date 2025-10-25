import { Router } from 'express';
import { container } from '@config/container.js';
import { MessageController } from '@controllers/MessageController.js';
import { authenticate } from '@middlewares/auth.middleware.js';
import { validate } from '@middlewares/validation.middleware.js';
import { messageLimiter } from '@middlewares/rateLimit.middleware.js';
import { sendMessageSchema, editMessageSchema, reactToMessageSchema } from '@validations/index.js';

const router = Router();
const messageController = container.resolve(MessageController);

router.use(authenticate);

router.post('/', messageLimiter, validate(sendMessageSchema), messageController.sendMessage);
router.get('/:id', messageController.getMessage);
router.get('/group/:groupId', messageController.getGroupMessages);
router.get('/direct/:userId', messageController.getDirectMessages);
router.patch('/:id', validate(editMessageSchema), messageController.editMessage);
router.delete('/:id', messageController.deleteMessage);
router.post('/:id/react', validate(reactToMessageSchema), messageController.addReaction);
router.delete('/:id/react', validate(reactToMessageSchema), messageController.removeReaction);

export { router as messageRoutes };
