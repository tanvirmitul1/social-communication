import { injectable } from 'tsyringe';
import {
  Post,
  PostReaction,
  SavedPost,
  PostShare,
  Prisma,
  PostPrivacy,
  PostStatus,
  ReactionType,
} from '@prisma/client';
import { BaseRepository } from '@infrastructure/base.repository.js';

export interface PostWithDetails extends Post {
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
  media: Array<{
    id: string;
    type: string;
    url: string;
    thumbnail: string | null;
    width: number | null;
    height: number | null;
  }>;
  _count: {
    reactions: number;
    comments: number;
    shares: number;
  };
  userReaction?: ReactionType | null;
  isSaved?: boolean;
}

@injectable()
export class PostRepository extends BaseRepository {
  async create(data: Prisma.PostCreateInput): Promise<Post> {
    return this.db.post.create({ data });
  }

  async findById(id: string, userId?: string): Promise<PostWithDetails | null> {
    const post = await this.db.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        media: {
          select: {
            id: true,
            type: true,
            url: true,
            thumbnail: true,
            width: true,
            height: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
            shares: true,
          },
        },
        ...(userId && {
          reactions: {
            where: { userId },
            select: { type: true },
          },
          savedBy: {
            where: { userId },
            select: { id: true },
          },
        }),
      },
    });

    if (!post) return null;

    // Transform to PostWithDetails
    const { reactions, savedBy, ...postData } = post as any;
    return {
      ...postData,
      userReaction: reactions?.[0]?.type || null,
      isSaved: savedBy?.length > 0 || false,
    };
  }

  async findMany(
    where: Prisma.PostWhereInput,
    options: {
      cursor?: string;
      limit: number;
      userId?: string;
    }
  ): Promise<PostWithDetails[]> {
    const posts = await this.db.post.findMany({
      where,
      take: options.limit + 1, // Fetch one extra for cursor pagination
      ...(options.cursor && {
        cursor: { id: options.cursor },
        skip: 1, // Skip the cursor itself
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
        media: {
          select: {
            id: true,
            type: true,
            url: true,
            thumbnail: true,
            width: true,
            height: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
            shares: true,
          },
        },
        ...(options.userId && {
          reactions: {
            where: { userId: options.userId },
            select: { type: true },
          },
          savedBy: {
            where: { userId: options.userId },
            select: { id: true },
          },
        }),
      },
    });

    // Transform to PostWithDetails
    return posts.map((post: any) => {
      const { reactions, savedBy, ...postData } = post;
      return {
        ...postData,
        userReaction: reactions?.[0]?.type || null,
        isSaved: savedBy?.length > 0 || false,
      };
    });
  }

  async update(id: string, data: Prisma.PostUpdateInput): Promise<Post> {
    return this.db.post.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Post> {
    return this.db.post.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: PostStatus.REMOVED,
      },
    });
  }

  async incrementMetric(
    id: string,
    metric: 'likesCount' | 'commentsCount' | 'sharesCount',
    value: number = 1
  ): Promise<void> {
    await this.db.post.update({
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
    metric: 'likesCount' | 'commentsCount' | 'sharesCount',
    value: number = 1
  ): Promise<void> {
    await this.db.post.update({
      where: { id },
      data: {
        [metric]: {
          decrement: value,
        },
      },
    });
  }

  // Reaction methods
  async createReaction(postId: string, userId: string, type: ReactionType): Promise<PostReaction> {
    return this.db.postReaction.upsert({
      where: {
        postId_userId: { postId, userId },
      },
      create: {
        postId,
        userId,
        type,
      },
      update: {
        type,
      },
    });
  }

  async deleteReaction(postId: string, userId: string): Promise<PostReaction | null> {
    try {
      return await this.db.postReaction.delete({
        where: {
          postId_userId: { postId, userId },
        },
      });
    } catch (error) {
      return null;
    }
  }

  async findReaction(postId: string, userId: string): Promise<PostReaction | null> {
    return this.db.postReaction.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });
  }

  async getReactionsByType(
    postId: string,
    type?: ReactionType,
    cursor?: string,
    limit: number = 50
  ): Promise<PostReaction[]> {
    return this.db.postReaction.findMany({
      where: {
        postId,
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

  // Saved posts methods
  async savePost(userId: string, postId: string): Promise<SavedPost> {
    return this.db.savedPost.upsert({
      where: {
        userId_postId: { userId, postId },
      },
      create: {
        userId,
        postId,
      },
      update: {},
    });
  }

  async unsavePost(userId: string, postId: string): Promise<SavedPost | null> {
    try {
      return await this.db.savedPost.delete({
        where: {
          userId_postId: { userId, postId },
        },
      });
    } catch (error) {
      return null;
    }
  }

  async findSavedPosts(userId: string, cursor?: string, limit: number = 20): Promise<SavedPost[]> {
    return this.db.savedPost.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            media: true,
            _count: {
              select: {
                reactions: true,
                comments: true,
                shares: true,
              },
            },
          },
        },
      },
    });
  }

  // Share post
  async sharePost(
    postId: string,
    userId: string,
    caption?: string,
    groupId?: string
  ): Promise<PostShare> {
    return this.db.postShare.create({
      data: {
        postId,
        sharedBy: userId,
        caption,
        sharedToGroupId: groupId,
      },
    });
  }

  // Feed queries
  async getFollowingFeed(
    userId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<PostWithDetails[]> {
    // Get posts from users that the current user follows
    const followingIds = await this.db.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const authorIds = followingIds.map((f) => f.followingId);

    return this.findMany(
      {
        authorId: { in: authorIds },
        status: PostStatus.ACTIVE,
        deletedAt: null,
        OR: [{ privacy: PostPrivacy.PUBLIC }, { privacy: PostPrivacy.FRIENDS }],
      },
      { cursor, limit, userId }
    );
  }

  async getDiscoverFeed(
    userId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<PostWithDetails[]> {
    return this.findMany(
      {
        status: PostStatus.ACTIVE,
        deletedAt: null,
        privacy: PostPrivacy.PUBLIC,
        authorId: { not: userId },
      },
      { cursor, limit, userId }
    );
  }

  async getUserPosts(
    authorId: string,
    viewerId?: string,
    cursor?: string,
    limit: number = 20
  ): Promise<PostWithDetails[]> {
    const where: Prisma.PostWhereInput = {
      authorId,
      status: PostStatus.ACTIVE,
      deletedAt: null,
    };

    // Privacy filtering based on viewer relationship
    if (viewerId !== authorId) {
      const areFriends = await this.areFriends(viewerId || '', authorId);
      where.privacy = areFriends ? { in: [PostPrivacy.PUBLIC, PostPrivacy.FRIENDS] } : PostPrivacy.PUBLIC;
    }

    return this.findMany(where, { cursor, limit, userId: viewerId });
  }

  // Helper: Check if two users are friends
  private async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friendship = await this.db.follow.findFirst({
      where: {
        OR: [
          { followerId: userId1, followingId: userId2 },
          { followerId: userId2, followingId: userId1 },
        ],
      },
    });
    return !!friendship;
  }

  // Moderation
  async flagPost(id: string, reason: string, moderatorId: string): Promise<Post> {
    return this.db.post.update({
      where: { id },
      data: {
        isFlagged: true,
        flaggedReason: reason,
        moderatedAt: new Date(),
        moderatedBy: moderatorId,
      },
    });
  }
}
