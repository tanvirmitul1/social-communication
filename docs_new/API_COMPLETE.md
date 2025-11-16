# Complete API Documentation for Social Communication Platform

This comprehensive API documentation contains everything needed to build a complete frontend for the Social Communication platform. It includes REST API endpoints, WebSocket events, data models, authentication flows, and implementation examples.

## Table of Contents

1. [Base Information](#base-information)
2. [Authentication](#authentication)
3. [REST API Endpoints](#rest-api-endpoints)
4. [WebSocket Events](#websocket-events)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Implementation Examples](#implementation-examples)

## Base Information

- **Base URL**: `http://localhost:3000/api/v1` (Development)
- **WebSocket URL**: `http://localhost:3000`
- **Swagger UI**: `http://localhost:3000/api/docs`
- **Health Check**: `http://localhost:3000/health`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Tokens are returned on successful registration or login.

### Token Types

- **Access Token**: Short-lived token (15 minutes) used for API requests
- **Refresh Token**: Long-lived token (7 days) used to obtain new access tokens

### Why Two Tokens?

1. **Security**: Short-lived access tokens minimize the risk if compromised
2. **User Experience**: Long-lived refresh tokens prevent frequent re-authentication
3. **Revocation**: Refresh tokens can be revoked for immediate logout

### Using Tokens

Include the access token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

### WebSocket Authentication

For WebSocket connections:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN',
  },
});
```

### Authentication Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. Register
       ├─────────────────────────────────────────────┐
       │ POST /auth/register                         │
       │ { username, email, password }               │
       │                                             │
       │ ◄─────────────────────────────────────────┐ │
       │ 201 Created                                │ │
       │ { user }                                   │ │
       │                                             │
       │ 2. Login                                    │
       ├─────────────────────────────────────────────┤
       │ POST /auth/login                            │
       │ { email, password }                         │
       │                                             │
       │ ◄─────────────────────────────────────────┐ │
       │ 200 OK                                     │ │
       │ { user, accessToken, refreshToken }        │ │
       │                                             │
       │ 3. Access Protected Resource                │
       ├─────────────────────────────────────────────┤
       │ GET /auth/me                                │
       │ Authorization: Bearer <accessToken>         │
       │                                             │
       │ ◄─────────────────────────────────────────┐ │
       │ 200 OK                                     │ │
       │ { user }                                   │ │
       │                                             │
       │ 4. Refresh Token (when access token expires)│
       ├─────────────────────────────────────────────┤
       │ POST /auth/refresh                          │
       │ { refreshToken }                            │
       │                                             │
       │ ◄─────────────────────────────────────────┐ │
       │ 200 OK                                     │ │
       │ { accessToken, refreshToken }              │ │
       │                                             │
       │ 5. Logout                                   │
       ├─────────────────────────────────────────────┤
       │ POST /auth/logout                           │
       │ Authorization: Bearer <accessToken>         │
       │ { refreshToken }                            │
       │                                             │
       │ ◄─────────────────────────────────────────┐ │
       │ 200 OK                                     │ │
       └─────────────────────────────────────────────┘
```

## REST API Endpoints

### Authentication Endpoints

#### POST /auth/register

Register a new user account.

**Request Body**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Password123"
}
```

**Validation**:
- `username`: 3-50 characters, alphanumeric and underscores only
- `email`: Valid email format
- `password`: Min 8 characters, must contain uppercase, lowercase, and number

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "avatar": null,
    "statusMessage": null,
    "role": "USER",
    "isOnline": false,
    "lastSeen": "2025-01-01T00:00:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Rate Limit**: 5 requests per 15 minutes

#### POST /auth/login

Login with email and password.

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "USER",
      "isOnline": true,
      "lastSeen": "2025-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Rate Limit**: 5 requests per 15 minutes

#### POST /auth/logout

Logout from current device.

**Authentication**: Required
**Request Body**:
```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

#### POST /auth/logout-all

Logout from all devices.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out from all devices",
  "data": null
}
```

#### POST /auth/refresh

Refresh access token using refresh token.

**Request Body**:
```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

#### GET /auth/me

