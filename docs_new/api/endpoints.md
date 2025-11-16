# REST API Endpoints

Detailed documentation for all REST API endpoints in the Social Communication Platform.

## Authentication Endpoints

### POST /auth/register

Register a new user account.

**Endpoint**: `POST /api/v1/auth/register`

**Rate Limit**: 5 requests per 15 minutes

**Request Body**:
```json
{
  "username": "string",    // 3-50 chars, alphanumeric and underscores
  "email": "string",       // Valid email format
  "password": "string"     // Min 8 chars with uppercase, lowercase, number
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "avatar": "string | null",
    "statusMessage": "string | null",
    "role": "USER",
    "isOnline": false,
    "lastSeen": "ISO 8601 timestamp",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `409 Conflict`: Email or username already exists
- `429 Too Many Requests`: Rate limit exceeded

### POST /auth/login

Login with email and password.

**Endpoint**: `POST /api/v1/auth/login`

**Rate Limit**: 5 requests per 15 minutes

**Request Body**:
```json
{
  "email": "string",       // Valid email
  "password": "string"     // User password
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
      "username": "string",
      "email": "string",
      "role": "USER",
      "isOnline": true,
      "lastSeen": "ISO 8601 timestamp"
    },
    "accessToken": "jwt-token",
    "refreshToken": "jwt-token"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Invalid credentials
- `429 Too Many Requests`: Rate limit exceeded

### POST /auth/logout

Logout from current device.

**Endpoint**: `POST /api/v1/auth/logout`

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "refreshToken": "string"  // Refresh token to invalidate
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

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token

### POST /auth/logout-all

Logout from all devices.

**Endpoint**: `POST /api/v1/auth/logout-all`

**Authentication**: Required (Bearer token)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out from all devices",
  "data": null
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token

### POST /auth/refresh

Refresh access token using refresh token.

