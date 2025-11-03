# API Overview

Complete API reference for the Social Communication backend.

## Quick Reference

- **Base URL**: `http://localhost:3000/api/v1`
- **Interactive Docs**: http://localhost:3000/api/docs (Swagger UI)
- **Health Check**: http://localhost:3000/health
- **Metrics**: http://localhost:3000/metrics

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Token Types

| Type              | Lifespan             | Purpose                          |
| ----------------- | -------------------- | -------------------------------- |
| **Access Token**  | 15 minutes (default) | Used for API requests            |
| **Refresh Token** | 7 days (default)     | Used to obtain new access tokens |

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

## API Endpoints Summary

### Authentication (6 endpoints)

| Method | Endpoint           | Description                   | Auth Required |
| ------ | ------------------ | ----------------------------- | ------------- |
| POST   | `/auth/register`   | Register a new user           | No            |
| POST   | `/auth/login`      | Login with email and password | No            |
| POST   | `/auth/logout`     | Logout current device         | Yes           |
| POST   | `/auth/logout-all` | Logout all devices            | Yes           |
| POST   | `/auth/refresh`    | Refresh access token          | No            |
| GET    | `/auth/me`         | Get current user profile      | Yes           |

**Rate Limit**: 5 requests per 15 minutes for login/register

### Users (5 endpoints)

| Method | Endpoint              | Description                 | Auth Required |
| ------ | --------------------- | --------------------------- | ------------- |
| GET    | `/users/:id`          | Get user by ID              | Yes           |
| GET    | `/users/search`       | Search users                | Yes           |
| GET    | `/users/:id/presence` | Get user presence status    | Yes           |
| PATCH  | `/users/me`           | Update current user profile | Yes           |
| DELETE | `/users/me`           | Delete current user account | Yes           |

### Messages (10 endpoints)

| Method | Endpoint                        | Description                  | Auth Required |
| ------ | ------------------------------- | ---------------------------- | ------------- |
| POST   | `/messages`                     | Send a message               | Yes           |
| GET    | `/messages/:id`                 | Get message by ID            | Yes           |
| GET    | `/messages/search`              | Search messages              | Yes           |
| GET    | `/messages/group/:groupId`      | Get group messages           | Yes           |
| GET    | `/messages/direct/:otherUserId` | Get direct messages          | Yes           |
| PATCH  | `/messages/:id`                 | Edit a message               | Yes           |
| DELETE | `/messages/:id`                 | Delete a message             | Yes           |
| POST   | `/messages/:id/reaction`        | Add reaction to message      | Yes           |
| DELETE | `/messages/:id/reaction`        | Remove reaction from message | Yes           |
| PATCH  | `/messages/:id/status`          | Update message status        | Yes           |

**Rate Limit**: 30 requests per minute

### Groups (8 endpoints)

| Method | Endpoint                        | Description              | Auth Required |
| ------ | ------------------------------- | ------------------------ | ------------- |
| POST   | `/groups`                       | Create a group           | Yes           |
| GET    | `/groups/:id`                   | Get group by ID          | Yes           |
| GET    | `/groups/my-groups`             | Get user's groups        | Yes           |
| PATCH  | `/groups/:id`                   | Update group             | Yes           |
| DELETE | `/groups/:id`                   | Delete group             | Yes           |
| POST   | `/groups/:id/members`           | Add member to group      | Yes           |
| DELETE | `/groups/:id/members/:memberId` | Remove member from group | Yes           |
| POST   | `/groups/:id/leave`             | Leave group              | Yes           |

### Calls (7 endpoints)

| Method | Endpoint            | Description             | Auth Required |
| ------ | ------------------- | ----------------------- | ------------- |
| POST   | `/calls`            | Initiate a call         | Yes           |
| GET    | `/calls/:id`        | Get call details        | Yes           |
| GET    | `/calls/my-calls`   | Get user's call history | Yes           |
| POST   | `/calls/:id/join`   | Join a call             | Yes           |
| POST   | `/calls/:id/end`    | End a call              | Yes           |
| POST   | `/calls/:id/leave`  | Leave a call            | Yes           |
| POST   | `/calls/:id/reject` | Reject a call           | Yes           |

### System (3 endpoints)

| Method | Endpoint    | Description           | Auth Required |
| ------ | ----------- | --------------------- | ------------- |
| GET    | `/health`   | Health check          | No            |
| GET    | `/metrics`  | System metrics        | No            |
| GET    | `/api/docs` | Swagger documentation | No            |

**Total Endpoints**: 39

## WebSocket Events

### Connection Events

- `connect` - Client connected to server
- `disconnect` - Client disconnected from server
- `authenticate` - Authenticate WebSocket connection

### Messaging Events

| Event              | Direction       | Description               |
| ------------------ | --------------- | ------------------------- |
| `message:send`     | Client → Server | Send a message            |
| `message:sent`     | Server → Client | Message sent confirmation |
| `message:received` | Server → Client | New message received      |
| `message:edit`     | Both            | Message edited            |
| `message:delete`   | Both            | Message deleted           |
| `message:reaction` | Both            | Reaction added/removed    |
| `typing:start`     | Both            | User started typing       |
| `typing:stop`      | Both            | User stopped typing       |

