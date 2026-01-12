import { injectable, inject } from 'tsyringe';
import { Post, PostReaction, SavedPost, PostShare, ReactionType, PostPrivacy, MediaType } from '@prisma/client';
import { PostRepository, PostWithDetails } from '@modules/post/post.repository.js';
import { CacheService } from '@infrastructure/cache.service.js';
import { NotFoundError, ForbiddenError } from '@common/errors.js';
import { CONSTANTS } from '@common/constants.js';

interface CreatePostData {
  authorId: string;
  content: string;
  privacy?: PostPrivacy;
  media?: Array<{
    type: MediaType;
    url: string;
    thumbnail?: string;
    width?: number;
    height?: number;
    duration?: number;
    size?: number;
    metadata?: Record<string, any>;
  }>;
  mentions?: string[];
}

interface UpdatePostData {
  content: string;
  privacy?: PostPrivacy;
}

interface FeedResult {
  posts: PostWithDetails[];
  nextCursor: string | null;
  hasMore: boolean;
}

@injectable()
export class PostService {
  constructor(
    @inject('PostRepository') private postRepository: PostRepository,
    @inject('CacheService') private cacheService: CacheService
  ) {}

  async createPost(data: CreatePostData): Promise<Post> {
    // Create post with media and mentions in a transaction
    const post = await this.postRepository.prisma.$transaction(async (tx) => {
      const createdPost = await tx.post.create({
        data: {
          authorId: data.authorId,
          content: data.content,
          privacy: data.privacy || PostPrivacy.PUBLIC,
          ...(data.media &&
            data.media.length > 0 && {
              media: {
                createMany: {
                  data: data.media,
                },
              },
            }),
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

      return createdPost;
    });

    // Invalidate author's timeline cache
    await this.invalidateUserCache(data.authorId);

    // Fan-out on write: Update followers' feed cache in background
    this.fanOutToFollowers(post.id, data.authorId).catch((err) =>
      console.error('Feed fan-out error:', err)
    );

    return post;
  }

  async getPost(id: string, userId?: string): Promise<PostWithDetails> {
    // Try cache first
    const cacheKey = CONSTANTS.REDIS_KEYS.CACHED_POST(id);
    const cached = await this.cacheService.get<PostWithDetails>(cacheKey);

    if (cached) {
      return cached;
    }

    const post = await this.postRepository.findById(id, userId);

    if (!post || post.deletedAt) {
      throw new NotFoundError('Post not found');
    }

    // Cache for 30 minutes
    await this.cacheService.setWithExpiry(cacheKey, post, CONSTANTS.CACHE_TTL.POST);

    return post;
  }

  async updatePost(id: string, userId: string, data: UpdatePostData): Promise<Post> {
    const post = await this.postRepository.findById(id);

    if (!post || post.deletedAt) {
      throw new NotFoundError('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenError('You can only edit your own posts');
    }

    const updated = await this.postRepository.update(id, {
      content: data.content,
      privacy: data.privacy,
      editedAt: new Date(),
    });

    // Invalidate cache
    await this.invalidatePostCache(id);
    await this.invalidateUserCache(userId);

    return updated;
  }

  async deletePost(id: string, userId: string): Promise<void> {
    const post = await this.postRepository.findById(id);

    if (!post || post.deletedAt) {
      throw new NotFoundError('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenError('You can only delete your own posts');
    }

    await this.postRepository.softDelete(id);

    // Invalidate caches
    await this.invalidatePostCache(id);
    await this.invalidateUserCache(userId);
  }

  // ============================================================================
  // REACTIONS
  // ============================================================================

  async reactToPost(postId: string, userId: string, type: ReactionType): Promise<PostReaction> {
    const post = await this.postRepository.findById(postId);

    if (!post || post.deletedAt) {
      throw new NotFoundError('Post not found');
    }

    // Check if user already reacted
    const existingReaction = await this.postRepository.findReaction(postId, userId);

    // Use upsert for idempotency
    const reaction = await this.postRepository.createReaction(postId, userId, type);

    // Only increment if it's a new reaction (not just changing type)
    if (!existingReaction) {
      await this.postRepository.incrementMetric(postId, 'likesCount');
    }

    // Invalidate post cache
    await this.invalidatePostCache(postId);

    return reaction;
  }

  async updateReaction(postId: string, userId: string, type: ReactionType): Promise<PostReaction> {
    const post = await this.postRepository.findById(postId);

    if (!post || post.deletedAt) {
      throw new NotFoundError('Post not found');
    }

    // Check if user has already reacted
    const existingReaction = await this.postRepository.findReaction(postId, userId);

    if (!existingReaction) {
      throw new NotFoundError('You have not reacted to this post');
    }

    // Update the reaction type
    const reaction = await this.postRepository.createReaction(postId, userId, type);

    // Invalidate post cache
    await this.invalidatePostCache(postId);

    return reaction;
  }

  async unreactToPost(postId: string, userId: string): Promise<void> {
    const post = await this.postRepository.findById(postId);

    if (!post || post.deletedAt) {
      throw new NotFoundError('Post not found');
    }

    const reaction = await this.postRepository.deleteReaction(postId, userId);

    if (reaction) {
      await this.postRepository.decrementMetric(postId, 'likesCount');
      await this.invalidatePostCache(postId);
    }
  }

  async getPostReactions(
    postId: string,
    type?: ReactionType,
    cursor?: string,
    limit: number = 50
  ): Promise<{ reactions: PostReaction[]; nextCursor: string | null; hasMore: boolean }> {
    const reactions = await this.postRepository.getReactionsByType(postId, type, cursor, limit);

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
  // SAVE/BOOKMARK
  // ============================================================================

  async savePost(userId: string, postId: string): Promise<SavedPost> {
    const post = await this.postRepository.findById(postId);

    if (!post || post.deletedAt) {
      throw new NotFoundError('Post not found');
    }

    return this.postRepository.savePost(userId, postId);
  }

  async unsavePost(userId: string, postId: string): Promise<void> {
    await this.postRepository.unsavePost(userId, postId);
  }

  async getSavedPosts(userId: string, cursor?: string, limit: number = 20): Promise<FeedResult> {
    const savedPosts = await this.postRepository.findSavedPosts(userId, cursor, limit);

    const hasMore = savedPosts.length > limit;
    const items = hasMore ? savedPosts.slice(0, limit) : savedPosts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Extract posts from savedPost relationship
    const posts = items.map((sp: any) => sp.post) as PostWithDetails[];

    return {
      posts,
      nextCursor,
      hasMore,
    };
  }

  // ============================================================================
  // SHARE
  // ============================================================================

  async sharePost(
    postId: string,
    userId: string,
    caption?: string,
    groupId?: string
  ): Promise<PostShare> {
    const post = await this.postRepository.findById(postId);

    if (!post || post.deletedAt) {
      throw new NotFoundError('Post not found');
    }

    const share = await this.postRepository.sharePost(postId, userId, caption, groupId);

    // Increment share count
    await this.postRepository.incrementMetric(postId, 'sharesCount');
    await this.invalidatePostCache(postId);

    return share;
  }

  // ============================================================================
  // FEED AGGREGATION
  // ============================================================================

  async getFeed(
    userId: string,
    type: 'following' | 'discover' | 'trending' = 'following',
    cursor?: string,
    limit: number = 20
  ): Promise<FeedResult> {
    // Try cache first for following feed
    if (type === 'following' && !cursor) {
      const cacheKey = CONSTANTS.REDIS_KEYS.USER_FEED(userId);
      const cached = await this.cacheService.get<FeedResult>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    let posts: PostWithDetails[];

    switch (type) {
      case 'following':
        posts = await this.postRepository.getFollowingFeed(userId, cursor, limit);
        break;
      case 'discover':
        posts = await this.postRepository.getDiscoverFeed(userId, cursor, limit);
        break;
      case 'trending':
        posts = await this.getTrendingPosts(userId, cursor, limit);
        break;
      default:
        posts = await this.postRepository.getFollowingFeed(userId, cursor, limit);
    }

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const result = {
      posts: items,
      nextCursor,
      hasMore,
    };

    // Cache following feed for 5 minutes
    if (type === 'following' && !cursor) {
      await this.cacheService.setWithExpiry(
        CONSTANTS.REDIS_KEYS.USER_FEED(userId),
        result,
        300 // 5 minutes
      );
    }

    return result;
  }

  async getUserPosts(
    authorId: string,
    viewerId?: string,
    cursor?: string,
    limit: number = 20
  ): Promise<FeedResult> {
    const posts = await this.postRepository.getUserPosts(authorId, viewerId, cursor, limit);

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      posts: items,
      nextCursor,
      hasMore,
    };
  }

  // ============================================================================
  // MODERATION
  // ============================================================================

  async reportPost(postId: string, userId: string, reason: string): Promise<void> {
    const post = await this.postRepository.findById(postId);

    if (!post || post.deletedAt) {
      throw new NotFoundError('Post not found');
    }

    // Create a report in the reports table
    await this.postRepository.prisma.report.create({
      data: {
        reporterId: userId,
        reportedId: post.authorId,
        reason: `Post Report (${postId}): ${reason}`,
        status: 'PENDING',
      },
    });

    // Flag the post if not already flagged
    if (!post.isFlagged) {
      await this.postRepository.flagPost(postId, reason, userId);
      await this.invalidatePostCache(postId);
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async getTrendingPosts(
    userId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<PostWithDetails[]> {
    // Trending = high engagement in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.postRepository.findMany(
      {
        status: 'ACTIVE',
        deletedAt: null,
        privacy: 'PUBLIC',
        createdAt: { gte: oneDayAgo },
        OR: [{ likesCount: { gte: 10 } }, { commentsCount: { gte: 5 } }, { sharesCount: { gte: 3 } }],
      },
      { cursor, limit, userId }
    );
  }

  private async fanOutToFollowers(postId: string, authorId: string): Promise<void> {
    // Get all followers of the author
    const followers = await this.postRepository.prisma.follow.findMany({
      where: { followingId: authorId },
      select: { followerId: true },
    });

    // Calculate engagement score
    const score = Date.now() / 1000; // Simple timestamp-based score

    // Insert into feed cache for each follower
    const feedCacheEntries = followers.map((follower) => ({
      userId: follower.followerId,
      postId,
      score,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days TTL
    }));

    if (feedCacheEntries.length > 0) {
      await this.postRepository.prisma.feedCache.createMany({
        data: feedCacheEntries,
        skipDuplicates: true,
      });
    }

    // Invalidate followers' feed caches in Redis
    await Promise.all(
      followers.map((follower) => this.invalidateUserCache(follower.followerId))
    );
  }

  private async invalidatePostCache(postId: string): Promise<void> {
    await this.cacheService.delete(CONSTANTS.REDIS_KEYS.CACHED_POST(postId));
  }

  private async invalidateUserCache(userId: string): Promise<void> {
    await this.cacheService.delete(CONSTANTS.REDIS_KEYS.USER_FEED(userId));
  }
}
