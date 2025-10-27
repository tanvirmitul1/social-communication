import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { config } from '@config/env.js';
import { logger } from '@logger/index.js';
import { CONSTANTS } from '@constants/index.js';
import { container } from 'tsyringe';
import { MessageService } from '@services/MessageService.js';
import { UserService } from '@services/UserService.js';
import { CacheService } from '@services/CacheService.js';
import jwt from 'jsonwebtoken';

interface AuthSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

export class SocketManager {
  private io: SocketIOServer;
  private messageService: MessageService;
  private userService: UserService;
  private cacheService: CacheService;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.CORS_ORIGINS.split(','),
        credentials: true,
      },
    });

    this.messageService = container.resolve('MessageService');
    this.userService = container.resolve('UserService');
    this.cacheService = container.resolve('CacheService');

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket: AuthSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token.replace('Bearer ', ''), config.JWT_ACCESS_SECRET) as {
          id: string;
          email: string;
        };

        socket.userId = decoded.id;
        socket.userEmail = decoded.email;

        next();
      } catch (error) {
        logger.error({ error }, 'Socket authentication error');
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on(CONSTANTS.SOCKET_EVENTS.CONNECT, (socket: AuthSocket) => {
      logger.info({ userId: socket.userId, socketId: socket.id }, 'User connected');

      // Update user online status
      if (socket.userId) {
        this.handleUserOnline(socket.userId);
      }

      // Join user's personal room
      socket.join(`user:${socket.userId}`);

      // Handle disconnection
      socket.on(CONSTANTS.SOCKET_EVENTS.DISCONNECT, () => {
        this.handleUserOffline(socket.userId!);
        logger.info({ userId: socket.userId, socketId: socket.id }, 'User disconnected');
      });

      // Message events
      socket.on(CONSTANTS.SOCKET_EVENTS.MESSAGE_SEND, async (data) => {
        await this.handleMessageSend(socket, data);
      });

      socket.on(CONSTANTS.SOCKET_EVENTS.MESSAGE_EDIT, async (data) => {
        await this.handleMessageEdit(socket, data);
      });

      socket.on(CONSTANTS.SOCKET_EVENTS.MESSAGE_DELETE, async (data) => {
        await this.handleMessageDelete(socket, data);
      });

      socket.on(CONSTANTS.SOCKET_EVENTS.MESSAGE_REACTION, async (data) => {
        await this.handleMessageReaction(socket, data);
      });

      // Typing indicators
      socket.on(CONSTANTS.SOCKET_EVENTS.TYPING_START, async (data) => {
        await this.handleTypingStart(socket, data);
      });

      socket.on(CONSTANTS.SOCKET_EVENTS.TYPING_STOP, async (data) => {
        await this.handleTypingStop(socket, data);
      });

      // Call events
      socket.on(CONSTANTS.SOCKET_EVENTS.CALL_INITIATE, (data) => {
        this.handleCallInitiate(socket, data);
      });

      socket.on(CONSTANTS.SOCKET_EVENTS.CALL_ANSWER, (data) => {
        this.handleCallAnswer(socket, data);
      });

      socket.on(CONSTANTS.SOCKET_EVENTS.CALL_REJECT, (data) => {
        this.handleCallReject(socket, data);
      });

      socket.on(CONSTANTS.SOCKET_EVENTS.CALL_END, (data) => {
        this.handleCallEnd(socket, data);
      });
    });
  }

  private async handleUserOnline(userId: string): Promise<void> {
    await this.userService.updateOnlineStatus(userId, true);
    this.io.emit(CONSTANTS.SOCKET_EVENTS.USER_ONLINE, { userId });
  }

  private async handleUserOffline(userId: string): Promise<void> {
    await this.userService.updateOnlineStatus(userId, false);
    this.io.emit(CONSTANTS.SOCKET_EVENTS.USER_OFFLINE, { userId });
  }

  private async handleMessageSend(socket: AuthSocket, data: unknown): Promise<void> {
    try {
      const message = await this.messageService.sendMessage({
        senderId: socket.userId!,
        ...(data as Record<string, unknown>),
      });

      // Emit to recipient or group
      if (message.groupId) {
        this.io
          .to(`group:${message.groupId}`)
          .emit(CONSTANTS.SOCKET_EVENTS.MESSAGE_RECEIVED, message);
      } else if (message.receiverId) {
        this.io
          .to(`user:${message.receiverId}`)
          .emit(CONSTANTS.SOCKET_EVENTS.MESSAGE_RECEIVED, message);
      }

      // Confirm to sender
      socket.emit(CONSTANTS.SOCKET_EVENTS.MESSAGE_SENT, message);
    } catch (error) {
      logger.error({ error }, 'Error sending message');
      socket.emit(CONSTANTS.SOCKET_EVENTS.ERROR, { message: 'Failed to send message' });
    }
  }

  private async handleMessageEdit(
    socket: AuthSocket,
    data: { messageId: string; content: string }
  ): Promise<void> {
    try {
      const message = await this.messageService.editMessage(
        data.messageId,
        socket.userId!,
        data.content
      );

      if (message.groupId) {
        this.io.to(`group:${message.groupId}`).emit(CONSTANTS.SOCKET_EVENTS.MESSAGE_EDIT, message);
      } else if (message.receiverId) {
        this.io
          .to(`user:${message.receiverId}`)
          .emit(CONSTANTS.SOCKET_EVENTS.MESSAGE_EDIT, message);
      }
    } catch (error) {
      logger.error({ error }, 'Error editing message');
      socket.emit(CONSTANTS.SOCKET_EVENTS.ERROR, { message: 'Failed to edit message' });
    }
  }

  private async handleMessageDelete(
    socket: AuthSocket,
    data: { messageId: string }
  ): Promise<void> {
    try {
      const message = await this.messageService.deleteMessage(data.messageId, socket.userId!);

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
  }

  private async handleMessageReaction(
    socket: AuthSocket,
    data: { messageId: string; emoji: string; action: 'add' | 'remove' }
  ): Promise<void> {
    try {
      if (data.action === 'add') {
        await this.messageService.addReaction(data.messageId, socket.userId!, data.emoji);
      } else {
        await this.messageService.removeReaction(data.messageId, socket.userId!, data.emoji);
      }

      const message = await this.messageService.getMessage(data.messageId);

      if (message.groupId) {
        this.io.to(`group:${message.groupId}`).emit(CONSTANTS.SOCKET_EVENTS.MESSAGE_REACTION, {
          messageId: data.messageId,
          userId: socket.userId,
          emoji: data.emoji,
          action: data.action,
        });
      } else if (message.receiverId) {
        this.io.to(`user:${message.receiverId}`).emit(CONSTANTS.SOCKET_EVENTS.MESSAGE_REACTION, {
          messageId: data.messageId,
          userId: socket.userId,
          emoji: data.emoji,
          action: data.action,
        });
      }
    } catch (error) {
      logger.error({ error }, 'Error handling message reaction');
    }
  }

  private async handleTypingStart(
    socket: AuthSocket,
    data: { groupId?: string; userId?: string }
  ): Promise<void> {
    const target = data.groupId ? `group:${data.groupId}` : `user:${data.userId}`;
    this.io.to(target).emit(CONSTANTS.SOCKET_EVENTS.TYPING_START, {
      userId: socket.userId,
      ...(data.groupId && { groupId: data.groupId }),
    });

    // Store in cache with TTL
    const key = CONSTANTS.REDIS_KEYS.TYPING_INDICATOR(
      data.groupId || data.userId || '',
      socket.userId!
    );
    await this.cacheService.setWithExpiry(key, true, CONSTANTS.CACHE_TTL.TYPING);
  }

  private async handleTypingStop(
    socket: AuthSocket,
    data: { groupId?: string; userId?: string }
  ): Promise<void> {
    const target = data.groupId ? `group:${data.groupId}` : `user:${data.userId}`;
    this.io.to(target).emit(CONSTANTS.SOCKET_EVENTS.TYPING_STOP, {
      userId: socket.userId,
      ...(data.groupId && { groupId: data.groupId }),
    });

    // Remove from cache
    const key = CONSTANTS.REDIS_KEYS.TYPING_INDICATOR(
      data.groupId || data.userId || '',
      socket.userId!
    );
    await this.cacheService.delete(key);
  }

  private handleCallInitiate(
    socket: AuthSocket,
    data: { callId: string; participantIds: string[] }
  ): void {
    // Notify participants
    data.participantIds.forEach((participantId) => {
      this.io.to(`user:${participantId}`).emit(CONSTANTS.SOCKET_EVENTS.CALL_RINGING, {
        callId: data.callId,
        initiatorId: socket.userId,
      });
    });
  }

  private handleCallAnswer(socket: AuthSocket, data: { callId: string }): void {
    // Notify all participants
    this.io.to(`call:${data.callId}`).emit(CONSTANTS.SOCKET_EVENTS.CALL_PARTICIPANT_JOIN, {
      callId: data.callId,
      userId: socket.userId,
    });
  }

  private handleCallReject(
    socket: AuthSocket,
    data: { callId: string; initiatorId: string }
  ): void {
    this.io.to(`user:${data.initiatorId}`).emit(CONSTANTS.SOCKET_EVENTS.CALL_REJECT, {
      callId: data.callId,
      userId: socket.userId,
    });
  }

  private handleCallEnd(
    socket: AuthSocket,
    data: { callId: string; participantIds: string[] }
  ): void {
    // Notify all participants
    data.participantIds.forEach((participantId) => {
      this.io.to(`user:${participantId}`).emit(CONSTANTS.SOCKET_EVENTS.CALL_END, {
        callId: data.callId,
      });
    });
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}
