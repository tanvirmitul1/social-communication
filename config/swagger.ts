import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Social Communication API',
      version: '1.0.0',
      description: `Enterprise-level real-time messaging and audio/video calling platform API

## Important Setup Note

⚠️ **Before using this API, ensure database migrations have been run:**

\`\`\`bash
# For Docker deployments
docker compose down
docker compose up -d --build

# For local development
pnpm prisma:migrate:deploy
\`\`\`

## Base URLs

- **Production**: \`https://socialbackend.duckdns.org/api/v1\`
- **Development (via Nginx)**: \`http://localhost/api/v1\`
- **Direct Access**: \`http://localhost:3000/api/v1\`
- **Health Endpoints**: Not versioned - accessible at \`/health\`, \`/health/ready\`, \`/metrics\`

## Authentication Flow

This API uses JWT (JSON Web Tokens) for authentication with both access and refresh tokens.

### Registration & Login Flow

1. **Register a new user**: \`POST /api/v1/auth/register\`
   - Provide username, email, and password
   - Receive user object (without password)
   - No tokens returned on registration

2. **Login**: \`POST /api/v1/auth/login\`
   - Provide email and password
   - Receive user object + accessToken + refreshToken
   - Store both tokens securely (use httpOnly cookies in production)

3. **Access Protected Routes**:
   - Include access token in Authorization header: \`Bearer <accessToken>\`
   - Access token expires in 15 minutes by default

4. **Refresh Token**: \`POST /api/v1/auth/refresh\`
   - When access token expires, use refresh token to get new tokens
   - Provide refresh token in request body
   - Receive new accessToken and refreshToken
   - Old refresh token is invalidated

5. **Logout**: \`POST /api/v1/auth/logout\`
   - Provide refresh token to invalidate
   - Removes the specific device session
   - Or use \`POST /api/v1/auth/logout-all\` to logout from all devices

6. **Get Current User**: \`GET /api/v1/auth/me\`
   - Requires valid access token
   - Returns current user profile

### Token Lifetimes

- **Access Token**: 15 minutes (short-lived, for API requests)
- **Refresh Token**: 7 days (long-lived, stored securely)

### Example Usage

\`\`\`javascript
// 1. Register
const registerRes = await fetch('http://localhost/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john_doe',
    email: 'john@example.com',
    password: 'SecurePass123'
  })
});

// 2. Login
const loginRes = await fetch('http://localhost/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePass123'
  })
});
const { data } = await loginRes.json();
const { accessToken, refreshToken } = data;

// 3. Access protected route
const profileRes = await fetch('http://localhost/api/v1/auth/me', {
  headers: { 'Authorization': \`Bearer \${accessToken}\` }
});

// 4. Refresh token when expired
const refreshRes = await fetch('http://localhost/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});
const { data: newTokens } = await refreshRes.json();

// 5. Logout
await fetch('http://localhost/api/v1/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${accessToken}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ refreshToken })
});
\`\`\`

## WebSocket Events

This API supports real-time communication via WebSocket (Socket.IO).

### Connection
\`\`\`javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost', {
  auth: { token: accessToken }
  // OR
  // extraHeaders: { authorization: 'Bearer ' + accessToken }
});

socket.on('connect', () => {
  console.log('Connected to server');
});
\`\`\`

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

## Response Format

All API responses follow this standard format:

**Success Response:**
\`\`\`json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
\`\`\`

**Error Response:**
\`\`\`json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "code": "ERROR_CODE"
}
\`\`\`

## Rate Limiting

- **Auth endpoints** (/api/v1/auth/login, /api/v1/auth/register): 5 requests per 15 minutes
- **Message endpoints**: 30 requests per minute
- **General API**: 100 requests per 15 minutes

For detailed documentation, see: [Full API Documentation](https://github.com/yourusername/social-communication)
`,
      contact: {
        name: 'API Support',
        email: 'support@socialcomm.com',
      },
    },
    servers: [
      {
        url: `https://socialbackend.duckdns.org/api/${config.API_VERSION}`,
        description: 'Production server (HTTPS)',
      },
      {
        url: `http://localhost/api/${config.API_VERSION}`,
        description: 'Development server (via Nginx)',
      },
      {
        url: `http://localhost:${config.PORT}/api/${config.API_VERSION}`,
        description: 'Direct server access (development only)',
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
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token (expires in 15 minutes)',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token (expires in 7 days)',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login successful' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                accessToken: {
                  type: 'string',
                  description: 'JWT access token',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                refreshToken: {
                  type: 'string',
                  description: 'JWT refresh token',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 50,
              pattern: '^[a-zA-Z0-9_]+$',
              description: 'Username (alphanumeric and underscore only)',
              example: 'john_doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Valid email address',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'Password (minimum 8 characters)',
              example: 'SecurePass123',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              example: 'SecurePass123',
            },
          },
        },
        AIAgentExecuteRequest: {
          type: 'object',
          required: ['userInput'],
          properties: {
            userInput: {
              type: 'string',
              description: 'The input from the user to send to the AI agent',
              example: 'Can you help me find friends with similar interests?',
              minLength: 1,
              maxLength: 10000,
            },
            conversationId: {
              type: 'string',
              format: 'uuid',
              description: 'Existing conversation ID to continue a conversation. If not provided, a new conversation will be created.',
              example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
            },
          },
        },
        AIAgentExecuteResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                conversationId: {
                  type: 'string',
                  format: 'uuid',
                  example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
                },
                response: {
                  type: 'string',
                  description: 'The AI-generated response',
                  example: 'I\'d be happy to help you find friends with similar interests...',
                },
              },
            },
          },
        },
        Conversation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            title: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ChatMessage: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            conversationId: { type: 'string', format: 'uuid' },
            sender: { type: 'string', enum: ['user', 'ai'] },
            content: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            metadata: { type: 'object', nullable: true },
          },
        },
        AIAgentConversationsResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Conversation' },
            },
          },
        },
        AIAgentHistoryResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/ChatMessage' },
            },
          },
        },
        // ── Notifications ────────────────────────────────────────────────────
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            type: {
              type: 'string',
              enum: ['MESSAGE', 'CALL', 'FRIEND_REQUEST', 'GROUP_INVITE', 'MENTION', 'REACTION', 'SYSTEM'],
            },
            title: { type: 'string', example: 'New message' },
            message: { type: 'string', example: 'John sent you a message' },
            isRead: { type: 'boolean', example: false },
            data: { type: 'object', nullable: true, description: 'Extra context payload (e.g. messageId, senderId)' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Upload ───────────────────────────────────────────────────────────
        UploadResult: {
          type: 'object',
          properties: {
            url: { type: 'string', format: 'uri', description: 'HTTP URL' },
            secureUrl: { type: 'string', format: 'uri', description: 'HTTPS URL — always use this' },
            publicId: { type: 'string', description: 'Cloudinary public ID — store this to delete the file later' },
            resourceType: { type: 'string', enum: ['image', 'video', 'raw'] },
            format: { type: 'string', example: 'webp' },
            width: { type: 'integer', nullable: true },
            height: { type: 'integer', nullable: true },
            duration: { type: 'number', nullable: true, description: 'Video duration in seconds' },
            size: { type: 'integer', description: 'File size in bytes' },
            thumbnailUrl: { type: 'string', format: 'uri', nullable: true },
          },
        },
        // ── User Settings ─────────────────────────────────────────────────────
        UserSettings: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            notifyMessages: { type: 'boolean', default: true },
            notifyMentions: { type: 'boolean', default: true },
            notifyReactions: { type: 'boolean', default: true },
            notifyFriendRequests: { type: 'boolean', default: true },
            notifyCalls: { type: 'boolean', default: true },
            showOnlineStatus: { type: 'boolean', default: true },
            allowFriendRequests: { type: 'boolean', default: true },
            theme: { type: 'string', enum: ['light', 'dark', 'system'], default: 'system' },
            language: { type: 'string', example: 'en', default: 'en' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Two-Factor Auth ───────────────────────────────────────────────────
        TwoFactorSetupResponse: {
          type: 'object',
          properties: {
            secret: { type: 'string', description: 'Base32 TOTP secret (show as text fallback)' },
            otpauthUrl: { type: 'string', description: 'otpauth:// URI — pass to a QR library' },
            qrCodeDataUrl: { type: 'string', description: 'Base64 data URL of the QR code image — render as <img src="..." />' },
          },
        },
        TwoFactorRequiredResponse: {
          type: 'object',
          description: 'Returned by POST /auth/login when the account has 2FA enabled. Exchange twoFactorToken via POST /auth/2fa/verify.',
          properties: {
            requiresTwoFactor: { type: 'boolean', example: true },
            twoFactorToken: { type: 'string', description: 'Short-lived JWT (5 min) to use with POST /auth/2fa/verify' },
          },
        },
        // ── Block ─────────────────────────────────────────────────────────────
        BlockedUser: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Block record ID' },
            blockerId: { type: 'string', format: 'uuid' },
            blockedId: { type: 'string', format: 'uuid' },
            reason: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            blocked: { $ref: '#/components/schemas/User' },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'Registration, login, token refresh, and two-factor authentication' },
      { name: 'Messages', description: 'Send, edit, delete, react, pin messages; chat list' },
      { name: 'Groups', description: 'Group creation, membership, and management' },
      { name: 'Calls', description: 'Audio/video calls via Jitsi integration' },
      { name: 'Notifications', description: 'In-app notification feed with real-time Socket.IO delivery' },
      { name: 'Upload', description: 'Cloudinary media upload — images, videos, documents, avatars' },
      { name: 'Users', description: 'User profiles, friend system, block/unblock, settings' },
      { name: 'AI-Agent', description: 'AI Agent with multi-provider fallback (OpenAI, Gemini, DeepSeek)' },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './modules/**/*.controller.ts',
    './modules/**/*.routes.ts',
    './modules/**/*.gateway.ts',
    './dist/modules/**/*.controller.js',
    './dist/modules/**/*.routes.js',
    './dist/modules/**/*.gateway.js',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
