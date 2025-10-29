import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Social Communication API',
      version: '1.0.0',
      description: `Enterprise-level real-time messaging and audio/video calling platform API

## WebSocket Events

This API also supports real-time communication via WebSocket (Socket.IO).

### Connection
- Connect to: \`http://localhost:3000\`
- Authentication: Pass JWT token in handshake auth

### Message Events
- \`message:send\` - Send a message
- \`message:received\` - Message received
- \`message:edit\` - Edit a message
- \`message:delete\` - Delete a message
- \`message:reaction\` - Add/remove reaction
- \`typing:start\` - User started typing
- \`typing:stop\` - User stopped typing

### Call Events
- \`call:initiate\` - Initiate a call
- \`call:ringing\` - Call is ringing
- \`call:answer\` - Answer a call
- \`call:reject\` - Reject a call
- \`call:end\` - End a call
- \`call:participant:join\` - Participant joined
- \`call:participant:leave\` - Participant left

### Presence Events
- \`user:online\` - User came online
- \`user:offline\` - User went offline
- \`presence:update\` - Update user presence

For detailed WebSocket documentation, see: [API Documentation](../docs/API.md)
`,
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
  apis: ['./modules/**/*.controller.ts', './modules/**/*.routes.ts', './modules/**/*.gateway.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
