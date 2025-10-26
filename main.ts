import 'reflect-metadata';
import 'express-async-errors';
import express, { Application } from 'express';
import { createServer } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { config } from '@config/env.js';
import { swaggerSpec } from '@config/swagger.js';
import { prisma } from '@config/database.js';
import { redis } from '@config/redis.js';
import { apiRoutes } from '@routes/index.js';
import { SocketManager } from '@sockets/SocketManager.js';
import { errorHandler, notFoundHandler } from '@middlewares/error.middleware.js';
import { apiLimiter } from '@middlewares/rateLimit.middleware.js';
import { HealthController } from '@controllers/HealthController.js';
import { logger } from '@logger/index.js';
import './app/config/container.js';

class Application {
  private app: Application;
  private httpServer: ReturnType<typeof createServer>;
  private socketManager: SocketManager;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.socketManager = new SocketManager(this.httpServer);

    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandlers();
  }

  private setupMiddlewares(): void {
    // Security
    this.app.use(helmet({
      contentSecurityPolicy: false, // Allow Swagger UI
    }));

    // CORS
    this.app.use(cors({
      origin: config.CORS_ORIGINS.split(','),
      credentials: true,
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Rate limiting
    this.app.use(apiLimiter);

    // Request logging
    this.app.use((req, _res, next) => {
      logger.info({
        method: req.method,
        url: req.url,
        ip: req.ip,
      }, 'Incoming request');
      next();
    });
  }

  private setupRoutes(): void {
    // Health checks
    this.app.get('/health', HealthController.health);
    this.app.get('/health/ready', HealthController.readiness);
    this.app.get('/metrics', HealthController.metrics);

    // API Documentation
    this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Social Communication API Docs',
    }));

    // API Routes
    this.app.use(`/api/${config.API_VERSION}`, apiRoutes);

    // Root
    this.app.get('/', (_req, res) => {
      res.json({
        name: 'Social Communication API',
        version: '1.0.0',
        docs: '/api/docs',
        health: '/health',
      });
    });
  }

  private setupErrorHandlers(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    let dbConnected = false;
    let redisConnected = false;

    // Test database connection
    try {
      await prisma.$connect();
      logger.info('Database connected successfully');
      dbConnected = true;
    } catch (error) {
      logger.warn({ error }, 'Database connection failed - continuing without database');
    }

    // Test Redis connection
    try {
      // Add error handler before attempting connection to prevent unhandled rejections
      const errorHandler = () => {
        // Suppress errors during connection test
      };
      redis.on('error', errorHandler);

      await Promise.race([
        redis.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout')), 2000))
      ]);

      redis.off('error', errorHandler);
      logger.info('Redis connected successfully');
      redisConnected = true;
    } catch (error) {
      logger.warn('Redis connection failed - continuing without Redis');
    }

    // Start server
    this.httpServer.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.PORT} is already in use. Please change the PORT in your .env file.`);
        process.exit(1);
      } else {
        logger.error({ error }, 'Server startup error');
        process.exit(1);
      }
    });

    this.httpServer.listen(config.PORT, () => {
      logger.info({
        port: config.PORT,
        env: config.NODE_ENV,
        apiVersion: config.API_VERSION,
        dbConnected,
        redisConnected,
      }, 'Server started successfully');
      logger.info(`API Documentation available at http://localhost:${config.PORT}/api/docs`);
      
      if (!dbConnected) {
        logger.warn('⚠️  Database not connected - some features may not work');
      }
      if (!redisConnected) {
        logger.warn('⚠️  Redis not connected - caching and real-time features disabled');
      }
    });
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down gracefully...');

    try {
      // Close HTTP server
      await new Promise<void>((resolve, reject) => {
        this.httpServer.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Disconnect database
      await prisma.$disconnect();
      logger.info('Database disconnected');

      // Disconnect Redis
      await redis.quit();
      logger.info('Redis disconnected');

      logger.info('Shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  }
}

// Initialize application
const app = new Application();

// Start application
app.start();

// Graceful shutdown
process.on('SIGTERM', () => app.shutdown());
process.on('SIGINT', () => app.shutdown());

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught Exception');
  process.exit(1);
});