Get current authenticated user's profile.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "statusMessage": "Available",
    "role": "USER",
    "isOnline": true,
    "lastSeen": "2025-01-01T00:00:00.000Z"
  }
}
```

### User Endpoints

#### GET /users/{id}

Get user by ID.

**Authentication**: Required
**Parameters**:
- `id` (path): User UUID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "john_doe",
    "avatar": "https://example.com/avatar.jpg",
    "statusMessage": "Available",
    "isOnline": true,
    "lastSeen": "2025-01-01T00:00:00.000Z"
  }
}
```

#### PATCH /users/{id}

Update user profile.

**Authentication**: Required (can only update own profile)
**Request Body**:
```json
{
  "username": "new_username",
  "avatar": "https://example.com/new-avatar.jpg",
  "statusMessage": "Busy"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "uuid",
    "username": "new_username",
    "avatar": "https://example.com/new-avatar.jpg",
    "statusMessage": "Busy"
  }
}
```

#### DELETE /users/{id}

Delete user account.

**Authentication**: Required (can only delete own account)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": null
}
```

#### GET /users

Search users by username or email.

**Authentication**: Required
**Query Parameters**:
- `query` (required): Search query string
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20, max: 100): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "john_doe",
      "avatar": "https://example.com/avatar.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### GET /users/{id}/presence

Get user's online presence status.

**Authentication**: Required
**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "isOnline": true,
    "lastSeen": "2025-01-01T00:00:00.000Z"
  }
}
```

### Message Endpoints

#### POST /messages

Send a message (group or direct).

**Authentication**: Required
**Request Body**:
```json
{
  "content": "Hello, how are you?",
  "type": "TEXT",
  "receiverId": "user-uuid",
  "groupId": null,
  "parentId": null,
  "metadata": {}
}
```

**Fields**:
- `content`: Message text (1-5000 characters)
- `type`: Message type (`TEXT`, `IMAGE`, `FILE`, `VOICE`, `VIDEO`)
- `receiverId`: Target user ID (for direct messages)
- `groupId`: Target group ID (for group messages)
- `parentId`: Parent message ID (for threaded replies)
- `metadata`: Additional metadata object

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "uuid",
    "senderId": "uuid",
    "receiverId": "uuid",
    "groupId": null,
    "content": "Hello, how are you?",
    "type": "TEXT",
    "status": "SENT",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Rate Limit**: 30 requests per minute

#### GET /messages/{id}

Get message by ID.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "senderId": "uuid",
    "content": "Hello, how are you?",
    "type": "TEXT",
    "status": "SEEN",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### GET /messages/group/{groupId}

Get messages from a group.

**Authentication**: Required
**Query Parameters**:
- `page` (optional, default: 1)
- `limit` (optional, default: 20, max: 100)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "senderId": "uuid",
      "groupId": "uuid",
      "content": "Group message",
      "type": "TEXT",
      "status": "DELIVERED",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### GET /messages/direct/{otherUserId}

Get direct messages with another user.

**Authentication**: Required
**Query Parameters**:
- `page` (optional, default: 1)
- `limit` (optional, default: 20, max: 100)

**Response**: Same structure as group messages

#### PATCH /messages/{id}

Edit a message.

**Authentication**: Required (can only edit own messages)
**Request Body**:
```json
{
  "content": "Updated message content"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Message edited successfully",
  "data": {
    "id": "uuid",
    "content": "Updated message content",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### DELETE /messages/{id}

Delete a message.

**Authentication**: Required (can only delete own messages)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Message deleted successfully",
  "data": null
}
```

#### POST /messages/{id}/delivered

Mark message as delivered.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "DELIVERED"
  }
}
```

#### POST /messages/{id}/seen

Mark message as seen.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "SEEN"
  }
}
```

#### POST /messages/{id}/react

Add reaction to a message.

**Authentication**: Required
**Request Body**:
```json
{
  "emoji": "👍"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Reaction added",
  "data": null
}
```

#### DELETE /messages/{id}/react

Remove reaction from a message.

**Authentication**: Required
**Request Body**:
```json
{
  "emoji": "👍"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Reaction removed",
  "data": null
}
```

#### GET /messages/search

Search messages.

**Authentication**: Required
**Query Parameters**:
- `query` (required): Search query
- `page` (optional, default: 1)
- `limit` (optional, default: 20, max: 100)

**Response**: Same structure as message list endpoints

### Group Endpoints

#### POST /groups

Create a new group.

**Authentication**: Required
**Request Body**:
```json
{
  "title": "Project Team",
  "description": "Discussion group for our project",
  "cover": "https://example.com/cover.jpg",
  "type": "PRIVATE"
}
```

