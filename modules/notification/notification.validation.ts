import { z } from 'zod';

export const markManyAsReadSchema = z.object({
  ids: z.array(z.string().uuid('Each id must be a valid UUID')).min(1).max(100),
});

export const getNotificationsSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
