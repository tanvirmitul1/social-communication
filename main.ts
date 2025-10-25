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
    try {
      // Test database connection
      await prisma.$connect();
      logger.info('Database connected successfully');

      // Test Redis connection
      await redis.ping();
      logger.info('Redis connected successfully');

      // Start server
      this.httpServer.listen(config.PORT, () => {
        logger.info({
          port: config.PORT,
          env: config.NODE_ENV,
          apiVersion: config.API_VERSION,
        }, 'Server started successfully');
        logger.info(`API Documentation available at http://localhost:${config.PORT}/api/docs`);
      });
    } catch (error) {
      logger.error({ error }, 'Failed to start application');
      process.exit(1);
    }
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