### Call Events

| Event                    | Direction       | Description        |
| ------------------------ | --------------- | ------------------ |
| `call:initiate`          | Client → Server | Initiate a call    |
| `call:ringing`           | Server → Client | Incoming call      |
| `call:answer`            | Both            | Call answered      |
| `call:reject`            | Both            | Call rejected      |
| `call:end`               | Both            | Call ended         |
| `call:participant:join`  | Server → Client | Participant joined |
| `call:participant:leave` | Server → Client | Participant left   |

### Presence Events

| Event          | Direction       | Description       |
| -------------- | --------------- | ----------------- |
| `user:online`  | Server → Client | User came online  |
| `user:offline` | Server → Client | User went offline |

**Total Events**: 20+

## Request/Response Format

### Standard Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Standard Error Response

```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE",
  "statusCode": 400
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## Common Query Parameters

### Pagination

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Example: `/messages?page=2&limit=50`

### Sorting

- `sortBy`: Field to sort by
- `order`: Sort order (`asc` or `desc`)

Example: `/messages?sortBy=createdAt&order=desc`

### Filtering

- `search`: Search query
- `type`: Filter by type
- `status`: Filter by status

Example: `/users/search?search=john&limit=10`

## Error Codes

| Status Code | Error Type            | Description                         |
| ----------- | --------------------- | ----------------------------------- |
| 400         | Bad Request           | Invalid request parameters          |
| 401         | Unauthorized          | Missing or invalid authentication   |
| 403         | Forbidden             | Insufficient permissions            |
| 404         | Not Found             | Resource not found                  |
| 409         | Conflict              | Resource conflict (e.g., duplicate) |
| 422         | Validation Error      | Request validation failed           |
| 429         | Rate Limit Exceeded   | Too many requests                   |
| 500         | Internal Server Error | Server error                        |

## Rate Limiting

Different endpoints have different rate limits:

| Endpoint Type  | Limit        | Window     |
| -------------- | ------------ | ---------- |
| Authentication | 5 requests   | 15 minutes |
| Messaging      | 30 requests  | 1 minute   |
| General API    | 100 requests | 15 minutes |

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Data Validation

### User Registration

```typescript
{
  username: string; // 3-50 chars, alphanumeric and underscores
  email: string; // Valid email format
  password: string; // Min 8 chars, must contain uppercase, lowercase, number
}
```

### Message Creation

```typescript
{
  content: string;       // 1-10000 chars
  receiverId?: string;   // UUID (for direct messages)
  groupId?: string;      // UUID (for group messages)
  type?: MessageType;    // TEXT, IMAGE, FILE, VOICE, VIDEO
  parentId?: string;     // UUID (for replies)
}
```

### Group Creation

```typescript
{
  name: string;          // 1-100 chars
  description?: string;  // Max 500 chars
  type: GroupType;       // PRIVATE, PUBLIC, SECRET
  avatar?: string;       // URL
}
```

## Security Features

- **JWT Authentication** with token rotation
- **Argon2 Password Hashing**
- **CORS** configuration
- **Rate Limiting** per IP and route
- **Input Validation** with Zod schemas
- **Helmet** security headers
- **SQL Injection Protection** via Prisma ORM
- **XSS Protection**
- **Token Blacklisting** on logout

## Best Practices

### 1. Token Management

```javascript
// Store tokens securely
localStorage.setItem('accessToken', token);

// Include in requests
const headers = {
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
};

// Refresh when expired
if (response.status === 401) {
  const newToken = await refreshAccessToken();
  // Retry request with new token
}
```

### 2. Error Handling

```javascript
try {
  const response = await fetch('/api/v1/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(error.message);
  }

  const data = await response.json();
  return data.data;
} catch (error) {
  console.error('Network error:', error);
}
```

### 3. WebSocket Connection

```javascript
const socket = io('http://localhost:3000', {
  auth: { token: accessToken },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

### 4. Pagination

```javascript
async function getAllMessages(userId) {
  let page = 1;
  const limit = 50;
  const allMessages = [];

  while (true) {
    const response = await fetch(`/api/v1/messages/direct/${userId}?page=${page}&limit=${limit}`);
    const data = await response.json();

    allMessages.push(...data.data);

    if (!data.pagination.hasNextPage) break;
    page++;
  }

  return allMessages;
}
```

## Next Steps

- **Interactive Documentation**: Visit http://localhost:3000/api/docs for Swagger UI
- **Practical Examples**: See [examples.md](examples.md) for code examples
- **Architecture**: Read the [Architecture docs](../development/architecture.md)
- **Testing**: Check the [Testing Guide](../development/testing.md)

## Support

For API-related questions:

- Check the interactive Swagger docs at `/api/docs`
- Review the [examples documentation](examples.md)
- Open a GitHub issue with your question
