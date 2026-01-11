import { Router } from 'express';
import { container } from '@application/container.js';
import { UserController } from '@modules/user/user.controller.js';
import { PostController } from '@modules/post/post.controller.js';
import { authenticate } from '@middlewares/auth-guard.js';
import { validate } from '@middlewares/validation.js';
import { friendRequestRoutes } from '@modules/user/friend-request.routes.js';
import { getUserPostsSchema } from '@modules/post/post.validation.js';

const router: Router = Router();
const userController = container.resolve(UserController);
const postController = container.resolve(PostController);

// Public routes (no authentication required)
router.get('/', userController.searchUsers);

// Protected routes (authentication required)
router.get('/:id', authenticate, userController.getUser);
router.patch('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, userController.deleteUser);
router.get('/:id/presence', authenticate, userController.getUserPresence);

// User posts
router.get('/:userId/posts', validate(getUserPostsSchema), postController.getUserPosts);

// Mount friend request routes under /users/:id/friend-requests
router.use('/friend-requests', authenticate, friendRequestRoutes);

export { router as userRoutes };