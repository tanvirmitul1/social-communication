import fs from 'fs/promises';
import path from 'path';
import { swaggerSpec } from '../app/config/swagger.js';

async function generateMarkdownDocs() {
  const docsDir = path.join(process.cwd(), 'docs', 'markdown');
  await fs.mkdir(docsDir, { recursive: true });

  // Write swagger spec to JSON
  const swaggerPath = path.join(process.cwd(), 'docs', 'swagger', 'openapi.json');
  await fs.mkdir(path.dirname(swaggerPath), { recursive: true });
  await fs.writeFile(swaggerPath, JSON.stringify(swaggerSpec, null, 2));

  console.log('✓ Generated OpenAPI spec at docs/swagger/openapi.json');

  // Generate README for markdown docs
  const readme = `# API Documentation

## Overview
This directory contains auto-generated API documentation in Markdown format.

## Swagger/OpenAPI
The complete OpenAPI specification is available at \`/api/docs\` when the server is running.

## Endpoints

### Authentication
- POST /api/v1/auth/register - Register a new user
- POST /api/v1/auth/login - Login user
- POST /api/v1/auth/logout - Logout user
- POST /api/v1/auth/refresh - Refresh access token
- GET /api/v1/auth/me - Get current user

### Users
- GET /api/v1/users - Search users
- GET /api/v1/users/:id - Get user by ID
- PATCH /api/v1/users/:id - Update user
- DELETE /api/v1/users/:id - Delete user
- GET /api/v1/users/:id/presence - Get user presence

### Messages
- POST /api/v1/messages - Send a message
- GET /api/v1/messages/:id - Get message by ID
- GET /api/v1/messages/group/:groupId - Get group messages
- GET /api/v1/messages/direct/:userId - Get direct messages
- PATCH /api/v1/messages/:id - Edit message
- DELETE /api/v1/messages/:id - Delete message
- POST /api/v1/messages/:id/react - Add reaction
- DELETE /api/v1/messages/:id/react - Remove reaction

### Groups
- POST /api/v1/groups - Create group
- GET /api/v1/groups - Get user's groups
- GET /api/v1/groups/:id - Get group by ID
- PATCH /api/v1/groups/:id - Update group
- DELETE /api/v1/groups/:id - Delete group
- POST /api/v1/groups/:id/members - Add member
- DELETE /api/v1/groups/:id/members/:userId - Remove member
- POST /api/v1/groups/:id/leave - Leave group

### Calls
- POST /api/v1/calls - Initiate call
- GET /api/v1/calls - Get call history
- GET /api/v1/calls/:id - Get call by ID
- POST /api/v1/calls/:id/join - Join call
- POST /api/v1/calls/:id/end - End call
- POST /api/v1/calls/:id/leave - Leave call
- POST /api/v1/calls/:id/reject - Reject call

## WebSocket Events

### Connection
- \`connect\` - Client connected
- \`disconnect\` - Client disconnected
- \`authenticate\` - Authenticate socket connection

### Messaging
- \`message:send\` - Send a message
- \`message:received\` - Message received
- \`message:edit\` - Edit a message
- \`message:delete\` - Delete a message
- \`message:reaction\` - Add/remove reaction
- \`typing:start\` - User started typing
- \`typing:stop\` - User stopped typing

### Calls
- \`call:initiate\` - Initiate a call
- \`call:ringing\` - Call is ringing
- \`call:answer\` - Answer a call
- \`call:reject\` - Reject a call
- \`call:end\` - End a call
- \`call:participant:join\` - Participant joined
- \`call:participant:leave\` - Participant left

### Presence
- \`presence:update\` - Update presence
- \`user:online\` - User came online
- \`user:offline\` - User went offline
`;

  await fs.writeFile(path.join(docsDir, 'README.md'), readme);
  console.log('✓ Generated Markdown documentation at docs/markdown/README.md');
}

generateMarkdownDocs().catch(console.error);
