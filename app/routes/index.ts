import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { userRoutes } from './user.routes.js';
import { messageRoutes } from './message.routes.js';
import { groupRoutes } from './group.routes.js';
import { callRoutes } from './call.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/messages', messageRoutes);
router.use('/groups', groupRoutes);
router.use('/calls', callRoutes);

export { router as apiRoutes };
