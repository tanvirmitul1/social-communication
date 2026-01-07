import { injectable, inject } from 'tsyringe';
import { Message, MessageStatus, MessageType, Prisma } from '@prisma/client';
import { MessageRepository } from '@modules/message/message.repository.js';
import { CacheService } from '@infrastructure/cache.service.js';
import { NotFoundError, ForbiddenError } from '@common/errors.js';
import { CONSTANTS } from '@common/constants.js';
import { Helpers } from '@common/utils.js';

interface SendMessageData {
  senderId: string;
  content: string;
  type?: MessageType;
  groupId?: string;
  receiverId?: string;
  parentId?: string;
  metadata?: Record<string, unknown>;
}

interface ForwardMessageData {
  originalMessageId: string;
  senderId: string;
  groupId?: string;
  receiverId?: string;
}

@injectable()
export class MessageService {
  constructor(
    @inject('MessageRepository') private messageRepository: MessageRepository,
    @inject('CacheService') private cacheService: CacheService
  ) {}

  async sendMessage(data: SendMessageData): Promise<Message> {
    const message = await this.messageRepository.create({
      sender: { connect: { id: data.senderId } },
      content: data.content,
      type: data.type || MessageType.TEXT,
      ...(data.groupId && { group: { connect: { id: data.groupId } } }),
      ...(data.receiverId && { receiverId: data.receiverId }),
      ...(data.parentId && { parent: { connect: { id: data.parentId } } }),
      ...(data.metadata && { metadata: data.metadata as Prisma.InputJsonValue }),
    });

    // Cache message
    await this.cacheService.setWithExpiry(
      CONSTANTS.REDIS_KEYS.CACHED_MESSAGE(message.id),
      message,
      CONSTANTS.CACHE_TTL.MESSAGE
    );

    return message;
  }

  async getMessage(id: string): Promise<Message> {
    // Try cache first
    const cacheKey = CONSTANTS.REDIS_KEYS.CACHED_MESSAGE(id);
    const cached = await this.cacheService.get<Message>(cacheKey);
    if (cached) {
      return cached;
    }

    const message = await this.messageRepository.findById(id);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Cache message
    await this.cacheService.setWithExpiry(cacheKey, message, CONSTANTS.CACHE_TTL.MESSAGE);

    return message;
  }

  async getGroupMessages(
    groupId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    messages: Message[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { skip, take } = Helpers.paginate(page, limit);
    const messages = await this.messageRepository.findGroupMessages(groupId, skip, take);
    const total = await this.messageRepository.count({
      groupId,
      deletedAt: null,
    });

    return { messages, total, page, limit };
  }

  async getDirectMessages(
    userId1: string,
    userId2: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    messages: Message[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { skip, take } = Helpers.paginate(page, limit);
    const messages = await this.messageRepository.findDirectMessages(userId1, userId2, skip, take);
    const total = await this.messageRepository.count({
      deletedAt: null,
      OR: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    });

    return { messages, total, page, limit };
  }

  async editMessage(messageId: string, userId: string, content: string): Promise<Message> {
    const message = await this.getMessage(messageId);

    if (message.senderId !== userId) {
      throw new ForbiddenError('You can only edit your own messages');
    }

    const updatedMessage = await this.messageRepository.update(messageId, {
      content,
      editedAt: new Date(),
    });

    // Invalidate cache
    await this.cacheService.delete(CONSTANTS.REDIS_KEYS.CACHED_MESSAGE(messageId));

    return updatedMessage;
  }

  async deleteMessage(messageId: string, userId: string): Promise<Message> {
    const message = await this.getMessage(messageId);

    if (message.senderId !== userId) {
      throw new ForbiddenError('You can only delete your own messages');
    }

    const deletedMessage = await this.messageRepository.softDelete(messageId);

    // Invalidate cache
    await this.cacheService.delete(CONSTANTS.REDIS_KEYS.CACHED_MESSAGE(messageId));

    return deletedMessage;
  }

  async updateMessageStatus(messageId: string, status: MessageStatus): Promise<Message> {
    const message = await this.messageRepository.updateStatus(messageId, status);

    // Invalidate cache
    await this.cacheService.delete(CONSTANTS.REDIS_KEYS.CACHED_MESSAGE(messageId));

    return message;
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await this.messageRepository.addReaction(messageId, userId, emoji);

    // Invalidate cache
    await this.cacheService.delete(CONSTANTS.REDIS_KEYS.CACHED_MESSAGE(messageId));
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await this.messageRepository.removeReaction(messageId, userId, emoji);

    // Invalidate cache
    await this.cacheService.delete(CONSTANTS.REDIS_KEYS.CACHED_MESSAGE(messageId));
  }

  async getMessageReactions(messageId: string): Promise<any[]> {
    // Try cache first
    const cacheKey = `message_reactions:${messageId}`;
    const cached = await this.cacheService.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get reactions from repository
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    const reactions: any[] = (message as any).reactions || [];
    
    // Group reactions by emoji and count them
    const reactionStats: Record<string, { emoji: string; count: number; users: string[] }> = {};
    
    reactions.forEach((reaction: any) => {
      if (!reactionStats[reaction.emoji]) {
        reactionStats[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: []
        };
      }
      reactionStats[reaction.emoji].count += 1;
      reactionStats[reaction.emoji].users.push(reaction.userId);
    });

    const result = Object.values(reactionStats);
    
    // Cache results
    await this.cacheService.setWithExpiry(cacheKey, result, CONSTANTS.CACHE_TTL.MESSAGE);
    
    return result;
  }

  async getUserReaction(messageId: string, userId: string): Promise<string | null> {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    const reactions: any[] = (message as any).reactions || [];
    const userReaction = reactions.find((reaction: any) => reaction.userId === userId);
    return userReaction ? userReaction.emoji : null;
  }

  async searchMessages(
    query: string,
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    messages: Message[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { skip, take } = Helpers.paginate(page, limit);
    const messages = await this.messageRepository.searchMessages(query, userId, skip, take);
    const total = await this.messageRepository.count({
      deletedAt: null,
      content: { contains: query, mode: 'insensitive' },
      OR: [{ senderId: userId }, { receiverId: userId }],
    });

    return { messages, total, page, limit };
  }

  async forwardMessage(data: ForwardMessageData): Promise<Message> {
    const message = await this.messageRepository.forwardMessage(
      data.originalMessageId,
      data.senderId,
      data.receiverId,
      data.groupId
    );

    // Cache message
    await this.cacheService.setWithExpiry(
      CONSTANTS.REDIS_KEYS.CACHED_MESSAGE(message.id),
      message,
      CONSTANTS.CACHE_TTL.MESSAGE
    );

    return message;
  }

  async getChatList(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    chats: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { skip, take } = Helpers.paginate(page, limit);
    const { chats, total } = await this.messageRepository.getChatList(userId, skip, take);

    return { chats, total, page, limit };
  }
}
