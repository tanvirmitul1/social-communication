/**
 * SocketService — module-level singleton that holds the Socket.IO server instance.
 *
 * Because services (e.g. NotificationService) are resolved via tsyringe BEFORE the
 * HTTP server starts, we cannot inject `Server` through the DI container.
 * Instead we expose a plain object that is initialised once from SocketManager and
 * imported wherever real-time emission is needed — with no circular-dependency risk.
 */

import { Server } from 'socket.io';
import { logger } from '@config/logger.js';

class SocketServiceSingleton {
  private io: Server | null = null;

  /** Called exactly once from SocketManager after the io server is created. */
  initialize(io: Server): void {
    this.io = io;
    logger.info('SocketService: io instance registered');
  }

  /** Emit an event to a specific user's personal room. */
  emitToUser(userId: string, event: string, data: unknown): void {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /** Emit an event to an arbitrary room (group, call, etc.). */
  emitToRoom(room: string, event: string, data: unknown): void {
    if (!this.io) return;
    this.io.to(room).emit(event, data);
  }

  /** Broadcast to ALL connected clients. */
  broadcast(event: string, data: unknown): void {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  getIO(): Server | null {
    return this.io;
  }
}

export const SocketService = new SocketServiceSingleton();
