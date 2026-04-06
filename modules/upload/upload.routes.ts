import { Router } from 'express';
import multer from 'multer';
import { container } from '@application/container.js';
import { UploadController } from './upload.controller.js';
import { authenticate } from '@middlewares/auth-guard.js';
import { createRateLimiter } from '@config/rate-limiter.js';

const router: Router = Router();
const ctrl = container.resolve(UploadController);

// Store files in memory (buffer) — passed directly to Cloudinary
const storage = multer.memoryStorage();

// Shared multer instance; per-route size limits are enforced in UploadService
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB hard cap — UploadService enforces tighter per-type limits
    files: 1,
  },
});

// Rate limiter: 20 uploads per minute per IP
const uploadLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

router.use(authenticate);
router.use(uploadLimiter);

router.post('/image', upload.single('file'), ctrl.uploadImage);
router.post('/video', upload.single('file'), ctrl.uploadVideo);
router.post('/file', upload.single('file'), ctrl.uploadFile);
router.post('/avatar', upload.single('file'), ctrl.uploadAvatar);

export { router as uploadRoutes };
