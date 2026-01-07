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

  async forwardMessage(
    originalMessageId: string,
    senderId: string,
    receiverId?: string,
    groupId?: string
  ): Promise<Message> {
    // First, get the original message
    const originalMessage = await this.findById(originalMessageId);
    if (!originalMessage) {
      throw new Error('Original message not found');
    }

    // Create a new message with forwarded content
    return this.db.message.create({
      data: {
        senderId,
        content: originalMessage.content,
        type: originalMessage.type,
        ...(originalMessage.metadata && { metadata: originalMessage.metadata }),
        ...(receiverId && { receiverId }),
        ...(groupId && { groupId }),
        // Add metadata indicating this is a forwarded message
        parentId: originalMessageId, // Reference to original message
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
    });
  }

  async getChatList(userId: string, skip: number, take: number) {
    // Get all unique user IDs that current user has conversations with
    const directMessages = await this.db.message.findMany({
      where: {
        deletedAt: null,
        OR: [{ senderId: userId }, { receiverId: userId }],
        groupId: null, // Only direct messages
      },
      select: {
        senderId: true,
        receiverId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get unique other user IDs from direct messages
    const uniqueUserIds = new Set<string>();
    for (const msg of directMessages) {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (otherUserId) {
        uniqueUserIds.add(otherUserId);
      }
    }

    // Fetch user details for all unique users
    const users = await this.db.user.findMany({
      where: {
        id: { in: Array.from(uniqueUserIds) },
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        email: true,
      },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // Get all group conversations
    const groupMessages = await this.db.message.findMany({
      where: {
        deletedAt: null,
        groupId: { not: null },
        OR: [
          { senderId: userId },
          {
            group: {
              members: {
                some: { userId },
              },
            },
          },
        ],
      },
      select: {
        groupId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get unique group IDs
    const uniqueGroupIds = new Set<string>();
    for (const msg of groupMessages) {
      if (msg.groupId) {
        uniqueGroupIds.add(msg.groupId);
      }
    }

    // Fetch group details
    const groups = await this.db.group.findMany({
      where: {
        id: { in: Array.from(uniqueGroupIds) },
      },
      select: {
        id: true,
        title: true,
        cover: true,
        type: true,
      },
    });

    const groupMap = new Map(groups.map(g => [g.id, g]));

    // Process direct chats to get unique conversations with last message
    const directChatMap = new Map();
    for (const otherUserId of uniqueUserIds) {
      // Get the last message for this conversation
      const lastMessage = await this.db.message.findFirst({
        where: {
          deletedAt: null,
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: 'desc' },
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

      if (!lastMessage) continue;

      // Get unread count
      const unreadCount = await this.db.message.count({
        where: {
          deletedAt: null,
          senderId: otherUserId,
          receiverId: userId,
          status: { not: MessageStatus.SEEN },
        },
      });

      const otherUser = userMap.get(otherUserId);
      if (otherUser) {
        directChatMap.set(otherUserId, {
          type: 'direct',
          user: otherUser,
          lastMessage,
          unreadCount,
          lastMessageAt: lastMessage.createdAt,
        });
      }
    }

    // Process group chats to get unique conversations with last message
    const groupChatMap = new Map();
    for (const groupId of uniqueGroupIds) {
      // Get the last message for this group
      const lastMessage = await this.db.message.findFirst({
        where: {
          deletedAt: null,
          groupId,
        },
        orderBy: { createdAt: 'desc' },
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

      if (!lastMessage) continue;

      // Get unread count
      const unreadCount = await this.db.message.count({
        where: {
          deletedAt: null,
          groupId,
          senderId: { not: userId },
          status: { not: MessageStatus.SEEN },
        },
      });

      const group = groupMap.get(groupId);
      if (group) {
        groupChatMap.set(groupId, {
          type: 'group',
          group,
          lastMessage,
          unreadCount,
          lastMessageAt: lastMessage.createdAt,
        });
      }
    }

    // Combine and sort by last message time
    const allChats = [...Array.from(directChatMap.values()), ...Array.from(groupChatMap.values())];
    allChats.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

    // Apply pagination
    const paginatedChats = allChats.slice(skip, skip + take);

    return {
      chats: paginatedChats,
      total: allChats.length,
    };
  }
}
