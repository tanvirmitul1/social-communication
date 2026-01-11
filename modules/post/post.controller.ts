import { injectable, inject } from 'tsyringe';
import { Response } from 'express';
import { PostService } from '@modules/post/post.service.js';
import { ResponseHandler } from '@common/utils.js';
import { AuthRequest } from '@middlewares/auth-guard.js';

@injectable()
export class PostController {
  constructor(@inject('PostService') private postService: PostService) {
    this.createPost = this.createPost.bind(this);
    this.getPost = this.getPost.bind(this);
    this.updatePost = this.updatePost.bind(this);
    this.deletePost = this.deletePost.bind(this);
    this.getUserPosts = this.getUserPosts.bind(this);
    this.getFeed = this.getFeed.bind(this);
    this.reactToPost = this.reactToPost.bind(this);
    this.unreactToPost = this.unreactToPost.bind(this);
    this.getPostReactions = this.getPostReactions.bind(this);
    this.savePost = this.savePost.bind(this);
    this.unsavePost = this.unsavePost.bind(this);
    this.getSavedPosts = this.getSavedPosts.bind(this);
    this.sharePost = this.sharePost.bind(this);
    this.reportPost = this.reportPost.bind(this);
  }

  /**
   * @swagger
   * /posts:
   *   post:
   *     summary: Create a new post
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
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
   *                 maxLength: 10000
   *               privacy:
   *                 type: string
   *                 enum: [PUBLIC, FRIENDS, PRIVATE]
   *                 default: PUBLIC
   *               media:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     type:
   *                       type: string
   *                       enum: [IMAGE, VIDEO, LINK]
   *                     url:
   *                       type: string
   *                       format: uri
   *               mentions:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: uuid
   *     responses:
   *       201:
   *         description: Post created successfully
   */
  async createPost(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { content, privacy, media, mentions } = req.body;

    const post = await this.postService.createPost({
      authorId: userId,
      content,
      privacy,
      media,
      mentions,
    });

    return ResponseHandler.created(res, post, 'Post created successfully');
  }

  /**
   * @swagger
   * /posts/{id}:
   *   get:
   *     summary: Get a post by ID
   *     tags: [Posts]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Post retrieved successfully
   */
  async getPost(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const userId = req.user?.id;

    const post = await this.postService.getPost(id, userId);
    return ResponseHandler.success(res, post);
  }

  /**
   * @swagger
   * /posts/{id}:
   *   patch:
   *     summary: Update a post
   *     tags: [Posts]
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
   *               privacy:
   *                 type: string
   *                 enum: [PUBLIC, FRIENDS, PRIVATE]
   *     responses:
   *       200:
   *         description: Post updated successfully
   */
  async updatePost(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const userId = req.user!.id;
    const { content, privacy } = req.body;

    const post = await this.postService.updatePost(id, userId, { content, privacy });
    return ResponseHandler.success(res, post, 'Post updated successfully');
  }

  /**
   * @swagger
   * /posts/{id}:
   *   delete:
   *     summary: Delete a post
   *     tags: [Posts]
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
   *         description: Post deleted successfully
   */
  async deletePost(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const userId = req.user!.id;

    await this.postService.deletePost(id, userId);
    return ResponseHandler.success(res, null, 'Post deleted successfully');
  }

  /**
   * @swagger
   * /users/{userId}/posts:
   *   get:
   *     summary: Get posts by a user
   *     tags: [Posts]
   *     parameters:
   *       - in: path
   *         name: userId
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
   *         description: Posts retrieved successfully
   */
  async getUserPosts(req: AuthRequest, res: Response): Promise<Response> {
    const { userId } = req.params;
    const { cursor, limit = 20 } = req.query;
    const viewerId = req.user?.id;

    const result = await this.postService.getUserPosts(
      userId,
      viewerId,
      cursor as string,
      Number(limit)
    );
    return ResponseHandler.success(res, result);
  }

  /**
   * @swagger
   * /posts/feed:
   *   get:
   *     summary: Get personalized feed
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [following, discover, trending]
   *           default: following
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
   *         description: Feed retrieved successfully
   */
  async getFeed(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { type = 'following', cursor, limit = 20 } = req.query;

    const result = await this.postService.getFeed(
      userId,
      type as 'following' | 'discover' | 'trending',
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
   * /posts/{id}/react:
   *   post:
   *     summary: React to a post
   *     tags: [Posts]
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
  async reactToPost(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const userId = req.user!.id;
    const { type } = req.body;

    const reaction = await this.postService.reactToPost(id, userId, type);
    return ResponseHandler.created(res, reaction, 'Reaction added successfully');
  }

  /**
   * @swagger
   * /posts/{id}/react:
   *   delete:
   *     summary: Remove reaction from a post
   *     tags: [Posts]
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
  async unreactToPost(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const userId = req.user!.id;

    await this.postService.unreactToPost(id, userId);
    return ResponseHandler.success(res, null, 'Reaction removed successfully');
  }

  /**
   * @swagger
   * /posts/{id}/reactions:
   *   get:
   *     summary: Get post reactions
   *     tags: [Posts]
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
  async getPostReactions(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const { type, cursor, limit = 50 } = req.query;

    const result = await this.postService.getPostReactions(
      id,
      type as any,
      cursor as string,
      Number(limit)
    );
    return ResponseHandler.success(res, result);
  }

  // ============================================================================
  // SAVE/BOOKMARK
  // ============================================================================

  /**
   * @swagger
   * /posts/{id}/save:
   *   post:
   *     summary: Save/bookmark a post
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   */
  async savePost(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const userId = req.user!.id;

    const saved = await this.postService.savePost(userId, id);
    return ResponseHandler.created(res, saved, 'Post saved successfully');
  }

  /**
   * @swagger
   * /posts/{id}/save:
   *   delete:
   *     summary: Unsave a post
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   */
  async unsavePost(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const userId = req.user!.id;

    await this.postService.unsavePost(userId, id);
    return ResponseHandler.success(res, null, 'Post unsaved successfully');
  }

  /**
   * @swagger
   * /posts/saved:
   *   get:
   *     summary: Get saved posts
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   */
  async getSavedPosts(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { cursor, limit = 20 } = req.query;

    const result = await this.postService.getSavedPosts(userId, cursor as string, Number(limit));
    return ResponseHandler.success(res, result);
  }

  // ============================================================================
  // SHARE
  // ============================================================================

  /**
   * @swagger
   * /posts/{id}/share:
   *   post:
   *     summary: Share a post
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   */
  async sharePost(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const userId = req.user!.id;
    const { caption, groupId } = req.body;

    const share = await this.postService.sharePost(id, userId, caption, groupId);
    return ResponseHandler.created(res, share, 'Post shared successfully');
  }

  // ============================================================================
  // MODERATION
  // ============================================================================

  /**
   * @swagger
   * /posts/{id}/report:
   *   post:
   *     summary: Report a post
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   */
  async reportPost(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;
    const userId = req.user!.id;
    const { reason } = req.body;

    await this.postService.reportPost(id, userId, reason);
    return ResponseHandler.success(res, null, 'Post reported successfully');
  }
}
