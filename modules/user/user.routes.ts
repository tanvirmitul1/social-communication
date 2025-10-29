import { Router } from 'express';
import { container } from '@application/container.js';
import { UserController } from '@modules/user/user.controller.js';
import { authenticate } from '@middlewares/auth-guard.js';

const router: Router = Router();
const userController = container.resolve(UserController);

router.use(authenticate);

router.get('/', userController.searchUsers);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.get('/:id/presence', userController.getUserPresence);

export { router as userRoutes };
