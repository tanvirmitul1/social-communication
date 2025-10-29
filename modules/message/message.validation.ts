import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(5000, 'Message is too long'),
  type: z.enum(['TEXT', 'IMAGE', 'FILE', 'VOICE', 'VIDEO']).default('TEXT'),
  groupId: z.string().uuid().optional(),
  receiverId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const editMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(5000, 'Message is too long'),
});

export const reactToMessageSchema = z.object({
  emoji: z.string().min(1).max(10),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type ReactToMessageInput = z.infer<typeof reactToMessageSchema>;