**Endpoint**: `POST /api/v1/auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "string"  // Valid refresh token
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-jwt-token",
    "refreshToken": "new-jwt-token"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or expired refresh token

### GET /auth/me

Get current authenticated user's profile.

**Endpoint**: `GET /api/v1/auth/me`

**Authentication**: Required (Bearer token)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "avatar": "string | null",
    "statusMessage": "string | null",
    "role": "USER",
    "isOnline": true,
    "lastSeen": "ISO 8601 timestamp"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token

## User Endpoints

### GET /users/{id}

Get user by ID.

**Endpoint**: `GET /api/v1/users/{id}`

**Authentication**: Required

**Parameters**:
- `id` (path): User UUID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "avatar": "string | null",
    "statusMessage": "string | null",
    "isOnline": true,
    "lastSeen": "ISO 8601 timestamp"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: User not found

### PATCH /users/{id}

Update user profile.

**Endpoint**: `PATCH /api/v1/users/{id}`

**Authentication**: Required (can only update own profile)

**Request Body**:
```json
{
  "username": "string",        // Optional
  "avatar": "string",          // Optional
  "statusMessage": "string"    // Optional
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "uuid",
    "username": "string",
    "avatar": "string | null",
    "statusMessage": "string | null"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Cannot update other user's profile
- `409 Conflict`: Username already exists

### DELETE /users/{id}

Delete user account.

**Endpoint**: `DELETE /api/v1/users/{id}`

**Authentication**: Required (can only delete own account)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": null
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Cannot delete other user's account

### GET /users

Search users by username or email.

**Endpoint**: `GET /api/v1/users`

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
      "username": "string",
      "avatar": "string | null"
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

**Error Responses**:
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Missing or invalid token

### GET /users/{id}/presence

Get user's online presence status.

**Endpoint**: `GET /api/v1/users/{id}/presence`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "isOnline": true,
    "lastSeen": "ISO 8601 timestamp"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: User not found

## Message Endpoints

### POST /messages

Send a message (group or direct).

**Endpoint**: `POST /api/v1/messages`

**Authentication**: Required

**Request Body**:
```json
{
  "content": "string",         // 1-5000 chars
  "type": "TEXT",              // TEXT, IMAGE, FILE, VOICE, VIDEO
  "receiverId": "uuid",        // Target user ID (for direct messages)
  "groupId": "uuid",           // Target group ID (for group messages)
  "parentId": "uuid",          // Parent message ID (for threaded replies)
  "metadata": {}               // Additional metadata object
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "uuid",
    "senderId": "uuid",
    "receiverId": "uuid",
    "groupId": "uuid | null",
    "content": "string",
    "type": "TEXT",
    "status": "SENT",
    "createdAt": "ISO 8601 timestamp"
  }
}
```

**Rate Limit**: 30 requests per minute

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token
- `429 Too Many Requests`: Rate limit exceeded

### GET /messages/{id}

Get message by ID.

**Endpoint**: `GET /api/v1/messages/{id}`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "senderId": "uuid",
    "content": "string",
    "type": "TEXT",
    "status": "SEEN",
    "createdAt": "ISO 8601 timestamp"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Message not found

### GET /messages/group/{groupId}

Get messages from a group.

**Endpoint**: `GET /api/v1/messages/group/{groupId}`

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
      "content": "string",
      "type": "TEXT",
      "status": "DELIVERED",
      "createdAt": "ISO 8601 timestamp"
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

**Error Responses**:
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Group not found

### GET /messages/direct/{otherUserId}

Get direct messages with another user.

**Endpoint**: `GET /api/v1/messages/direct/{otherUserId}`

**Authentication**: Required

**Query Parameters**:
- `page` (optional, default: 1)
- `limit` (optional, default: 20, max: 100)

**Response**: Same structure as group messages

**Error Responses**:
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: User not found

### PATCH /messages/{id}

Edit a message.

**Endpoint**: `PATCH /api/v1/messages/{id}`

**Authentication**: Required (can only edit own messages)

**Request Body**:
```json
{
  "content": "string"  // Updated message content
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Message edited successfully",
  "data": {
    "id": "uuid",
    "content": "string",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Cannot edit other user's message
- `404 Not Found`: Message not found

### DELETE /messages/{id}

Delete a message.

**Endpoint**: `DELETE /api/v1/messages/{id}`

**Authentication**: Required (can only delete own messages)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Message deleted successfully",
  "data": null
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Cannot delete other user's message
- `404 Not Found`: Message not found

### POST /messages/{id}/delivered

Mark message as delivered.

**Endpoint**: `POST /api/v1/messages/{id}/delivered`

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

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Message not found

### POST /messages/{id}/seen

Mark message as seen.

**Endpoint**: `POST /api/v1/messages/{id}/seen`

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

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Message not found

### POST /messages/{id}/react

Add reaction to a message.

**Endpoint**: `POST /api/v1/messages/{id}/react`

**Authentication**: Required

**Request Body**:
```json
{
  "emoji": "string"  // Emoji character
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

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Message not found

### DELETE /messages/{id}/react

Remove reaction from a message.

**Endpoint**: `DELETE /api/v1/messages/{id}/react`

**Authentication**: Required

**Request Body**:
```json
{
  "emoji": "string"  // Emoji character
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

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Message not found

### GET /messages/search

Search messages.

**Endpoint**: `GET /api/v1/messages/search`

**Authentication**: Required

**Query Parameters**:
- `query` (required): Search query
- `page` (optional, default: 1)
- `limit` (optional, default: 20, max: 100)

**Response**: Same structure as message list endpoints

**Error Responses**:
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Missing or invalid token

## Group Endpoints

### POST /groups

Create a new group.

**Endpoint**: `POST /api/v1/groups`

**Authentication**: Required

**Request Body**:
```json
{
  "title": "string",           // 1-100 chars
  "description": "string",     // Max 500 chars, optional
  "cover": "string",           // Cover image URL, optional
  "type": "PRIVATE"            // PRIVATE, PUBLIC, SECRET
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Group created successfully",
  "data": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "cover": "string",
    "type": "PRIVATE",
    "createdAt": "ISO 8601 timestamp"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token

### GET /groups/{id}

Get group by ID.

**Endpoint**: `GET /api/v1/groups/{id}`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "string",
    "description": "string",
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

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Group not found

### GET /groups

Get user's groups.

**Endpoint**: `GET /api/v1/groups`

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
      "title": "string",
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

**Error Responses**:
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Missing or invalid token

### PATCH /groups/{id}

Update group.

**Endpoint**: `PATCH /api/v1/groups/{id}`

**Authentication**: Required (must be OWNER or ADMIN)

**Request Body**:
```json
{
  "title": "string",           // Optional
  "description": "string",     // Optional
  "cover": "string",           // Optional
  "type": "PUBLIC"             // Optional
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Group updated successfully",
  "data": {
    "id": "uuid",
    "title": "string"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Group not found

### DELETE /groups/{id}

Delete group.

**Endpoint**: `DELETE /api/v1/groups/{id}`

**Authentication**: Required (must be OWNER)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Group deleted successfully",
  "data": null
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Group not found

### POST /groups/{id}/members

Add member to group.

**Endpoint**: `POST /api/v1/groups/{id}/members`

**Authentication**: Required (must be OWNER or ADMIN)

**Request Body**:
```json
{
  "userId": "uuid",
  "role": "MEMBER"  // MEMBER, ADMIN
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Member added successfully",
  "data": null
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Group or user not found
- `409 Conflict`: User already member

### DELETE /groups/{id}/members/{userId}

Remove member from group.

**Endpoint**: `DELETE /api/v1/groups/{id}/members/{userId}`

**Authentication**: Required (must be OWNER or ADMIN)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Member removed successfully",
  "data": null
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Group or user not found

### POST /groups/{id}/leave

Leave group.

**Endpoint**: `POST /api/v1/groups/{id}/leave`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Left group successfully",
  "data": null
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Group not found
- `400 Bad Request`: Cannot leave owned group (transfer ownership first)

## Call Endpoints

### POST /calls

Initiate a new call.

**Endpoint**: `POST /api/v1/calls`

**Authentication**: Required

**Request Body**:
```json
{
  "type": "VIDEO",                    // AUDIO, VIDEO
  "participantIds": ["uuid", "uuid"], // Array of participant user IDs
  "groupId": "uuid"                   // Optional, for group calls
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Call initiated successfully",
  "data": {
    "call": {
      "id": "uuid",
      "initiatorId": "uuid",
      "roomId": "string",
      "type": "VIDEO",
      "status": "RINGING",
      "createdAt": "ISO 8601 timestamp"
    },
    "roomUrl": "https://meet.jitsi.com/room-name",
    "token": "jwt-token-for-jitsi"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing or invalid token

### GET /calls/{id}

Get call by ID.

**Endpoint**: `GET /api/v1/calls/{id}`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "initiatorId": "uuid",
    "roomId": "string",
    "type": "VIDEO",
    "status": "ONGOING",
    "participants": [
      {
        "userId": "uuid",
        "joinedAt": "ISO 8601 timestamp"
      }
    ]
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Call not found

### GET /calls

Get user's call history.

**Endpoint**: `GET /api/v1/calls`

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
      "createdAt": "ISO 8601 timestamp",
      "endedAt": "ISO 8601 timestamp"
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

**Error Responses**:
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Missing or invalid token

### POST /calls/{id}/join

Join an existing call.

**Endpoint**: `POST /api/v1/calls/{id}/join`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Joined call successfully",
  "data": {
    "call": {
      "id": "uuid",
      "roomId": "string",
      "status": "ONGOING"
    },
    "roomUrl": "https://meet.jitsi.com/room-name",
    "token": "jwt-token-for-jitsi"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Call not found
- `400 Bad Request`: Call not in joinable state

### POST /calls/{id}/end

End a call.

**Endpoint**: `POST /api/v1/calls/{id}/end`

**Authentication**: Required (only call initiator can end)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Call ended successfully",
  "data": {
    "id": "uuid",
    "status": "ENDED",
    "endedAt": "ISO 8601 timestamp"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Only initiator can end call
- `404 Not Found`: Call not found

### POST /calls/{id}/leave

Leave a call.

**Endpoint**: `POST /api/v1/calls/{id}/leave`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Left call successfully",
  "data": null
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Call not found

### POST /calls/{id}/reject

Reject a call.

**Endpoint**: `POST /api/v1/calls/{id}/reject`

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

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Call not found

## Health Check Endpoints

### GET /health

Basic health check.

**Endpoint**: `GET /api/v1/health`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "healthy",
    "timestamp": "ISO 8601 timestamp",
    "uptime": 3600
  }
}
```

### GET /health/ready

Readiness check (checks database and Redis connections).

**Endpoint**: `GET /api/v1/health/ready`

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

### GET /metrics

Prometheus-compatible metrics.

**Endpoint**: `GET /api/v1/metrics`

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