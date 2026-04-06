import { injectable } from 'tsyringe';
import { Prisma, Conversation as PrismaConversation } from '@prisma/client';
import { BaseRepository } from '../../infrastructure/base.repository';

@injectable()
export class AIConversationRepository extends BaseRepository {
  async create(data: Prisma.ConversationUncheckedCreateInput): Promise<PrismaConversation> {
    return this.db.conversation.create({
      data,
    });
  }

  async findById(id: string): Promise<PrismaConversation | null> {
    return this.db.conversation.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string, skip: number, take: number): Promise<PrismaConversation[]> {
    return this.db.conversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async update(id: string, data: Prisma.ConversationUpdateInput): Promise<PrismaConversation> {
    return this.db.conversation.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<PrismaConversation> {
    return this.db.conversation.delete({
      where: { id },
    });
  }
}