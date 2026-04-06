import { Router } from 'express';
import { container } from '@application/container.js';
import { UserController } from '@modules/user/user.controller.js';
import { PostController } from '@modules/post/post.controller.js';
import { UserSettingsController } from '@modules/user/user-settings.controller.js';
import { authenticate } from '@middlewares/auth-guard.js';
import { validate } from '@middlewares/validation.js';
import { friendRequestRoutes } from '@modules/user/friend-request.routes.js';
import { getUserPostsSchema } from '@modules/post/post.validation.js';

const router: Router = Router();
const userController = container.resolve(UserController);
const postController = container.resolve(PostController);
const settingsController = container.resolve(UserSettingsController);

// Public routes (no authentication required)
router.get('/', userController.searchUsers);

// Protected routes (authentication required)
// Note: /suggestions must come before /:id to avoid route conflict
router.get('/suggestions', authenticate, userController.getUserSuggestions);
router.get('/:id', authenticate, userController.getUser);
router.get('/:id/preview', authenticate, userController.getProfilePreview);
router.patch('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, userController.deleteUser);
router.get('/:id/presence', authenticate, userController.getUserPresence);

// User posts
router.get('/:userId/posts', validate(getUserPostsSchema), postController.getUserPosts);

// User settings (must be before /:id to avoid conflict)
router.get('/settings', authenticate, settingsController.getSettings);
router.patch('/settings', authenticate, settingsController.updateSettings);

// Mount friend request routes under /users/:id/friend-requests
router.use('/friend-requests', authenticate, friendRequestRoutes);

export { router as userRoutes };