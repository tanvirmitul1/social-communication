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
  getFeedSchema,
  reactToPostSchema,
  updateReactionSchema,
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
router.get('/feed', authenticate, validate(getFeedSchema), postController.getFeed);

// Get saved posts
router.get('/saved', authenticate, validate(getSavedPostsSchema), postController.getSavedPosts);

// Create post
router.post('/', authenticate, validate(createPostSchema), postController.createPost);

// Get single post
router.get('/:id', validate(getPostSchema), postController.getPost);

// Update post
router.patch('/:id', authenticate, validate(updatePostSchema), postController.updatePost);

// Delete post
router.delete('/:id', authenticate, validate(deletePostSchema), postController.deletePost);

// ============================================================================
// POST REACTIONS
// ============================================================================

router.post('/:id/react', authenticate, validate(reactToPostSchema), postController.reactToPost);

router.put('/:id/react', authenticate, validate(updateReactionSchema), postController.updateReaction);

router.delete('/:id/react', authenticate, validate(unreactToPostSchema), postController.unreactToPost);

router.get('/:id/reactions', validate(getPostReactionsSchema), postController.getPostReactions);

// ============================================================================
// SAVE/BOOKMARK
// ============================================================================

router.post('/:id/save', authenticate, validate(savePostSchema), postController.savePost);

router.delete('/:id/save', authenticate, validate(unsavePostSchema), postController.unsavePost);

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