**Fields**:
- `title`: Group name (1-100 characters)
- `description`: Group description (max 500 characters, optional)
- `cover`: Cover image URL (optional)
- `type`: Group type (`PRIVATE`, `PUBLIC`, `SECRET`)

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Group created successfully",
  "data": {
    "id": "uuid",
    "title": "Project Team",
    "description": "Discussion group for our project",
    "cover": "https://example.com/cover.jpg",
    "type": "PRIVATE",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### GET /groups/{id}

Get group by ID.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Project Team",
    "description": "Discussion group for our project",
    "type": "PRIVATE",
    "members": [
      {
        "userId": "uuid",
        "role": "OWNER"
      }
    ]
  }
}
```

#### GET /groups

Get user's groups.

**Authentication**: Required
**Query Parameters**:
- `page` (optional, default: 1)
- `limit` (optional, default: 20, max: 100)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Project Team",
      "type": "PRIVATE"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1
  }
}
```

#### PATCH /groups/{id}

Update group.

**Authentication**: Required (must be OWNER or ADMIN)
**Request Body**:
```json
{
  "title": "Updated Group Name",
  "description": "Updated description",
  "cover": "https://example.com/new-cover.jpg",
  "type": "PUBLIC"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Group updated successfully",
  "data": {
    "id": "uuid",
    "title": "Updated Group Name"
  }
}
```

#### DELETE /groups/{id}

Delete group.

**Authentication**: Required (must be OWNER)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Group deleted successfully",
  "data": null
}
```

#### POST /groups/{id}/members

Add member to group.

**Authentication**: Required (must be OWNER or ADMIN)
**Request Body**:
```json
{
  "userId": "user-uuid",
  "role": "MEMBER"
}
```

**Roles**: `MEMBER`, `ADMIN`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Member added successfully",
  "data": null
}
```

#### DELETE /groups/{id}/members/{userId}

Remove member from group.

**Authentication**: Required (must be OWNER or ADMIN)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Member removed successfully",
  "data": null
}
```

#### POST /groups/{id}/leave

Leave group.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Left group successfully",
  "data": null
}
```

### Call Endpoints

#### POST /calls

Initiate a new call.

**Authentication**: Required
**Request Body**:
```json
{
  "type": "VIDEO",
  "participantIds": ["user-uuid-1", "user-uuid-2"],
  "groupId": null
}
```

**Fields**:
- `type`: Call type (`AUDIO`, `VIDEO`)
- `participantIds`: Array of participant user IDs
- `groupId`: Group ID (optional, for group calls)

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Call initiated successfully",
  "data": {
    "call": {
      "id": "uuid",
      "initiatorId": "uuid",
      "roomId": "jitsi-room-id",
      "type": "VIDEO",
      "status": "RINGING",
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    "roomUrl": "https://meet.jitsi.com/room-name",
    "token": "jwt-token-for-jitsi"
  }
}
```

#### GET /calls/{id}

Get call by ID.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "initiatorId": "uuid",
    "roomId": "jitsi-room-id",
    "type": "VIDEO",
    "status": "ONGOING",
    "participants": [
      {
        "userId": "uuid",
        "joinedAt": "2025-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### GET /calls

Get user's call history.

**Authentication**: Required
**Query Parameters**:
- `page` (optional, default: 1)
- `limit` (optional, default: 20, max: 100)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "VIDEO",
      "status": "ENDED",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "endedAt": "2025-01-01T00:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### POST /calls/{id}/join

Join an existing call.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Joined call successfully",
  "data": {
    "call": {
      "id": "uuid",
      "roomId": "jitsi-room-id",
      "status": "ONGOING"
    },
    "roomUrl": "https://meet.jitsi.com/room-name",
    "token": "jwt-token-for-jitsi"
  }
}
```

#### POST /calls/{id}/end

End a call.

**Authentication**: Required (only call initiator can end)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Call ended successfully",
  "data": {
    "id": "uuid",
    "status": "ENDED",
    "endedAt": "2025-01-01T00:30:00.000Z"
  }
}
```

#### POST /calls/{id}/leave

Leave a call.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Left call successfully",
  "data": null
}
```

#### POST /calls/{id}/reject

