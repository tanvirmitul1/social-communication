import { z } from 'zod';

export const executeAgentSchema = z.object({
  userInput: z.string().min(1, 'User input is required').max(10000, 'User input is too long'),
  conversationId: z.string().uuid().optional(),
});

export const getConversationHistorySchema = z.object({
  conversationId: z.string().uuid(),
});

export const getUserConversationsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});