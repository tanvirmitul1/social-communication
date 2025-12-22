/**
 * Express Application Setup
 *
 * Configures the Express app with middlewares, routes, and error handlers
 */

import express, { Application as ExpressApplication } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { config } from '@config/env.js';
import { swaggerSpec } from '@config/swagger.js';
import { logger } from '@config/logger.js';
import { apiLimiter } from '@config/rate-limiter.js';
import { errorHandler } from '@middlewares/error-handler.js';

// Import module routes
import { authRoutes } from '@modules/auth/auth.routes.js';
import { userRoutes } from '@modules/user/user.routes.js';
import { messageRoutes } from '@modules/message/message.routes.js';
import { groupRoutes } from '@modules/group/group.routes.js';
import { callRoutes } from '@modules/call/call.routes.js';
import { friendRoutes } from '@modules/user/friend.routes.js';
import { HealthController } from '@modules/health/health.controller.js';

export function createApp(): ExpressApplication {
  const app = express();

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allow Swagger UI
    })
  );

  // CORS
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow all origins in development
        if (config.NODE_ENV === 'development') {
          return callback(null, true);
        }
        
        // In production, check against allowed origins
        const allowedOrigins = config.CORS_ORIGINS.split(',');
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Rate limiting
  app.use(apiLimiter);

  // Request logging
  app.use((req, _res, next) => {
    logger.info(
      {
        method: req.method,
        url: req.url,
        ip: req.ip,
      },
      'Incoming request'
    );
    next();
  });

  // Health checks
  app.get('/health', HealthController.health);
  app.get('/health/ready', HealthController.readiness);
  app.get('/metrics', HealthController.metrics);

  // API Documentation
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Social Communication API Docs',
    })
  );

  // API Routes
  const API_VERSION = config.API_VERSION || 'v1';
  app.use(`/api/${API_VERSION}/auth`, authRoutes);
  app.use(`/api/${API_VERSION}/users`, userRoutes);
  app.use(`/api/${API_VERSION}/messages`, messageRoutes);
  app.use(`/api/${API_VERSION}/groups`, groupRoutes);
  app.use(`/api/${API_VERSION}/calls`, callRoutes);
  app.use(`/api/${API_VERSION}/friends`, friendRoutes);

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      name: 'Social Communication API',
      version: '1.0.0',
      docs: '/api/docs',
      health: '/health',
    });
  });

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}