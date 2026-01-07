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

// Extended emoji set for richer reactions
export const extendedEmojiSet = [
  '👍', '👎', '❤️', '🔥', '😂', '😢', '😮', '👏', '🙏', '🤔',
  '🎉', '💯', '😢', '😡', '😍', '🤩', '🥳', '😎', '😭', '😴',
  '🤯', '🥶', '😱', '🤠', '🥴', '😈', '👻', '👽', '🤖', '👾',
  '👋', '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟',
  '🤘', '👌', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐',
  '🖖', '👋', '🤙', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻',
  '👃', '🧠', '🦷', '🦴', '👀', '👁', '👅', '👄', '👶', '🧒',
  '👦', '👧', '🧑', '👱', '👨', '🧔', '👨', '👲', '🧕', '👩',
  '🧓', '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🧏',
  '🙇', '🤦', '🤷', '👮', '🕵', '💂', '🥷', '👷', '🤴', '👸',
  '👳', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶',
  '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '💆',
  '💇', '🚶', '🧍', '🧎', '🏃', '💃', '🕺', '🕴', '👯', '🧖',
  '🧗', '🤺', '🏇', '⛷', '🏂', '🏌', '🏄', '🚣', '🏊', '⛹',
  '🏋', '🚴', '🚵', '🤸', '🤼', '🤽', '🤾', '🤹', '🧘', '🛀',
  '🛌', '🧑', '👭', '👫', '👬', '💏', '💑', '👪', '🗣', '👤',
  '👥', '🫂', '👣', '🦰', '🦱', '🦳', '🦲', '🐵', '🐒', '🦍',
  '🦧', '🐶', '🐕', '🦮', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈',
  '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🦬',
  '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑'
];

export const forwardMessageSchema = z.object({
  originalMessageId: z.string().uuid(),
  groupId: z.string().uuid().optional(),
  receiverId: z.string().uuid().optional(),
}).refine((data) => data.groupId || data.receiverId, {
  message: 'Either groupId or receiverId must be provided',
});

export const getChatListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type ReactToMessageInput = z.infer<typeof reactToMessageSchema>;
export type ForwardMessageInput = z.infer<typeof forwardMessageSchema>;
export type GetChatListInput = z.infer<typeof getChatListSchema>;
