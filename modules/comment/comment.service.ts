import { injectable, inject } from 'tsyringe';
import { Comment, CommentReaction, ReactionType } from '@prisma/client';
import { CommentRepository, CommentWithDetails } from '@modules/comment/comment.repository.js';
import { CacheService } from '@infrastructure/cache.service.js';
import { NotFoundError, ForbiddenError } from '@common/errors.js';
import { CONSTANTS } from '@common/constants.js';

interface CreateCommentData {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string;
  mentions?: string[];
}

interface UpdateCommentData {
  content: string;
}

interface CommentResult {
  comments: CommentWithDetails[];
  nextCursor: string | null;
  hasMore: boolean;
}

@injectable()
export class CommentService {
  constructor(
    @inject('CommentRepository') private commentRepository: CommentRepository,
    @inject('CacheService') private cacheService: CacheService
  ) {}

  async createComment(data: CreateCommentData): Promise<Comment> {
    // Verify post exists
    const post = await this.commentRepository.prisma.post.findUnique({
      where: { id: data.postId },
    });

    if (!post || post.deletedAt) {
      throw new NotFoundError('Post not found');
    }

    // Verify parent comment exists if provided
    if (data.parentId) {
      const parentComment = await this.commentRepository.findById(data.parentId);
      if (!parentComment || parentComment.deletedAt) {
        throw new NotFoundError('Parent comment not found');
      }

      // Ensure parent belongs to same post
      if (parentComment.postId !== data.postId) {
        throw new ForbiddenError('Parent comment does not belong to this post');
      }
    }

    // Create comment in transaction
    const comment = await this.commentRepository.prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          postId: data.postId,
          authorId: data.authorId,
          content: data.content,
          parentId: data.parentId,
          ...(data.mentions &&
            data.mentions.length > 0 && {
              mentions: {
                createMany: {
                  data: data.mentions.map((userId) => ({
                    mentionedId: userId,
                  })),
                },
              },
            }),
        },
      });

      // Increment parent comment's reply count if it's a reply
      if (data.parentId) {
        await tx.comment.update({
          where: { id: data.parentId },
          data: {
            repliesCount: {
              increment: 1,
            },
          },
        });
      }

      // Increment post's comment count
      await tx.post.update({
        where: { id: data.postId },
        data: {
          commentsCount: {
            increment: 1,
          },
        },
      });

      return newComment;
    });

    // Invalidate caches
    await this.invalidatePostCache(data.postId);
    if (data.parentId) {
      await this.invalidateCommentCache(data.parentId);
    }

    return comment;
  }

  async getComment(id: string, userId?: string): Promise<CommentWithDetails> {
    const cacheKey = CONSTANTS.REDIS_KEYS.CACHED_COMMENT(id);
    const cached = await this.cacheService.get<CommentWithDetails>(cacheKey);

    if (cached) {
      return cached;
    }

    const comment = await this.commentRepository.findById(id, userId);

    if (!comment || comment.deletedAt) {
      throw new NotFoundError('Comment not found');
    }

    // Cache for 15 minutes
    await this.cacheService.setWithExpiry(cacheKey, comment, CONSTANTS.CACHE_TTL.COMMENT);

    return comment;
  }

  async updateComment(id: string, userId: string, data: UpdateCommentData): Promise<Comment> {
    const comment = await this.commentRepository.findById(id);

    if (!comment || comment.deletedAt) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenError('You can only edit your own comments');
    }

    const updated = await this.commentRepository.update(id, {
      content: data.content,
      editedAt: new Date(),
    });

    // Invalidate cache
    await this.invalidateCommentCache(id);
    await this.invalidatePostCache(comment.postId);

    return updated;
  }

  async deleteComment(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findById(id);

    if (!comment || comment.deletedAt) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenError('You can only delete your own comments');
    }

    await this.commentRepository.prisma.$transaction(async (tx) => {
      // Soft delete comment
      await tx.comment.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Decrement parent comment's reply count if it's a reply
      if (comment.parentId) {
        await tx.comment.update({
          where: { id: comment.parentId },
          data: {
            repliesCount: {
              decrement: 1,
            },
          },
        });
      }

      // Decrement post's comment count
      await tx.post.update({
        where: { id: comment.postId },
        data: {
          commentsCount: {
            decrement: 1,
          },
        },
      });
    });

    // Invalidate caches
    await this.invalidateCommentCache(id);
    await this.invalidatePostCache(comment.postId);
    if (comment.parentId) {
      await this.invalidateCommentCache(comment.parentId);
    }
  }

  // Get top-level comments for a post
  async getPostComments(
    postId: string,
    userId?: string,
    cursor?: string,
    limit: number = 20
  ): Promise<CommentResult> {
    const comments = await this.commentRepository.getPostComments(postId, cursor, limit, userId);

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, limit) : comments;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      comments: items,
      nextCursor,
      hasMore,
    };
  }

  // Get replies to a comment
  async getReplies(
    commentId: string,
    userId?: string,
    cursor?: string,
    limit: number = 20
  ): Promise<CommentResult> {
    const replies = await this.commentRepository.getReplies(commentId, cursor, limit, userId);

    const hasMore = replies.length > limit;
    const items = hasMore ? replies.slice(0, limit) : replies;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      comments: items,
      nextCursor,
      hasMore,
    };
  }

  // ============================================================================
  // REACTIONS
  // ============================================================================

  async reactToComment(
    commentId: string,
    userId: string,
    type: ReactionType
  ): Promise<CommentReaction> {
    const comment = await this.commentRepository.findById(commentId);

    if (!comment || comment.deletedAt) {
      throw new NotFoundError('Comment not found');
    }

    const existingReaction = await this.commentRepository.findReaction(commentId, userId);

    // Upsert reaction (idempotent)
    const reaction = await this.commentRepository.createReaction(commentId, userId, type);

    // Only increment if it's a new reaction
    if (!existingReaction) {
      await this.commentRepository.incrementMetric(commentId, 'likesCount');
    }

    // Invalidate cache
    await this.invalidateCommentCache(commentId);

    return reaction;
  }

  async unreactToComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);

    if (!comment || comment.deletedAt) {
      throw new NotFoundError('Comment not found');
    }

    const reaction = await this.commentRepository.deleteReaction(commentId, userId);

    if (reaction) {
      await this.commentRepository.decrementMetric(commentId, 'likesCount');
      await this.invalidateCommentCache(commentId);
    }
  }

  async getCommentReactions(
    commentId: string,
    type?: ReactionType,
    cursor?: string,
    limit: number = 50
  ): Promise<{ reactions: CommentReaction[]; nextCursor: string | null; hasMore: boolean }> {
    const reactions = await this.commentRepository.getReactionsByType(
      commentId,
      type,
      cursor,
      limit
    );

    const hasMore = reactions.length > limit;
    const items = hasMore ? reactions.slice(0, limit) : reactions;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      reactions: items,
      nextCursor,
      hasMore,
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async invalidateCommentCache(commentId: string): Promise<void> {
    await this.cacheService.delete(CONSTANTS.REDIS_KEYS.CACHED_COMMENT(commentId));
    await this.cacheService.delete(CONSTANTS.REDIS_KEYS.COMMENT_REACTIONS(commentId));
  }

  private async invalidatePostCache(postId: string): Promise<void> {
    await this.cacheService.delete(CONSTANTS.REDIS_KEYS.CACHED_POST(postId));
  }
}