Reject a call.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Call rejected",
  "data": {
    "id": "uuid",
    "status": "REJECTED"
  }
}
```

### Health Check Endpoints

#### GET /health

Basic health check.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-01T00:00:00.000Z",
    "uptime": 3600
  }
}
```

#### GET /health/ready

Readiness check (checks database and Redis connections).

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Service is ready",
  "data": {
    "status": "ready",
    "checks": {
      "database": "connected",
      "redis": "connected"
    }
  }
}
```

#### GET /metrics

Prometheus-compatible metrics.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Metrics retrieved",
  "data": {
    "process": {
      "uptime": 3600,
      "memory": {
        "rss": 123456789,
        "heapTotal": 987654321,
        "heapUsed": 456789123,
        "external": 12345678
      },
      "cpu": {
        "user": 1000000,
        "system": 500000
      }
    },
    "nodejs": {
      "version": "v20.0.0",
      "platform": "linux",
      "arch": "x64"
    }
  }
}
```

## WebSocket Events

Connect to WebSocket server: `ws://localhost:3000` or `http://localhost:3000`

### Connection

#### Client Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-access-token',
  },
});
```

Or using headers:

```javascript
const socket = io('http://localhost:3000', {
  extraHeaders: {
    authorization: 'Bearer your-jwt-access-token',
  },
});
```

### Connection Events

#### connect

Emitted when successfully connected to the server.

```javascript
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

#### disconnect

Emitted when disconnected from the server.

