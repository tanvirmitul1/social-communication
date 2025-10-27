import { Server, Socket } from 'socket.io';
import { container } from '@config/container.js';
import { MessageService } from '@services/MessageService.js';
import { UserService } from '@services/UserService.js';
import { CacheService } from '@services/CacheService.js';
import { CONSTANTS } from '@constants/index.js';
import { logger } from '@logger/index.js';

export class ChatSocketHandler {
  private messageService: MessageService;
  private userService: UserService;
  private cacheService: CacheService;

  constructor(private io: Server) {
    this.messageService = container.resolve('MessageService');
    this.userService = container.resolve('UserService');
    this.cacheService = container.resolve('CacheService');
  }

  handleConnection(socket: Socket) {
    logger.info({ socketId: socket.id }, 'Client connected');

    const userId = socket.data.user?.id;
    if (!userId) {
      socket.disconnect();
      return;
    }

    // Update user online status
    this.userService.updateOnlineStatus(userId, true);

    // Join user's personal room
    socket.join(`user:${userId}`);

    this.setupEventHandlers(socket);
  }

  private setupEventHandlers(socket: Socket) {
    const userId = socket.data.user.id;

    // Message events
    socket.on(CONSTANTS.SOCKET_EVENTS.MESSAGE_SEND, async (data) => {
      try {
        const message = await this.messageService.sendMessage({
          senderId: userId,
          content: data.content,
          type: data.type,
          groupId: data.groupId,
          receiverId: data.receiverId,
          parentId: data.parentId,
          metadata: data.metadata,
        });

        // Emit to group or direct recipient
        if (data.groupId) {
          this.io
            .to(`group:${data.groupId}`)
            .emit(CONSTANTS.SOCKET_EVENTS.MESSAGE_RECEIVED, message);
        } else if (data.receiverId) {
          this.io
            .to(`user:${data.receiverId}`)
            .emit(CONSTANTS.SOCKET_EVENTS.MESSAGE_RECEIVED, message);
          socket.emit(CONSTANTS.SOCKET_EVENTS.MESSAGE_SENT, message);
        }
      } catch (error) {
        logger.error({ error }, 'Error sending message');
        socket.emit(CONSTANTS.SOCKET_EVENTS.ERROR, { message: 'Failed to send message' });
      }
    });

    // Message edit
    socket.on(CONSTANTS.SOCKET_EVENTS.MESSAGE_EDIT, async (data) => {
      try {
        const message = await this.messageService.editMessage(data.messageId, userId, data.content);

        // Emit to relevant users
        if (message.groupId) {
          this.io
            .to(`group:${message.groupId}`)
            .emit(CONSTANTS.SOCKET_EVENTS.MESSAGE_EDIT, message);
        } else if (message.receiverId) {
          this.io
            .to(`user:${message.receiverId}`)
            .emit(CONSTANTS.SOCKET_EVENTS.MESSAGE_EDIT, message);
        }
      } catch (error) {
        logger.error({ error }, 'Error editing message');
        socket.emit(CONSTANTS.SOCKET_EVENTS.ERROR, { message: 'Failed to edit message' });
      }
    });

    // Message delete
    socket.on(CONSTANTS.SOCKET_EVENTS.MESSAGE_DELETE, async (data) => {
      try {
        const message = await this.messageService.deleteMessage(data.messageId, userId);

        // Emit to relevant users
        if (message.groupId) {
          this.io
            .to(`group:${message.groupId}`)
            .emit(CONSTANTS.SOCKET_EVENTS.MESSAGE_DELETE, { messageId: data.messageId });
        } else if (message.receiverId) {
          this.io
            .to(`user:${message.receiverId}`)
            .emit(CONSTANTS.SOCKET_EVENTS.MESSAGE_DELETE, { messageId: data.messageId });
        }
      } catch (error) {
        logger.error({ error }, 'Error deleting message');
        socket.emit(CONSTANTS.SOCKET_EVENTS.ERROR, { message: 'Failed to delete message' });
      }
    });

    // Typing indicators
    socket.on(CONSTANTS.SOCKET_EVENTS.TYPING_START, async (data) => {
      const { groupId, receiverId } = data;
      const key = groupId
        ? CONSTANTS.REDIS_KEYS.TYPING_INDICATOR(groupId, userId)
        : CONSTANTS.REDIS_KEYS.TYPING_INDICATOR(receiverId, userId);

      await this.cacheService.setWithExpiry(key, true, CONSTANTS.CACHE_TTL.TYPING);

      if (groupId) {
        socket
          .to(`group:${groupId}`)
          .emit(CONSTANTS.SOCKET_EVENTS.TYPING_START, { userId, groupId });
      } else if (receiverId) {
        this.io.to(`user:${receiverId}`).emit(CONSTANTS.SOCKET_EVENTS.TYPING_START, { userId });
      }
    });

    socket.on(CONSTANTS.SOCKET_EVENTS.TYPING_STOP, async (data) => {
      const { groupId, receiverId } = data;
      const key = groupId
        ? CONSTANTS.REDIS_KEYS.TYPING_INDICATOR(groupId, userId)
        : CONSTANTS.REDIS_KEYS.TYPING_INDICATOR(receiverId, userId);

      await this.cacheService.delete(key);

      if (groupId) {
        socket
          .to(`group:${groupId}`)
          .emit(CONSTANTS.SOCKET_EVENTS.TYPING_STOP, { userId, groupId });
      } else if (receiverId) {
        this.io.to(`user:${receiverId}`).emit(CONSTANTS.SOCKET_EVENTS.TYPING_STOP, { userId });
      }
    });

    // Disconnect
    socket.on(CONSTANTS.SOCKET_EVENTS.DISCONNECT, async () => {
      logger.info({ socketId: socket.id, userId }, 'Client disconnected');
      await this.userService.updateOnlineStatus(userId, false);
      this.io.emit(CONSTANTS.SOCKET_EVENTS.USER_OFFLINE, { userId });
    });
  }

  // Helper method to join group rooms
  async joinGroupRoom(socket: Socket, groupId: string) {
    socket.join(`group:${groupId}`);
  }

  // Helper method to leave group rooms
  async leaveGroupRoom(socket: Socket, groupId: string) {
    socket.leave(`group:${groupId}`);
  }
}
