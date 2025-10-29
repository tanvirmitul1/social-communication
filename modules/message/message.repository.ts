import { injectable } from 'tsyringe';
import { Message, Prisma, MessageStatus } from '@prisma/client';
import { BaseRepository } from '@infrastructure/base.repository.js';

@injectable()
export class MessageRepository extends BaseRepository {
  async create(data: Prisma.MessageCreateInput): Promise<Message> {
    return this.db.message.create({
      data,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<Message | null> {
    return this.db.message.findUnique({
      where: { id, deletedAt: null },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async findGroupMessages(groupId: string, skip: number, take: number): Promise<Message[]> {
    return this.db.message.findMany({
      where: {
        groupId,
        deletedAt: null,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        reactions: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async findDirectMessages(
    userId1: string,
    userId2: string,
    skip: number,
    take: number
  ): Promise<Message[]> {
    return this.db.message.findMany({
      where: {
        deletedAt: null,
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        reactions: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async update(id: string, data: Prisma.MessageUpdateInput): Promise<Message> {
    return this.db.message.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Message> {
    return this.db.message.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateStatus(id: string, status: MessageStatus): Promise<Message> {
    return this.db.message.update({
      where: { id },
      data: { status },
    });
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    return this.db.messageReaction.create({
      data: {
        messageId,
        userId,
        emoji,
      },
    });
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    return this.db.messageReaction.deleteMany({
      where: {
        messageId,
        userId,
        emoji,
      },
    });
  }

  async searchMessages(
    query: string,
    userId: string,
    skip: number,
    take: number
  ): Promise<Message[]> {
    return this.db.message.findMany({
      where: {
        deletedAt: null,
        content: {
          contains: query,
          mode: 'insensitive',
        },
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async count(where: Prisma.MessageWhereInput): Promise<number> {
    return this.db.message.count({ where });
  }
}
