import { z } from 'zod';

export const createGroupSchema = z.object({
  title: z.string().min(1, 'Group title is required').max(100, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  cover: z.string().url('Invalid cover URL').optional(),
  type: z.enum(['PRIVATE', 'PUBLIC', 'SECRET']).default('PRIVATE'),
});

export const updateGroupSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  cover: z.string().url().optional(),
  type: z.enum(['PRIVATE', 'PUBLIC', 'SECRET']).optional(),
});

export const addGroupMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['MEMBER', 'ADMIN']).default('MEMBER'),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type AddGroupMemberInput = z.infer<typeof addGroupMemberSchema>;
