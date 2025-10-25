import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { config } from '@config/env.js';
import { ChatSocketHandler } from './ChatSocketHandler.js';
import { CallSocketHandler } from './CallSocketHandler.js';
import { logger } from '@logger/index.js';

export class SocketManager {
  private io: Server;
  private chatHandler: ChatSocketHandler;
  private callHandler: CallSocketHandler;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.CORS_ORIGINS.split(','),
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupRedisAdapter();
    this.setupAuthentication();
    
    this.chatHandler = new ChatSocketHandler(this.io);
    this.callHandler = new CallSocketHandler(this.io);

    this.setupConnectionHandler();
  }

  private async setupRedisAdapter() {
    try {
      const pubClient = createClient({
        url: `redis://${config.REDIS_HOST}:${config.REDIS_PORT}`,
        password: config.REDIS_PASSWORD || undefined,
      });
      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);

      this.io.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.IO Redis adapter configured');
    } catch (error) {
      logger.error({ error }, 'Failed to setup Redis adapter for Socket.IO');
    }
  }

  private setupAuthentication() {
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication token missing'));
        }

        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as {
          id: string;
          email: string;
          role: string;
        };

        socket.data.user = decoded;
        next();
      } catch (error) {
        logger.error({ error }, 'Socket authentication failed');
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupConnectionHandler() {
    this.io.on('connection', (socket) => {
      this.chatHandler.handleConnection(socket);
      this.callHandler.setupEventHandlers(socket);
    });
  }

  getIO(): Server {
    return this.io;
  }
}
