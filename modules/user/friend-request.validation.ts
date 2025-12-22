import { z } from 'zod';

export const sendFriendRequestSchema = z.object({
  body: z.object({
    receiverId: z.string().uuid({
      message: 'Receiver ID must be a valid UUID',
    }),
  }),
});

export const friendRequestIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Friend request ID must be a valid UUID',
    }),
  }),
});

export const friendIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({
      message: 'Friend ID must be a valid UUID',
    }),
  }),
});

export type SendFriendRequestInput = z.infer<typeof sendFriendRequestSchema>['body'];
export type FriendRequestIdInput = z.infer<typeof friendRequestIdSchema>['params'];
export type FriendIdInput = z.infer<typeof friendIdSchema>['params'];