```javascript
socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

#### error

Emitted when an error occurs.

```javascript
socket.on('error', (data) => {
  console.error('Error:', data.message);
});
```

**Payload**:
```json
{
  "message": "Error description"
}
```

### Message Events

#### message:send

Send a message via WebSocket.

**Emit**:
```javascript
socket.emit('message:send', {
  content: 'Hello!',
  type: 'TEXT',
  receiverId: 'user-uuid',
  groupId: null,
  parentId: null,
  metadata: {},
});
```

#### message:sent

Confirmation that your message was sent (direct messages only).

**Listen**:
```javascript
socket.on('message:sent', (message) => {
  console.log('Message sent:', message);
});
```

**Payload**:
```json
{
  "id": "uuid",
  "senderId": "uuid",
  "receiverId": "uuid",
  "content": "Hello!",
  "type": "TEXT",
  "status": "SENT",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

#### message:received

Receive a new message.

**Listen**:
```javascript
socket.on('message:received', (message) => {
  console.log('New message:', message);
});
```

**Payload**:
```json
{
  "id": "uuid",
  "senderId": "uuid",
  "receiverId": "uuid",
  "groupId": null,
  "content": "Hello!",
  "type": "TEXT",
  "status": "DELIVERED",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

#### message:edit

Edit a message.

**Emit**:
```javascript
socket.emit('message:edit', {
  messageId: 'message-uuid',
  content: 'Updated content',
});
```

**Listen** (receive edited messages):
```javascript
socket.on('message:edit', (message) => {
  console.log('Message edited:', message);
});
```

#### message:delete

Delete a message.

**Emit**:
```javascript
socket.emit('message:delete', {
  messageId: 'message-uuid',
});
```

**Listen** (receive delete notifications):
```javascript
socket.on('message:delete', (data) => {
  console.log('Message deleted:', data.messageId);
});
```

**Payload**:
```json
{
  "messageId": "uuid"
}
```

#### typing:start

Indicate that user is typing.

**Emit**:
```javascript
socket.emit('typing:start', {
  groupId: 'group-uuid', // For group chats
  receiverId: 'user-uuid', // For direct messages
});
```

**Listen**:
```javascript
socket.on('typing:start', (data) => {
  console.log(`${data.userId} is typing...`);
});
```

**Payload**:
```json
{
  "userId": "uuid",
  "groupId": "uuid"
}
```

#### typing:stop

Indicate that user stopped typing.

**Emit**:
```javascript
socket.emit('typing:stop', {
  groupId: 'group-uuid',
  receiverId: 'user-uuid',
});
```

**Listen**:
```javascript
socket.on('typing:stop', (data) => {
  console.log(`${data.userId} stopped typing`);
});
```

### Call Events

#### call:initiate

Initiate a call via WebSocket.

**Emit**:
```javascript
socket.emit('call:initiate', {
  type: 'VIDEO',
  participantIds: ['user-uuid-1', 'user-uuid-2'],
  groupId: null,
});
```

**Listen** (initiator receives confirmation):
```javascript
socket.on('call:initiate', (data) => {
  console.log('Call initiated:', data.call);
  console.log('Join URL:', data.roomUrl);
  console.log('Token:', data.token);
});
```

#### call:ringing

Receive incoming call notification.

**Listen**:
```javascript
socket.on('call:ringing', (data) => {
  console.log('Incoming call from:', data.initiatorId);
  console.log('Call details:', data.call);
});
```

**Payload**:
```json
{
  "call": {
    "id": "uuid",
    "initiatorId": "uuid",
    "type": "VIDEO",
    "status": "RINGING"
  },
  "initiatorId": "uuid"
}
```

#### call:answer

Answer an incoming call.

**Emit**:
```javascript
socket.emit('call:answer', {
  callId: 'call-uuid',
});
```

**Listen** (receive call details and Jitsi credentials):
```javascript
socket.on('call:answer', (data) => {
  console.log('Call answered:', data.call);
  console.log('Join URL:', data.roomUrl);
  console.log('Token:', data.token);
});
```

#### call:participant:join

Notification when a participant joins the call.

**Listen**:
```javascript
socket.on('call:participant:join', (data) => {
  console.log('User joined call:', data.userId);
});
```

**Payload**:
```json
{
  "callId": "uuid",
  "userId": "uuid"
}
```

#### call:reject

Reject an incoming call.

**Emit**:
```javascript
socket.emit('call:reject', {
  callId: 'call-uuid',
});
```

**Listen** (initiator receives rejection notification):
```javascript
socket.on('call:reject', (data) => {
  console.log('Call rejected by:', data.userId);
});
```

#### call:end

End a call.

**Emit**:
```javascript
socket.emit('call:end', {
  callId: 'call-uuid',
});
```

**Listen** (all participants receive end notification):
```javascript
socket.on('call:end', (data) => {
  console.log('Call ended:', data.callId);
});
```

**Payload**:
```json
{
  "callId": "uuid"
}
```

#### call:participant:leave

Leave a call.

**Emit**:
```javascript
socket.emit('call:participant:leave', {
  callId: 'call-uuid',
});
```

**Listen** (remaining participants receive leave notification):
```javascript
socket.on('call:participant:leave', (data) => {
  console.log('User left call:', data.userId);
});
```

### Presence Events

#### user:online

User came online.

**Listen**:
```javascript
socket.on('user:online', (data) => {
  console.log('User is now online:', data.userId);
});
```

**Payload**:
```json
{
  "userId": "uuid"
}
```

#### user:offline

User went offline.

**Listen**:
```javascript
socket.on('user:offline', (data) => {
  console.log('User is now offline:', data.userId);
});
```

**Payload**:
```json
{
  "userId": "uuid"
}
```

## Data Models

### User

```typescript
interface User {
  id: string;              // UUID
  username: string;        // 3-50 chars, alphanumeric and underscores
  email: string;           // Valid email
  passwordHash: string;    // Argon2 hashed password
  avatar?: string;         // URL to avatar image
  statusMessage?: string;  // User status message
  role: UserRole;          // USER, MODERATOR, ADMIN
  status: UserStatus;      // ACTIVE, INACTIVE, SUSPENDED, DELETED
  isOnline: boolean;       // Online status
  lastSeen: Date;          // Last seen timestamp
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

### Message

```typescript
interface Message {
  id: string;              // UUID
  senderId: string;        // UUID of sender
  groupId?: string;        // UUID of group (if group message)
  receiverId?: string;     // UUID of receiver (if direct message)
  content: string;         // Message content (1-5000 chars)
  type: MessageType;       // TEXT, IMAGE, FILE, VOICE, VIDEO
  metadata?: object;       // Additional metadata
  status: MessageStatus;   // SENT, DELIVERED, SEEN
  isPinned: boolean;       // Whether message is pinned
  parentId?: string;       // UUID of parent message (for replies)
  editedAt?: Date;         // Edit timestamp
  deletedAt?: Date;        // Delete timestamp
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

### Group

```typescript
interface Group {
  id: string;              // UUID
  title: string;           // Group name (1-100 chars)
  description?: string;    // Description (max 500 chars)
  cover?: string;          // Cover image URL
  type: GroupType;         // PRIVATE, PUBLIC, SECRET
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

### Call

```typescript
interface Call {
  id: string;              // UUID
  initiatorId: string;     // UUID of call initiator
  groupId?: string;        // UUID of group (if group call)
  roomId: string;          // Jitsi room ID
  type: CallType;          // AUDIO, VIDEO
  status: CallStatus;      // RINGING, ONGOING, ENDED, MISSED, REJECTED, CANCELED
  startedAt?: Date;        // Call start timestamp
  endedAt?: Date;          // Call end timestamp
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

### Enums

```typescript
enum UserRole {
  USER = "USER",
  MODERATOR = "MODERATOR",
  ADMIN = "ADMIN"
}

enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED"
}

enum MessageType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  FILE = "FILE",
  VOICE = "VOICE",
  VIDEO = "VIDEO",
  SYSTEM = "SYSTEM"
}

enum MessageStatus {
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  SEEN = "SEEN"
}

enum GroupType {
  PRIVATE = "PRIVATE",
  PUBLIC = "PUBLIC",
  SECRET = "SECRET"
}

enum CallType {
  AUDIO = "AUDIO",
  VIDEO = "VIDEO"
}

enum CallStatus {
  RINGING = "RINGING",
  ONGOING = "ONGOING",
  ENDED = "ENDED",
  MISSED = "MISSED",
  REJECTED = "REJECTED",
  CANCELED = "CANCELED"
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Validation error or malformed request
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate user)
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Common Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Rate Limiting

The API implements rate limiting to prevent abuse:

### Limits

1. **Authentication Endpoints** (`/auth/register`, `/auth/login`):
   - Limit: 5 requests per 15 minutes per IP

2. **Message Endpoints** (`POST /messages`):
   - Limit: 30 requests per minute per user

3. **General API**:
   - Limit: 100 requests per 15 minutes per IP

### Rate Limit Headers

Responses include rate limit information in headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "message": "Too many requests, please try again later.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

## Implementation Examples

### JavaScript/TypeScript Client

```javascript
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = 'http://localhost:3000/api/v1';

// REST API Client
class APIClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async login(email, password) {
    const { data } = await this.client.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    return data;
  }

  async sendMessage(content, receiverId) {
    const { data } = await this.client.post('/messages', {
      content,
      receiverId,
      type: 'TEXT',
    });
    return data;
  }
}

// WebSocket Client
class SocketClient {
  constructor() {
    const token = localStorage.getItem('accessToken');
    this.socket = io('http://localhost:3000', {
      auth: { token },
    });

    this.setupListeners();
  }

  setupListeners() {
    this.socket.on('connect', () => {
      console.log('Connected');
    });

    this.socket.on('message:received', (message) => {
      console.log('New message:', message);
    });

    this.socket.on('call:ringing', (data) => {
      console.log('Incoming call from:', data.initiatorId);
    });
  }

  sendMessage(content, receiverId) {
    this.socket.emit('message:send', {
      content,
      receiverId,
      type: 'TEXT',
    });
  }

  startTyping(receiverId) {
    this.socket.emit('typing:start', { receiverId });
  }

  stopTyping(receiverId) {
    this.socket.emit('typing:stop', { receiverId });
  }
}

// Usage
const api = new APIClient();
const socket = new SocketClient();

// Login
await api.login('john@example.com', 'Password123');

// Send message via REST API
await api.sendMessage('Hello!', 'user-uuid');

// Send message via WebSocket
socket.sendMessage('Hello via WebSocket!', 'user-uuid');
```

### React Implementation Example

```jsx
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const ChatApp = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:3000', {
      auth: { token: localStorage.getItem('accessToken') }
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('message:received', (message) => {
      setMessages(prev => [...prev, message]);
    });

    setSocket(newSocket);

    // Cleanup
    return () => newSocket.close();
  }, []);

  const sendMessage = () => {
    if (newMessage.trim() && socket) {
      socket.emit('message:send', {
        content: newMessage,
        receiverId: 'recipient-uuid',
        type: 'TEXT'
      });
      setNewMessage('');
    }
  };

  return (
    <div>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className="message">
            <strong>{msg.senderId}:</strong> {msg.content}
          </div>
        ))}
      </div>
      
      <div className="message-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatApp;
```

This comprehensive API documentation provides all the information needed to build a complete frontend implementation for the Social Communication platform. It includes detailed endpoint specifications, WebSocket event descriptions, data models, and implementation examples.