import { injectable } from 'tsyringe';
import { Prisma, ChatMessage as PrismaChatMessage } from '@prisma/client';
import { BaseRepository } from '../../infrastructure/base.repository';

@injectable()
export class AIChatMessageRepository extends BaseRepository {
  async create(data: Prisma.ChatMessageUncheckedCreateInput): Promise<PrismaChatMessage> {
    return this.db.chatMessage.create({
      data,
    });
  }

  async findById(id: string): Promise<PrismaChatMessage | null> {
    return this.db.chatMessage.findUnique({
      where: { id },
    });
  }

  async findByConversationId(
    conversationId: string,
    skip: number,
    take: number
  ): Promise<PrismaChatMessage[]> {
    return this.db.chatMessage.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' },
      skip,
      take,
    });
  }

  async getConversationHistory(conversationId: string, limit: number = 10): Promise<PrismaChatMessage[]> {
    return this.db.chatMessage.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async update(id: string, data: Prisma.ChatMessageUpdateInput): Promise<PrismaChatMessage> {
    return this.db.chatMessage.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<PrismaChatMessage> {
    return this.db.chatMessage.delete({
      where: { id },
    });
  }
}