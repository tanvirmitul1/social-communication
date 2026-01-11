import { injectable } from 'tsyringe';
import { Comment, CommentReaction, Prisma, ReactionType } from '@prisma/client';
import { BaseRepository } from '@infrastructure/base.repository.js';

export interface CommentWithDetails extends Comment {
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
  _count: {
    reactions: number;
    replies: number;
  };
  userReaction?: ReactionType | null;
}

@injectable()
export class CommentRepository extends BaseRepository {
  async create(data: Prisma.CommentCreateInput): Promise<Comment> {
    return this.db.comment.create({ data });
  }

  async findById(id: string, userId?: string): Promise<CommentWithDetails | null> {
    const comment = await this.db.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
        ...(userId && {
          reactions: {
            where: { userId },
            select: { type: true },
          },
        }),
      },
    });

    if (!comment) return null;

    const { reactions, ...commentData } = comment as any;
    return {
      ...commentData,
      userReaction: reactions?.[0]?.type || null,
    };
  }

  async findMany(
    where: Prisma.CommentWhereInput,
    options: {
      cursor?: string;
      limit: number;
      userId?: string;
    }
  ): Promise<CommentWithDetails[]> {
    const comments = await this.db.comment.findMany({
      where,
      take: options.limit + 1,
      ...(options.cursor && {
        cursor: { id: options.cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
        ...(options.userId && {
          reactions: {
            where: { userId: options.userId },
            select: { type: true },
          },
        }),
      },
    });

    return comments.map((comment: any) => {
      const { reactions, ...commentData } = comment;
      return {
        ...commentData,
        userReaction: reactions?.[0]?.type || null,
      };
    });
  }

  async update(id: string, data: Prisma.CommentUpdateInput): Promise<Comment> {
    return this.db.comment.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Comment> {
    return this.db.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async incrementMetric(
    id: string,
    metric: 'likesCount' | 'repliesCount',
    value: number = 1
  ): Promise<void> {
    await this.db.comment.update({
      where: { id },
      data: {
        [metric]: {
          increment: value,
        },
      },
    });
  }

  async decrementMetric(
    id: string,
    metric: 'likesCount' | 'repliesCount',
    value: number = 1
  ): Promise<void> {
    await this.db.comment.update({
      where: { id },
      data: {
        [metric]: {
          decrement: value,
        },
      },
    });
  }

  // Get top-level comments for a post
  async getPostComments(
    postId: string,
    cursor?: string,
    limit: number = 20,
    userId?: string
  ): Promise<CommentWithDetails[]> {
    return this.findMany(
      {
        postId,
        parentId: null, // Only top-level comments
        deletedAt: null,
      },
      { cursor, limit, userId }
    );
  }

  // Get replies to a specific comment
  async getReplies(
    parentId: string,
    cursor?: string,
    limit: number = 20,
    userId?: string
  ): Promise<CommentWithDetails[]> {
    return this.findMany(
      {
        parentId,
        deletedAt: null,
      },
      { cursor, limit, userId }
    );
  }

  // Reaction methods
  async createReaction(
    commentId: string,
    userId: string,
    type: ReactionType
  ): Promise<CommentReaction> {
    return this.db.commentReaction.upsert({
      where: {
        commentId_userId: { commentId, userId },
      },
      create: {
        commentId,
        userId,
        type,
      },
      update: {
        type,
      },
    });
  }

  async deleteReaction(commentId: string, userId: string): Promise<CommentReaction | null> {
    try {
      return await this.db.commentReaction.delete({
        where: {
          commentId_userId: { commentId, userId },
        },
      });
    } catch (error) {
      return null;
    }
  }

  async findReaction(commentId: string, userId: string): Promise<CommentReaction | null> {
    return this.db.commentReaction.findUnique({
      where: {
        commentId_userId: { commentId, userId },
      },
    });
  }

  async getReactionsByType(
    commentId: string,
    type?: ReactionType,
    cursor?: string,
    limit: number = 50
  ): Promise<CommentReaction[]> {
    return this.db.commentReaction.findMany({
      where: {
        commentId,
        ...(type && { type }),
      },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  // Cascade update post's comment count
  async incrementPostCommentCount(postId: string): Promise<void> {
    await this.db.post.update({
      where: { id: postId },
      data: {
        commentsCount: {
          increment: 1,
        },
      },
    });
  }

  async decrementPostCommentCount(postId: string): Promise<void> {
    await this.db.post.update({
      where: { id: postId },
      data: {
        commentsCount: {
          decrement: 1,
        },
      },
    });
  }
}
