/**
 * Server Startup
 *
 * Handles HTTP server initialization, database connections, and graceful shutdown
 */

import { createServer } from 'http';
import { config } from '@config/env.js';
import { logger } from '@config/logger.js';
import { prisma } from '@config/prisma.js';
import { redis } from '@config/redis.js';
import { SocketManager } from '@infrastructure/socket.manager.js';
import { createApp } from './app.js';
import './container.js'; // Initialize DI container

export async function startServer() {
  try {
    // Create Express app (async — initializes AdminJS panel)
    const app = await createApp();

    // Create HTTP server
    const server = createServer(app);

    // Initialize WebSocket
    new SocketManager(server);

    logger.info('✓ WebSocket initialized');

    // Connect to databases
    let dbConnected = false;
    let redisConnected = false;

    // Test PostgreSQL connection
    try {
      await prisma.$connect();
      logger.info('✓ Connected to PostgreSQL');
      dbConnected = true;
    } catch (error) {
      logger.warn({ error }, '⚠️  PostgreSQL connection failed - continuing without database');
    }

    // Test Redis connection
    try {
      const errorHandler = () => {
        // Suppress errors during connection test
      };
      redis.on('error', errorHandler);

      await Promise.race([
        redis.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis connection timeout')), 2000)
        ),
      ]);

      redis.off('error', errorHandler);
      logger.info('✓ Connected to Redis');
      redisConnected = true;
    } catch (_error) {
      logger.warn('⚠️  Redis connection failed - caching and real-time features disabled');
    }

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(
          `Port ${config.PORT} is already in use. Please change the PORT in your .env file.`
        );
        process.exit(1);
      } else {
        logger.error({ error }, 'Server startup error');
        process.exit(1);
      }
    });

    // Start server
    server.listen(config.PORT, () => {
      logger.info('');
      logger.info('🚀 Server started successfully');
      logger.info(`📡 Port: ${config.PORT}`);
      logger.info(`🌍 Environment: ${config.NODE_ENV}`);
      logger.info(`📚 API Docs: http://localhost:${config.PORT}/api/docs`);
      logger.info(`💚 Health: http://localhost:${config.PORT}/health`);
      logger.info(`🔌 Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
      logger.info(`⚡ Redis: ${redisConnected ? 'Connected' : 'Disconnected'}`);
      logger.info('');

      if (!dbConnected) {
        logger.warn('⚠️  Database not connected - some features may not work');
      }
      if (!redisConnected) {
        logger.warn('⚠️  Redis not connected - caching and real-time features disabled');
      }
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');

      try {
        // Close HTTP server
        await new Promise<void>((resolve, reject) => {
          server.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        logger.info('✓ HTTP server closed');

        // Disconnect database
        if (dbConnected) {
          await prisma.$disconnect();
          logger.info('✓ Database disconnected');
        }

        // Disconnect Redis
        if (redisConnected) {
          await redis.quit();
          logger.info('✓ Redis disconnected');
        }

        logger.info('Shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error({ error }, 'Error during shutdown');
        process.exit(1);
      }
    };

    // Shutdown signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error({ reason, promise }, 'Unhandled Rejection');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error({ error }, 'Uncaught Exception');
      process.exit(1);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}
