import { Router } from 'express';
import { container } from '@application/container.js';
import { UserController } from '@modules/user/user.controller.js';
import { authenticate } from '@middlewares/auth-guard.js';
import { friendRequestRoutes } from '@modules/user/friend-request.routes.js';

const router: Router = Router();
const userController = container.resolve(UserController);

router.use(authenticate);

router.get('/', userController.searchUsers);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.get('/:id/presence', userController.getUserPresence);

// Mount friend request routes under /users/:id/friend-requests
router.use('/friend-requests', friendRequestRoutes);

export { router as userRoutes };