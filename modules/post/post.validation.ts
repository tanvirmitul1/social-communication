import { z } from 'zod';
import { PostPrivacy, ReactionType, MediaType } from '@prisma/client';

// Post Validation Schemas
export const createPostSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
    privacy: z.nativeEnum(PostPrivacy).optional().default(PostPrivacy.PUBLIC),
    media: z
      .array(
        z.object({
          type: z.nativeEnum(MediaType),
          url: z.string().url('Invalid media URL'),
          thumbnail: z.string().url().optional(),
          width: z.number().int().positive().optional(),
          height: z.number().int().positive().optional(),
          duration: z.number().int().positive().optional(),
          size: z.number().int().positive().optional(),
          metadata: z.record(z.any()).optional(),
        })
      )
      .max(10, 'Maximum 10 media items allowed')
      .optional(),
    mentions: z.array(z.string().uuid('Invalid user ID')).max(50, 'Maximum 50 mentions').optional(),
  }),
});

export const updatePostSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid post ID'),
  }),
  body: z.object({
    content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
    privacy: z.nativeEnum(PostPrivacy).optional(),
  }),
});

export const getPostSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid post ID'),
  }),
});

export const deletePostSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid post ID'),
  }),
});

export const getUserPostsSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
  query: z.object({
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

export const getFeedSchema = z.object({
  query: z.object({
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    type: z.enum(['following', 'discover', 'trending']).optional().default('following'),
  }),
});

// Reaction Validation Schemas
export const reactToPostSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid post ID'),
  }),
  body: z.object({
    type: z.nativeEnum(ReactionType, { errorMap: () => ({ message: 'Invalid reaction type' }) }),
  }),
});

export const unreactToPostSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid post ID'),
  }),
});

export const getPostReactionsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid post ID'),
  }),
  query: z.object({
    type: z.nativeEnum(ReactionType).optional(),
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});

// Save/Bookmark Post Schemas
export const savePostSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid post ID'),
  }),
});

export const unsavePostSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid post ID'),
  }),
});

export const getSavedPostsSchema = z.object({
  query: z.object({
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

// Share Post Schema
export const sharePostSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid post ID'),
  }),
  body: z.object({
    caption: z.string().max(1000).optional(),
    groupId: z.string().uuid().optional(),
  }),
});

// Report Post Schema (Moderation)
export const reportPostSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid post ID'),
  }),
  body: z.object({
    reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
  }),
});
