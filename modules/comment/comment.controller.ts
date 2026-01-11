import { injectable, inject } from 'tsyringe';
import { Response } from 'express';
import { CommentService } from '@modules/comment/comment.service.js';
import { ResponseHandler } from '@common/utils.js';
import { AuthRequest } from '@middlewares/auth-guard.js';

@injectable()
export class CommentController {
  constructor(@inject('CommentService') private commentService: CommentService) {
    this.createComment = this.createComment.bind(this);
    this.getComment = this.getComment.bind(this);
    this.updateComment = this.updateComment.bind(this);
    this.deleteComment = this.deleteComment.bind(this);
    this.getPostComments = this.getPostComments.bind(this);
    this.getReplies = this.getReplies.bind(this);
    this.reactToComment = this.reactToComment.bind(this);
    this.unreactToComment = this.unreactToComment.bind(this);
    this.getCommentReactions = this.getCommentReactions.bind(this);
  }

  /**
   * @swagger
   * /posts/{postId}/comments:
   *   post:
   *     summary: Create a comment on a post
   *     tags: [Comments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: postId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - content
   *             properties:
   *               content:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 5000
   *               parentId:
   *                 type: string
   *                 format: uuid
   *                 description: ID of parent comment for nested replies
   *               mentions:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: uuid
   *     responses:
   *       201:
   *         description: Comment created successfully
   */
  async createComment(req: AuthRequest, res: Response): Promise<Response> {
    const { postId } = req.params;
    const userId = req.user!.id;
    const { content, parentId, mentions } = req.body;

    const comment = await this.commentService.createComment({
      postId,
      authorId: userId,
      content,
      parentId,
      mentions,
    });

    return ResponseHandler.created(res, comment, 'Comment created successfully');
  }

  /**
   * @swagger
   * /comments/{id}:
   *   get:
   *     summary: Get a comment by ID
   *     tags: [Comments]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Comment retrieved successfully
   */
  async getComment(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const userId = req.user?.id;

    const comment = await this.commentService.getComment(id, userId);
    return ResponseHandler.success(res, comment);
  }

  /**
   * @swagger
   * /comments/{id}:
   *   patch:
   *     summary: Update a comment
   *     tags: [Comments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - content
   *             properties:
   *               content:
   *                 type: string
   *     responses:
   *       200:
   *         description: Comment updated successfully
   */
  async updateComment(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const userId = req.user!.id;
    const { content } = req.body;

    const comment = await this.commentService.updateComment(id, userId, { content });
    return ResponseHandler.success(res, comment, 'Comment updated successfully');
  }

  /**
   * @swagger
   * /comments/{id}:
   *   delete:
   *     summary: Delete a comment
   *     tags: [Comments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Comment deleted successfully
   */
  async deleteComment(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const userId = req.user!.id;

    await this.commentService.deleteComment(id, userId);
    return ResponseHandler.success(res, null, 'Comment deleted successfully');
  }

  /**
   * @swagger
   * /posts/{postId}/comments:
   *   get:
   *     summary: Get comments for a post
   *     tags: [Comments]
   *     parameters:
   *       - in: path
   *         name: postId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: cursor
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: Comments retrieved successfully
   */
  async getPostComments(req: AuthRequest, res: Response): Promise<Response> {
    const { postId } = req.params;
    const { cursor, limit = 20 } = req.query;
    const userId = req.user?.id;

    const result = await this.commentService.getPostComments(
      postId,
      userId,
      cursor as string,
      Number(limit)
    );
    return ResponseHandler.success(res, result);
  }

  /**
   * @swagger
   * /comments/{commentId}/replies:
   *   get:
   *     summary: Get replies to a comment
   *     tags: [Comments]
   *     parameters:
   *       - in: path
   *         name: commentId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: cursor
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: Replies retrieved successfully
   */
  async getReplies(req: AuthRequest, res: Response): Promise<Response> {
    const { commentId } = req.params;
    const { cursor, limit = 20 } = req.query;
    const userId = req.user?.id;

    const result = await this.commentService.getReplies(
      commentId,
      userId,
      cursor as string,
      Number(limit)
    );
    return ResponseHandler.success(res, result);
  }

  // ============================================================================
  // REACTIONS
  // ============================================================================

  /**
   * @swagger
   * /comments/{id}/react:
   *   post:
   *     summary: React to a comment
   *     tags: [Comments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - type
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [LIKE, LOVE, HAHA, WOW, SAD, ANGRY]
   *     responses:
   *       201:
   *         description: Reaction added successfully
   */
  async reactToComment(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const userId = req.user!.id;
    const { type } = req.body;

    const reaction = await this.commentService.reactToComment(id, userId, type);
    return ResponseHandler.created(res, reaction, 'Reaction added successfully');
  }

  /**
   * @swagger
   * /comments/{id}/react:
   *   delete:
   *     summary: Remove reaction from a comment
   *     tags: [Comments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Reaction removed successfully
   */
  async unreactToComment(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const userId = req.user!.id;

    await this.commentService.unreactToComment(id, userId);
    return ResponseHandler.success(res, null, 'Reaction removed successfully');
  }

  /**
   * @swagger
   * /comments/{id}/reactions:
   *   get:
   *     summary: Get comment reactions
   *     tags: [Comments]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [LIKE, LOVE, HAHA, WOW, SAD, ANGRY]
   *     responses:
   *       200:
   *         description: Reactions retrieved successfully
   */
  async getCommentReactions(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { type, cursor, limit = 50 } = req.query;

    const result = await this.commentService.getCommentReactions(
      id,
      type as any,
      cursor as string,
      Number(limit)
    );
    return ResponseHandler.success(res, result);
  }
}
