import { Router } from 'express';
import { container } from '@config/container.js';
import { UserController } from '@controllers/UserController.js';
import { authenticate } from '@middlewares/auth.middleware.js';

const router = Router();
const userController = container.resolve(UserController);

router.use(authenticate);

router.get('/', userController.searchUsers);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.get('/:id/presence', userController.getUserPresence);

export { router as userRoutes };
