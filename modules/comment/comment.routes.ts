import { Router } from 'express';
import { container } from '@application/container.js';
import { CommentController } from '@modules/comment/comment.controller.js';
import { authenticate } from '@middlewares/auth-guard.js';
import { validate } from '@middlewares/validation.js';
import {
  createCommentSchema,
  updateCommentSchema,
  deleteCommentSchema,
  getCommentSchema,
  getPostCommentsSchema,
  getRepliesSchema,
  reactToCommentSchema,
  unreactToCommentSchema,
  getCommentReactionsSchema,
} from '@modules/comment/comment.validation.js';

const router: Router = Router({ mergeParams: true }); // Merge params from parent router
const commentController = container.resolve(CommentController);

// ============================================================================
// COMMENT CRUD
// ============================================================================

// Get comments for a post
router.get('/', validate(getPostCommentsSchema), commentController.getPostComments);

// Create comment on a post
router.post('/', authenticate, validate(createCommentSchema), commentController.createComment);

// ============================================================================
// STANDALONE COMMENT ROUTES (accessed via /api/v1/comments/:id)
// ============================================================================

// Get single comment
router.get('/:id', validate(getCommentSchema, 'params'), commentController.getComment);

// Update comment
router.patch('/:id', authenticate, validate(updateCommentSchema), commentController.updateComment);

// Delete comment
router.delete('/:id', authenticate, validate(deleteCommentSchema, 'params'), commentController.deleteComment);

// Get replies to a comment
router.get('/:commentId/replies', validate(getRepliesSchema), commentController.getReplies);

// ============================================================================
// COMMENT REACTIONS
// ============================================================================

router.post('/:id/react', authenticate, validate(reactToCommentSchema), commentController.reactToComment);

router.delete('/:id/react', authenticate, validate(unreactToCommentSchema, 'params'), commentController.unreactToComment);

router.get('/:id/reactions', validate(getCommentReactionsSchema), commentController.getCommentReactions);

export { router as commentRoutes };
