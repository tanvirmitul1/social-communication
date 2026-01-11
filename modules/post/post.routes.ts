import { Router } from 'express';
import { container } from '@application/container.js';
import { PostController } from '@modules/post/post.controller.js';
import { authenticate } from '@middlewares/auth-guard.js';
import { validate } from '@middlewares/validation.js';
import {
  createPostSchema,
  updatePostSchema,
  getPostSchema,
  deletePostSchema,
  getUserPostsSchema,
  getFeedSchema,
  reactToPostSchema,
  unreactToPostSchema,
  getPostReactionsSchema,
  savePostSchema,
  unsavePostSchema,
  getSavedPostsSchema,
  sharePostSchema,
  reportPostSchema,
} from '@modules/post/post.validation.js';
import { commentRoutes } from '@modules/comment/comment.routes.js';

const router: Router = Router();
const postController = container.resolve(PostController);

// ============================================================================
// POST CRUD
// ============================================================================

// Get personalized feed (must be before /:id to avoid route conflict)
router.get('/feed', authenticate, validate(getFeedSchema, 'query'), postController.getFeed);

// Get saved posts
router.get('/saved', authenticate, validate(getSavedPostsSchema, 'query'), postController.getSavedPosts);

// Create post
router.post('/', authenticate, validate(createPostSchema, 'body'), postController.createPost);

// Get single post
router.get('/:id', validate(getPostSchema, 'params'), postController.getPost);

// Update post
router.patch('/:id', authenticate, validate(updatePostSchema), postController.updatePost);

// Delete post
router.delete('/:id', authenticate, validate(deletePostSchema, 'params'), postController.deletePost);

// ============================================================================
// POST REACTIONS
// ============================================================================

router.post('/:id/react', authenticate, validate(reactToPostSchema), postController.reactToPost);

router.delete('/:id/react', authenticate, validate(unreactToPostSchema, 'params'), postController.unreactToPost);

router.get('/:id/reactions', validate(getPostReactionsSchema), postController.getPostReactions);

// ============================================================================
// SAVE/BOOKMARK
// ============================================================================

router.post('/:id/save', authenticate, validate(savePostSchema, 'params'), postController.savePost);

router.delete('/:id/save', authenticate, validate(unsavePostSchema, 'params'), postController.unsavePost);

// ============================================================================
// SHARE
// ============================================================================

router.post('/:id/share', authenticate, validate(sharePostSchema), postController.sharePost);

// ============================================================================
// MODERATION
// ============================================================================

router.post('/:id/report', authenticate, validate(reportPostSchema), postController.reportPost);

// ============================================================================
// COMMENTS (nested routes)
// ============================================================================

// Mount comment routes under /posts/:postId/comments
router.use('/:postId/comments', commentRoutes);

export { router as postRoutes };
