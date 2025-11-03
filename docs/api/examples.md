# API Examples

Complete examples for using the Social Communication API.

## Authentication

### Register New User

**Request:**
\`\`\`bash
POST /api/v1/auth/register
Content-Type: application/json

{
"username": "john_doe",
"email": "john@example.com",
"password": "SecurePass123"
}
\`\`\`

**Response:**
\`\`\`json
{
"success": true,
"message": "User registered successfully",
"data": {
"id": "uuid",
"username": "john_doe",
"email": "john@example.com",
"role": "USER",
"createdAt": "2024-01-01T00:00:00.000Z"
}
}
\`\`\`

### Login

**Request:**
\`\`\`bash
POST /api/v1/auth/login
Content-Type: application/json

{
"email": "john@example.com",
"password": "SecurePass123"
}
\`\`\`

**Response:**
\`\`\`json
{
"success": true,
"message": "Login successful",
"data": {
"user": {
"id": "uuid",
"username": "john_doe",
"email": "john@example.com"
},
"accessToken": "eyJhbGciOiJIUzI1NiIs...",
"refreshToken": "eyJhbGciOiJIUzI1NiIs...",
"expiresIn": "15m"
}
}
\`\`\`

### Refresh Access Token

**Request:**
\`\`\`bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
"refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
\`\`\`

**Response:**
\`\`\`json
{
"success": true,
"data": {
"accessToken": "new-access-token",
"refreshToken": "new-refresh-token",
"expiresIn": "15m"
}
}
\`\`\`

## User Management

### Get User Profile

**Request:**
\`\`\`bash
GET /api/v1/auth/profile
Authorization: Bearer <access-token>
\`\`\`

**Response:**
\`\`\`json
{
"success": true,
"data": {
"id": "uuid",
"username": "john_doe",
"email": "john@example.com",
"avatar": null,
"statusMessage": "Hey there!",
"isOnline": true,
"lastSeen": "2024-01-01T00:00:00.000Z"
}
}
\`\`\`

### Update Profile

**Request:**
\`\`\`bash
PATCH /api/v1/users/me
Authorization: Bearer <access-token>
Content-Type: application/json

{
"statusMessage": "Busy coding!",
"avatar": "https://example.com/avatar.jpg"
}
\`\`\`

### Search Users

**Request:**
\`\`\`bash
GET /api/v1/users/search?query=john&page=1&limit=20
Authorization: Bearer <access-token>
\`\`\`

**Response:**
\`\`\`json
{
"success": true,
"data": [...],
"meta": {
"page": 1,
"limit": 20,
"total": 5,
"totalPages": 1
}
}
\`\`\`

## Messaging

### Send Direct Message

**Request:**
\`\`\`bash
POST /api/v1/messages
Authorization: Bearer <access-token>
Content-Type: application/json

{
"content": "Hello! How are you?",
"type": "TEXT",
"receiverId": "recipient-user-id"
}
\`\`\`

**Response:**
\`\`\`json
{
"success": true,
"message": "Message sent successfully",
"data": {
"id": "message-uuid",
"senderId": "sender-uuid",
"receiverId": "recipient-uuid",
"content": "Hello! How are you?",
"type": "TEXT",
"status": "SENT",
"createdAt": "2024-01-01T00:00:00.000Z"
}
}
\`\`\`

### Send Group Message

**Request:**
\`\`\`bash
POST /api/v1/messages
Authorization: Bearer <access-token>
Content-Type: application/json

{
"content": "Hello team!",
"type": "TEXT",
"groupId": "group-uuid"
}
\`\`\`

### Get Direct Messages

**Request:**
\`\`\`bash
GET /api/v1/messages/direct/{otherUserId}?page=1&limit=20
Authorization: Bearer <access-token>
\`\`\`

**Response:**
\`\`\`json
{
"success": true,
"data": [
{
"id": "message-uuid",
"senderId": "uuid",
"receiverId": "uuid",
"content": "Hello!",
"type": "TEXT",
"status": "SEEN",
"createdAt": "2024-01-01T00:00:00.000Z",
"sender": {
"id": "uuid",
"username": "john_doe",
"avatar": null
}
}
],
"meta": {
"page": 1,
"limit": 20,
"total": 50,
"totalPages": 3
}
}
\`\`\`

### Edit Message

**Request:**
\`\`\`bash
PATCH /api/v1/messages/{messageId}
Authorization: Bearer <access-token>
Content-Type: application/json

{
"content": "Updated message content"
}
\`\`\`

### Delete Message

**Request:**
\`\`\`bash
DELETE /api/v1/messages/{messageId}
Authorization: Bearer <access-token>
\`\`\`

### Add Reaction

**Request:**
\`\`\`bash
POST /api/v1/messages/{messageId}/reaction
Authorization: Bearer <access-token>
Content-Type: application/json

{
"emoji": "❤️"
}
\`\`\`

### Search Messages

**Request:**
\`\`\`bash
GET /api/v1/messages/search?query=hello&page=1&limit=20
Authorization: Bearer <access-token>
\`\`\`

## Groups

### Create Group

**Request:**
\`\`\`bash
POST /api/v1/groups
Authorization: Bearer <access-token>
Content-Type: application/json

{
"title": "Development Team",
"description": "Team communication channel",
"type": "PRIVATE"
}
\`\`\`

**Response:**
\`\`\`json
{
"success": true,
"message": "Group created successfully",
"data": {
"id": "group-uuid",
"title": "Development Team",
"description": "Team communication channel",
"type": "PRIVATE",
"createdAt": "2024-01-01T00:00:00.000Z",
"members": [
{
"userId": "creator-uuid",
"role": "OWNER",
"user": {
"id": "uuid",
"username": "john_doe",
"avatar": null
}
}
]
}
}
\`\`\`

### Get User Groups

**Request:**
\`\`\`bash
GET /api/v1/groups/my-groups?page=1&limit=20
Authorization: Bearer <access-token>
\`\`\`

### Add Group Member

**Request:**
\`\`\`bash
POST /api/v1/groups/{groupId}/members
Authorization: Bearer <access-token>
Content-Type: application/json

{
"userId": "user-uuid",
"role": "MEMBER"
}
\`\`\`

### Remove Group Member

**Request:**
\`\`\`bash
DELETE /api/v1/groups/{groupId}/members/{memberId}
Authorization: Bearer <access-token>
\`\`\`

### Leave Group

**Request:**
\`\`\`bash
POST /api/v1/groups/{groupId}/leave
Authorization: Bearer <access-token>
\`\`\`

## Calls

### Initiate Call

**Request:**
\`\`\`bash
POST /api/v1/calls
Authorization: Bearer <access-token>
Content-Type: application/json

{
"type": "VIDEO",
"participantIds": ["user-id-1", "user-id-2"]
}
\`\`\`

**Response:**
\`\`\`json
{
"success": true,
"message": "Call initiated successfully",
"data": {
"call": {
"id": "call-uuid",
"initiatorId": "uuid",
"roomId": "social-comm-xyz123",
"type": "VIDEO",
"status": "RINGING",
"createdAt": "2024-01-01T00:00:00.000Z"
},
"roomUrl": "https://meet.jit.si/social-comm-xyz123?jwt=...",
"token": "jwt-token-for-jitsi"
}
}
\`\`\`

### Join Call

**Request:**
\`\`\`bash
POST /api/v1/calls/{callId}/join
Authorization: Bearer <access-token>
\`\`\`

**Response:**
\`\`\`json
{
"success": true,
"message": "Joined call successfully",
"data": {
"call": {...},
"roomUrl": "https://meet.jit.si/room?jwt=...",
"token": "jwt-token"
}
}
\`\`\`

### End Call

**Request:**
\`\`\`bash
POST /api/v1/calls/{callId}/end
Authorization: Bearer <access-token>
\`\`\`

### Get Call History

**Request:**
\`\`\`bash
GET /api/v1/calls/my-calls?page=1&limit=20
Authorization: Bearer <access-token>
\`\`\`

## WebSocket Events

### Connect to WebSocket

**JavaScript:**
\`\`\`javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
auth: {
token: 'your-jwt-access-token'
}
});

socket.on('connect', () => {
console.log('Connected to server');
});

socket.on('disconnect', () => {
console.log('Disconnected from server');
});
\`\`\`

### Send Message via WebSocket

**JavaScript:**
\`\`\`javascript
socket.emit('message:send', {
content: 'Hello from WebSocket!',
type: 'TEXT',
receiverId: 'recipient-uuid'
});

// Listen for confirmation
socket.on('message:sent', (message) => {
console.log('Message sent:', message);
});
\`\`\`

### Receive Messages

**JavaScript:**
\`\`\`javascript
socket.on('message:received', (message) => {
console.log('New message:', message);
// Update UI with new message
});
\`\`\`

### Typing Indicators

**JavaScript:**
\`\`\`javascript
// Start typing
socket.emit('typing:start', {
userId: 'recipient-uuid'
});

// Stop typing
socket.emit('typing:stop', {
userId: 'recipient-uuid'
});

// Listen for typing events
socket.on('typing:start', ({ userId }) => {
console.log(`User ${userId} is typing...`);
});

socket.on('typing:stop', ({ userId }) => {
console.log(`User ${userId} stopped typing`);
});
\`\`\`

### Message Reactions

**JavaScript:**
\`\`\`javascript
// Add reaction
socket.emit('message:reaction', {
messageId: 'message-uuid',
emoji: '❤️',
action: 'add'
});

// Remove reaction
socket.emit('message:reaction', {
messageId: 'message-uuid',
emoji: '❤️',
action: 'remove'
});

// Listen for reactions
socket.on('message:reaction', ({ messageId, userId, emoji, action }) => {
console.log(`${action} reaction ${emoji} to message ${messageId}`);
});
\`\`\`

### Call Events

**JavaScript:**
\`\`\`javascript
// Initiate call
socket.emit('call:initiate', {
callId: 'call-uuid',
participantIds: ['user-1', 'user-2']
});

// Listen for incoming call
socket.on('call:ringing', ({ callId, initiatorId }) => {
console.log(`Incoming call from ${initiatorId}`);
// Show call notification UI
});

// Answer call
socket.emit('call:answer', {
callId: 'call-uuid'
});

// Reject call
socket.emit('call:reject', {
callId: 'call-uuid',
initiatorId: 'initiator-uuid'
});

// End call
socket.emit('call:end', {
callId: 'call-uuid',
participantIds: ['user-1', 'user-2']
});

// Listen for call end
socket.on('call:end', ({ callId }) => {
console.log(`Call ${callId} ended`);
// Close call UI
});
\`\`\`

### Presence Events

**JavaScript:**
\`\`\`javascript
// Listen for user online status
socket.on('user:online', ({ userId }) => {
console.log(`User ${userId} is now online`);
// Update UI
});

socket.on('user:offline', ({ userId }) => {
console.log(`User ${userId} is now offline`);
// Update UI
});
\`\`\`

## Error Handling

### Error Response Format

\`\`\`json
{
"success": false,
"message": "Validation failed",
"code": "VALIDATION_ERROR",
"details": [
{
"field": "email",
"message": "Invalid email format"
}
]
}
\`\`\`

### Common Error Codes

- \`400\` - Bad Request (Validation Error)
- \`401\` - Unauthorized (Invalid/Missing Token)
- \`403\` - Forbidden (Insufficient Permissions)
- \`404\` - Not Found
- \`409\` - Conflict (Duplicate Resource)
- \`429\` - Too Many Requests (Rate Limit)
- \`500\` - Internal Server Error

## Rate Limiting

### Headers

Check rate limit status in response headers:

\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
\`\`\`

### Rate Limit Exceeded

**Response:**
\`\`\`json
{
"success": false,
"message": "Too many requests, please try again later"
}
\`\`\`

## Pagination

### Request

\`\`\`bash
GET /api/v1/messages/group/{groupId}?page=2&limit=50
\`\`\`

### Response

\`\`\`json
{
"success": true,
"data": [...],
"meta": {
"page": 2,
"limit": 50,
"total": 250,
"totalPages": 5
}
}
\`\`\`

## Complete Integration Example

**JavaScript/TypeScript Client:**

\`\`\`typescript
import io from 'socket.io-client';
import axios from 'axios';

class SocialCommClient {
private apiUrl = 'http://localhost:3000/api/v1';
private socket: any;
private accessToken: string = '';

async register(username: string, email: string, password: string) {
const response = await axios.post(\`\${this.apiUrl}/auth/register\`, {
username,
email,
password
});
return response.data;
}

async login(email: string, password: string) {
const response = await axios.post(\`\${this.apiUrl}/auth/login\`, {
email,
password
});
this.accessToken = response.data.data.accessToken;
this.connectWebSocket();
return response.data;
}

connectWebSocket() {
this.socket = io('http://localhost:3000', {
auth: { token: this.accessToken }
});

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('message:received', (message: any) => {
      console.log('New message:', message);
    });

}

async sendMessage(content: string, receiverId: string) {
const response = await axios.post(
\`\${this.apiUrl}/messages\`,
{ content, receiverId, type: 'TEXT' },
{ headers: { Authorization: \`Bearer \${this.accessToken}\` } }
);
return response.data;
}

async getMessages(otherUserId: string, page = 1) {
const response = await axios.get(
\`\${this.apiUrl}/messages/direct/\${otherUserId}?page=\${page}\`,
{ headers: { Authorization: \`Bearer \${this.accessToken}\` } }
);
return response.data;
}
}

// Usage
const client = new SocialCommClient();
await client.login('john@example.com', 'SecurePass123');
await client.sendMessage('Hello!', 'recipient-id');
\`\`\`
