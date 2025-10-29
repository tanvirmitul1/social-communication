import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '@config/prisma.js';
import { redis } from '@config/redis.js';
import { ResponseHandler } from '@common/utils.js';

export class HealthController {
  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check endpoint
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is healthy
   */
  static async health(_req: Request, res: Response) {
    return ResponseHandler.success(
      res,
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      'Service is healthy'
    );
  }

  /**
   * @swagger
   * /health/ready:
   *   get:
   *     summary: Readiness check endpoint
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is ready
   *       503:
   *         description: Service is not ready
   */
  static async readiness(_req: Request, res: Response) {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;

      // Check Redis connection
      await redis.ping();

      return ResponseHandler.success(
        res,
        {
          status: 'ready',
          checks: {
            database: 'connected',
            redis: 'connected',
          },
        },
        'Service is ready'
      );
    } catch (error) {
      return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        success: false,
        message: 'Service is not ready',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * @swagger
   * /metrics:
   *   get:
   *     summary: Metrics endpoint for Prometheus
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Metrics data
   */
  static async metrics(_req: Request, res: Response) {
    const memoryUsage = process.memoryUsage();

    const metrics = {
      process: {
        uptime: process.uptime(),
        memory: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
        },
        cpu: process.cpuUsage(),
      },
      nodejs: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    return ResponseHandler.success(res, metrics, 'Metrics retrieved');
  }
}
