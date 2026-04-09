import { Router } from 'express';
import multer from 'multer';
import { container } from '@application/container.js';
import { MessageController } from '@modules/message/message.controller.js';
import { authenticate } from '@middlewares/auth-guard.js';
import { validate } from '@middlewares/validation.js';
import { messageLimiter } from '@config/rate-limiter.js';
import {
  sendMessageSchema,
  editMessageSchema,
  reactToMessageSchema,
  forwardMessageSchema,
  getChatListSchema,
} from './message.validation.js';

const router: Router = Router();
const messageController = container.resolve(MessageController);

// Multer configuration for message file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max per file
    files: 5, // Max 5 files per message
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      // Videos
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/avi',
      // Audio
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac', 'audio/m4a',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-rar-compressed',
      'text/plain',
      'text/csv',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

router.use(authenticate);

router.post('/', messageLimiter, validate(sendMessageSchema), messageController.sendMessage);
router.post('/with-files', messageLimiter, upload.array('files', 5), messageController.sendMessageWithFiles);
router.get('/chats', validate(getChatListSchema, 'query'), messageController.getChatList);
router.get('/search', messageController.searchMessages);
router.get('/group/:groupId', messageController.getGroupMessages);
router.get('/group/:groupId/pinned', messageController.getGroupPinnedMessages);
router.get('/direct/:otherUserId', messageController.getDirectMessages);
router.get('/direct/:otherUserId/pinned', messageController.getDirectPinnedMessages);
router.get('/:id', messageController.getMessage);
router.patch('/:id', validate(editMessageSchema), messageController.editMessage);
router.delete('/:id', messageController.deleteMessage);
router.post('/:id/delivered', messageController.markAsDelivered);
router.post('/:id/seen', messageController.markAsSeen);
router.post('/:id/react', validate(reactToMessageSchema), messageController.addReaction);
router.delete('/:id/react', validate(reactToMessageSchema), messageController.removeReaction);
router.get('/:id/reactions', messageController.getMessageReactions);
router.get('/:id/reaction', messageController.getUserReaction);
router.post('/:id/forward', validate(forwardMessageSchema), messageController.forwardMessage);
router.post('/:id/pin', messageController.pinMessage);
router.delete('/:id/pin', messageController.unpinMessage);

export { router as messageRoutes };
