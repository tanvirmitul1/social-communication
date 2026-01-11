import { z } from 'zod';
import { ReactionType } from '@prisma/client';

// Comment Validation Schemas
export const createCommentSchema = z.object({
  params: z.object({
    postId: z.string().uuid('Invalid post ID'),
  }),
  body: z.object({
    content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
    parentId: z.string().uuid('Invalid parent comment ID').optional(),
    mentions: z.array(z.string().uuid('Invalid user ID')).max(20).optional(),
  }),
});

export const updateCommentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid comment ID'),
  }),
  body: z.object({
    content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  }),
});

export const deleteCommentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid comment ID'),
  }),
});

export const getCommentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid comment ID'),
  }),
});

export const getPostCommentsSchema = z.object({
  params: z.object({
    postId: z.string().uuid('Invalid post ID'),
  }),
  query: z.object({
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    parentId: z.string().uuid().optional(), // For getting replies to a specific comment
  }),
});

export const getRepliesSchema = z.object({
  params: z.object({
    commentId: z.string().uuid('Invalid comment ID'),
  }),
  query: z.object({
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

// Comment Reaction Schemas
export const reactToCommentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid comment ID'),
  }),
  body: z.object({
    type: z.nativeEnum(ReactionType),
  }),
});

export const unreactToCommentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid comment ID'),
  }),
});

export const getCommentReactionsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid comment ID'),
  }),
  query: z.object({
    type: z.nativeEnum(ReactionType).optional(),
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});
