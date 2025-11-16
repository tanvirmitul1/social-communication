import { z } from 'zod';

export const createStorySchema = z.object({
  mediaUrl: z.string().url(),
  mediaType: z.enum(['image', 'video']),
  caption: z.string().max(200).optional(),
  expiresIn: z.number().min(1).max(86400).default(86400), // Max 24 hours
});

export const viewStorySchema = z.object({
  storyId: z.string().uuid(),
});

export const reactToStorySchema = z.object({
  storyId: z.string().uuid(),
  emoji: z.string().min(1).max(10),
});

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type ViewStoryInput = z.infer<typeof viewStorySchema>;
export type ReactToStoryInput = z.infer<typeof reactToStorySchema>;