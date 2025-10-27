import { Router } from 'express';
import { container } from '@config/container.js';
import { CallController } from '@controllers/CallController.js';
import { authenticate } from '@middlewares/auth.middleware.js';

const router: Router = Router();
const callController = container.resolve(CallController);

router.use(authenticate);

router.post('/', callController.initiateCall);
router.get('/', callController.getUserCalls);
router.get('/:id', callController.getCall);
router.post('/:id/join', callController.joinCall);
router.post('/:id/end', callController.endCall);
router.post('/:id/leave', callController.leaveCall);
router.post('/:id/reject', callController.rejectCall);

export { router as callRoutes };
