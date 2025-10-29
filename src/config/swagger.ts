import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Social Communication API',
      version: '1.0.0',
      description: 'Enterprise-level real-time messaging and audio/video calling platform API',
      contact: {
        name: 'API Support',
        email: 'support@socialcomm.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}/api/${config.API_VERSION}`,
        description: 'Development server',
      },
      {
        url: `https://api.socialcomm.com/api/${config.API_VERSION}`,
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            avatar: { type: 'string', nullable: true },
            statusMessage: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['USER', 'MODERATOR', 'ADMIN'] },
            isOnline: { type: 'boolean' },
            lastSeen: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            senderId: { type: 'string', format: 'uuid' },
            groupId: { type: 'string', format: 'uuid', nullable: true },
            receiverId: { type: 'string', format: 'uuid', nullable: true },
            content: { type: 'string' },
            type: { type: 'string', enum: ['TEXT', 'IMAGE', 'FILE', 'VOICE', 'VIDEO'] },
            status: { type: 'string', enum: ['SENT', 'DELIVERED', 'SEEN'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Group: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            cover: { type: 'string', nullable: true },
            type: { type: 'string', enum: ['PRIVATE', 'PUBLIC', 'SECRET'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Call: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            initiatorId: { type: 'string', format: 'uuid' },
            roomId: { type: 'string' },
            type: { type: 'string', enum: ['AUDIO', 'VIDEO'] },
            status: { type: 'string', enum: ['RINGING', 'ONGOING', 'ENDED', 'MISSED', 'REJECTED'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            code: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./app/controllers/*.ts', './app/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
